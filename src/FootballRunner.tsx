import { useEffect, useRef, useState } from "react";
import { RunnerEngine } from "./football-runner/RunnerEngine";
import { RUNNER_REWARD_DEMO } from "./football-runner/config";
import {
  compareRunnerScores,
  createRunnerChallenge,
  createRunnerChallengeResultUrl,
  createRunnerChallengeUrl,
  decodeRunnerChallenge,
  decodeRunnerChallengeResult,
  type RunnerChallengeResult,
} from "./football-runner/challenges";
import type { RunnerControls, RunnerHud, RunnerPhase, RunnerRecords, RunnerRunRecord, RunnerSummary } from "./football-runner/types";
import "./FootballRunner.css";

type Props = { onBack: () => void };

const EMPTY_HUD: RunnerHud = { distance: 0, points: 0, balls: 0, speed: 1 };
const RECORDS_KEY = "sethis.runner.records.v1";
const DAILY_PREVIEW_KEY = "sethis.runner.reward-preview.v1";
const EMPTY_RECORDS: RunnerRecords = { bestDistance: 0, bestPoints: 0, totalRuns: 0, recentRuns: [] };

function readRecords(): RunnerRecords {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return EMPTY_RECORDS;
    const parsed = JSON.parse(raw) as Partial<RunnerRecords>;
    return {
      bestDistance: Math.max(0, Number(parsed.bestDistance) || 0),
      bestPoints: Math.max(0, Number(parsed.bestPoints) || 0),
      totalRuns: Math.max(0, Number(parsed.totalRuns) || 0),
      recentRuns: Array.isArray(parsed.recentRuns) ? parsed.recentRuns.slice(0, 20) as RunnerRunRecord[] : [],
    };
  } catch {
    return EMPTY_RECORDS;
  }
}

export default function FootballRunner({ onBack }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RunnerControls | null>(null);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [summary, setSummary] = useState<RunnerSummary | null>(null);
  const [hud, setHud] = useState<RunnerHud>(EMPTY_HUD);
  const [engineError, setEngineError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [records, setRecords] = useState<RunnerRecords>(EMPTY_RECORDS);
  const recordsRef = useRef<RunnerRecords>(EMPTY_RECORDS);
  const [recordFlags, setRecordFlags] = useState({ distance: false, points: false });
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restart" | "exit" | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [incomingChallenge] = useState(() => decodeRunnerChallenge(new URLSearchParams(window.location.search).get("challenge")));
  const [incomingChallengeResult] = useState(() => decodeRunnerChallengeResult(new URLSearchParams(window.location.search).get("challengeResult")));

  useEffect(() => {
    const saved = readRecords();
    recordsRef.current = saved;
    setRecords(saved);
  }, []);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    let engine: RunnerEngine;
    try {
      engine = new RunnerEngine(host, {
        onPhase: setPhase,
        onHud: setHud,
        onSummary: (result) => {
          const today = new Date();
          const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          let previousDailyTotal = 0;
          try {
            const savedDaily = JSON.parse(localStorage.getItem(DAILY_PREVIEW_KEY) || "null") as { day?: string; total?: number } | null;
            if (savedDaily?.day === dayKey) previousDailyTotal = Math.max(0, Math.floor(Number(savedDaily.total) || 0));
          } catch { /* Ignore malformed local preview data. */ }
          const dailyPreviewEarned = Math.min(result.sethis, Math.max(0, RUNNER_REWARD_DEMO.dailyPreviewCap - previousDailyTotal));
          const dailyPreviewTotal = previousDailyTotal + dailyPreviewEarned;
          const rewardResult: RunnerSummary = {
            ...result,
            sethis: dailyPreviewEarned,
            dailyPreviewEarned,
            dailyPreviewTotal,
            dailyPreviewRemaining: Math.max(0, RUNNER_REWARD_DEMO.dailyPreviewCap - dailyPreviewTotal),
          };
          try { localStorage.setItem(DAILY_PREVIEW_KEY, JSON.stringify({ day: dayKey, total: dailyPreviewTotal })); } catch { /* Preview continues for this session. */ }
          setSummary(rewardResult);
          const previous = recordsRef.current;
          setRecordFlags({
            distance: result.distance > previous.bestDistance,
            points: result.points > previous.bestPoints,
          });
          const run: RunnerRunRecord = {
            playedAt: Date.now(),
            distance: result.distance,
            points: result.points,
            balls: result.balls,
          };
          const next: RunnerRecords = {
            bestDistance: Math.max(previous.bestDistance, result.distance),
            bestPoints: Math.max(previous.bestPoints, result.points),
            totalRuns: previous.totalRuns + 1,
            recentRuns: [run, ...previous.recentRuns].slice(0, 20),
          };
          recordsRef.current = next;
          setRecords(next);
          try { localStorage.setItem(RECORDS_KEY, JSON.stringify(next)); } catch { /* Records remain available for this session. */ }
        },
      });
      engine.setSoundEnabled(soundEnabled);
      engineRef.current = engine;
    } catch {
      setEngineError(true);
      return;
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const start = () => {
    setConfirmAction(null);
    setInstructionsOpen(false);
    engineRef.current?.start();
  };
  const pause = () => engineRef.current?.pause();
  const resume = () => {
    setConfirmAction(null);
    engineRef.current?.resume();
  };
  const requestExit = () => {
    if (phase === "running") engineRef.current?.pause();
    setConfirmAction("exit");
  };
  const requestRestart = () => {
    if (phase === "running") engineRef.current?.pause();
    setConfirmAction("restart");
  };
  const confirmPendingAction = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "restart") engineRef.current?.restart();
    if (action === "exit") onBack();
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirmAction) {
        setConfirmAction(null);
        return;
      }
      if (phase === "running") engineRef.current?.pause();
      else if (phase === "paused") requestExit();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [phase, confirmAction]);
  const shareUrl = async (url: string, title: string, message: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: message, url });
        setShareNotice("Challenge link shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNotice("Challenge link copied. Send it to your opponent.");
      } else {
        window.prompt("Copy this challenge link:", url);
        setShareNotice("Copy the link and send it to your opponent.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareNotice("Sharing is unavailable here. You can try copying the link again.");
    }
  };
  const shareMyChallenge = async () => {
    if (!summary) return;
    const challenge = createRunnerChallenge({ points: summary.points, distance: summary.distance, balls: summary.balls });
    const url = createRunnerChallengeUrl(challenge);
    await shareUrl(url, "Beat my Football Runner score", `I scored ${summary.points.toLocaleString()} points in SETHIS Football Runner. Think you can beat me?`);
  };
  const shareChallengeResult = async () => {
    if (!summary || !incomingChallenge) return;
    const result: RunnerChallengeResult = {
      version: 1,
      challenge: incomingChallenge,
      result: { points: summary.points, distance: summary.distance, balls: summary.balls },
      completedAt: Date.now(),
    };
    const url = createRunnerChallengeResultUrl(result);
    await shareUrl(url, "I took your Football Runner challenge", `I scored ${summary.points.toLocaleString()} points. Here's how I did against your challenge.`);
  };
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    engineRef.current?.setSoundEnabled(next);
  };

  return (
    <main className="football-runner-page">
      <header className="runner-topbar">
        <button onClick={requestExit} aria-label="Exit Football Runner">←</button>
        <div><b>SETHIS</b><span>FOOTBALL RUNNER</span></div>
        <span className="runner-prototype-tag">WEB PROTOTYPE</span>
        <button className="runner-sound-toggle" type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? "Mute game sound" : "Enable game sound"}>{soundEnabled ? "♫ SOUND ON" : "♪ SOUND OFF"}</button>
      </header>

      <section className="runner-stage-wrap">
        <div className="runner-hud" aria-label="Live game statistics" aria-live="off">
          <div><small>DISTANCE</small><b>{hud.distance.toLocaleString()} m</b></div>
          <div><small>POINTS</small><b>{hud.points.toLocaleString()}</b></div>
          <div><small>FOOTBALLS</small><b>{hud.balls}</b></div>
          <div><small>SPEED</small><b>{hud.speed.toFixed(1)}×</b></div>
        </div>

        <div className="runner-stage" ref={mountRef}>
          {engineError ? (
            <div className="runner-overlay">
              <span className="runner-overline">GAME ENGINE UNAVAILABLE</span>
              <h1>This device can't start the 3D scene.</h1>
              <p>Try a browser with WebGL support. Your SETHIS account and balances are not affected.</p>
              <button onClick={onBack}>BACK TO SETHIS</button>
            </div>
          ) : phase !== "running" ? (
            <div className="runner-overlay">
              {phase === "ready" && <>
                <div className="runner-intro-art" aria-hidden="true">
                  <div className="runner-intro-pitch"><i/><i/><i/></div>
                  <div className="runner-intro-ball">⚽</div>
                  <span className="runner-intro-speed">ENDLESS MODE</span>
                  <span className="runner-intro-mark">SETHIS · FOOTBALL RUNNER</span>
                </div>
                <span className="runner-overline">THREE LANES. NO SECOND CHANCES.</span>
                <h1>Own the pitch.</h1>
                <p>Read the run. Beat the obstacles. Strike for every glowing ball. How far can you go?</p>
                {incomingChallenge && <section className="runner-challenge-banner">
                  <span>ONE-ON-ONE CHALLENGE · {incomingChallenge.id.slice(0, 8).toUpperCase()}</span>
                  <b>BEAT {incomingChallenge.score.points.toLocaleString()} POINTS</b>
                  <small>{incomingChallenge.score.distance.toLocaleString()} m · {incomingChallenge.score.balls} footballs</small>
                  <i>Highest points wins; distance, then footballs, break ties. Send your result back after the run. Shared scores are not verified.</i>
                </section>}
                {incomingChallengeResult && <section className="runner-challenge-banner runner-challenge-result-banner">
                  <span>CHALLENGE RESULT RECEIVED</span>
                  <b>{compareRunnerScores(incomingChallengeResult.result, incomingChallengeResult.challenge.score) > 0 ? "YOUR CHALLENGE WAS BEATEN" : compareRunnerScores(incomingChallengeResult.result, incomingChallengeResult.challenge.score) < 0 ? "YOU HELD THE SCORE" : "IT'S A TIE"}</b>
                  <small>Original: {incomingChallengeResult.challenge.score.points.toLocaleString()} pts · Reply: {incomingChallengeResult.result.points.toLocaleString()} pts</small>
                  <i>{new Date(incomingChallengeResult.completedAt).toLocaleString()} · Self-reported web result, not server-verified.</i>
                </section>}
                <div className="runner-personal-best">
                  <span>PERSONAL BEST</span>
                  <b>{records.bestDistance.toLocaleString()} m</b>
                  <i>{records.bestPoints.toLocaleString()} points · {records.totalRuns} {records.totalRuns === 1 ? "run" : "runs"}</i>
                </div>
                <button className="runner-leaderboard-toggle" onClick={() => setLeaderboardOpen((open) => !open)} aria-expanded={leaderboardOpen}>{leaderboardOpen ? "HIDE MY LEADERBOARD" : "MY LEADERBOARD"} <span>{records.recentRuns.length} RUNS ↕</span></button>
                {leaderboardOpen && <section className="runner-local-leaderboard"><div className="runner-instructions-heading">TOP SCORES · RECENT 20 RUNS</div>
                  {[...records.recentRuns].sort((a,b) => b.points-a.points || b.distance-a.distance || b.balls-a.balls).slice(0,5).map((run,index) => <div key={`${run.playedAt}-${index}`}><b>#{index+1}</b><span>{run.points.toLocaleString()} pts</span><small>{run.distance.toLocaleString()} m · {run.balls} balls</small></div>)}
                  {records.recentRuns.length === 0 && <p>Complete a run to start your personal leaderboard.</p>}
                  <small>Private to this browser/device. Not a global ranking.</small>
                </section>}
                {records.recentRuns.length > 0 && <div className="runner-recent-runs">
                  <span>RECENT RUNS</span>
                  {records.recentRuns.slice(0, 3).map((run) => <div key={run.playedAt}>
                    <b>{run.distance.toLocaleString()} m</b><i>{run.points.toLocaleString()} pts · {run.balls} balls</i>
                  </div>)}
                </div>}
                {instructionsOpen && <section className="runner-instructions" aria-label="How to play">
                  <div className="runner-instructions-heading">HOW TO PLAY</div>
                  <div className="runner-instruction-row"><b>← / →</b><span>Change lanes to avoid obstacles.</span></div>
                  <div className="runner-instruction-row"><b>↑ / SPACE</b><span>Jump over cones and low hurdles.</span></div>
                  <div className="runner-instruction-row"><b>↓</b><span>Slide beneath low training bars.</span></div>
                  <div className="runner-instruction-row"><b>FOOTBALLS</b><span>Move into their lane to collect them automatically.</span></div>
                  <p>One collision ends the run. Watch the route ahead and keep a safe lane open.</p>
                </section>}
                <div className="runner-ready-actions">
                  <button onClick={start}>START RUN <span>→</span></button>
                  <button className="runner-secondary" onClick={() => setInstructionsOpen((open) => !open)} aria-expanded={instructionsOpen}>{instructionsOpen ? "HIDE INSTRUCTIONS" : "HOW TO PLAY"}</button>
                </div>
                {shareNotice && <p className="runner-share-notice" role="status">{shareNotice}</p>}
                <small>SWIPE OR USE THE CONTROLS BELOW · UP TO JUMP · DOWN TO SLIDE</small>
              </>}
              {phase === "paused" && <>
                <span className="runner-overline">TAKE A BREATHER</span>
                <h1>Run paused</h1>
                <p>Your distance and collected footballs are safe.</p>
                <button onClick={resume}>RESUME RUN <span>→</span></button>
                <button className="runner-secondary" onClick={requestRestart}>RESTART RUN</button>
                <button className="runner-text-action" onClick={requestExit}>EXIT TO GAMES</button>
              </>}
              {phase === "over" && summary && <>
                <div className="runner-result-heading">
                  <span className="runner-overline">FULL TIME · RUN SUMMARY</span>
                  <h1>Run complete.</h1>
                  <p>Every metre counts. Here's how you performed.</p>
                </div>
                <section className="runner-score-showcase" aria-label="Final score">
                  <div className="runner-score-label">TOTAL SCORE</div>
                  <strong>{summary.points.toLocaleString()}</strong>
                  <span>POINTS</span>
                  <div className="runner-score-ribbon"><i/> MATCH PERFORMANCE <i/></div>
                </section>
                <section className="runner-stat-strip" aria-label="Run statistics">
                  <div><small>DISTANCE</small><b>{summary.distance.toLocaleString()}<em>m</em></b></div>
                  <div><small>FOOTBALLS</small><b>{summary.balls.toLocaleString()}</b></div>
                  <div><small>BEST DISTANCE</small><b>{records.bestDistance.toLocaleString()}<em>m</em></b></div>
                </section>
                <section className="runner-breakdown-panel">
                  <div className="runner-breakdown-title"><b>PERFORMANCE BREAKDOWN</b><span>POINTS & REWARDS</span></div>
                  <div className="runner-breakdown-row"><span>DISTANCE SCORE</span><b>{summary.distancePoints.toLocaleString()} <i>PTS</i></b></div>
                  <div className="runner-breakdown-row"><span>FOOTBALL COLLECTION</span><b>{summary.footballPoints.toLocaleString()} <i>PTS</i></b></div>
                  <div className="runner-breakdown-divider"/>
                  <div className="runner-breakdown-row runner-reward-row"><span>FOOTBALL REWARD</span><b>{summary.rewardFootball.toLocaleString()}</b></div>
                  <div className="runner-breakdown-row runner-reward-row"><span>DISTANCE BONUS</span><b>{summary.rewardDistance.toLocaleString()}</b></div>
                  <div className="runner-breakdown-row runner-reward-row"><span>PERFORMANCE BONUS</span><b>{summary.rewardPerformance.toLocaleString()}</b></div>
                  <div className="runner-estimated-total"><span>ESTIMATED SETHIS</span><b>{summary.sethis.toLocaleString()}</b></div>
                  <div className="runner-daily-progress"><span>DAILY PREVIEW LIMIT</span><b>{(summary.dailyPreviewTotal ?? summary.sethis).toLocaleString()} / {RUNNER_REWARD_DEMO.dailyPreviewCap.toLocaleString()}</b></div>
                </section>
                {(recordFlags.distance || recordFlags.points) && <div className="runner-new-record"><span>✦</span> NEW PERSONAL {recordFlags.distance && recordFlags.points ? "RECORD" : recordFlags.distance ? "DISTANCE RECORD" : "POINTS RECORD"} <span>✦</span></div>}
                {incomingChallenge && <section className="runner-challenge-outcome">
                  <span>YOUR CHALLENGE RESULT</span>
                  <b>{compareRunnerScores({ points: summary.points, distance: summary.distance, balls: summary.balls }, incomingChallenge.score) > 0 ? "YOU BEAT THE CHALLENGE!" : compareRunnerScores({ points: summary.points, distance: summary.distance, balls: summary.balls }, incomingChallenge.score) < 0 ? "THE CHALLENGE HOLDER WINS" : "IT'S A TIE!"}</b>
                  <div><span>YOUR SCORE <strong>{summary.points.toLocaleString()}</strong></span><span>TO BEAT <strong>{incomingChallenge.score.points.toLocaleString()}</strong></span></div><small>Points decide. Distance, then collected footballs, break ties.</small>
                  <button className="runner-secondary" onClick={shareChallengeResult}>SEND RESULT TO CHALLENGER ↗</button>
                </section>}
                <div className="runner-personal-best runner-result-best">
                  <span>ALL-TIME BEST</span>
                  <b>{records.bestDistance.toLocaleString()} m</b>
                  <i>{records.bestPoints.toLocaleString()} points</i>
                </div>
                <p>Prototype estimate only. Daily preview cap remaining: {(summary.dailyPreviewRemaining ?? RUNNER_REWARD_DEMO.dailyPreviewCap).toLocaleString()} SETHIS. No real CT is charged and no SETHIS is credited.</p>
                <div className="runner-rescue-notice"><b>AD RESCUES NOT AVAILABLE IN THIS WEB PREVIEW</b><span>In-game rescue limits are configured, but rewarded-ad verification is not connected. This run has ended.</span></div>
                <div className="runner-ready-actions">
                  <button onClick={start}>RUN AGAIN <span>→</span></button>
                  <button className="runner-secondary" onClick={shareMyChallenge}>CHALLENGE A FRIEND ↗</button>
                  <button className="runner-secondary" onClick={requestExit}>BACK TO GAMES</button>
                </div>
                {shareNotice && <p className="runner-share-notice" role="status">{shareNotice}</p>}
              </>}
            </div>
          ) : null}
        </div>

        {phase === "running" && <button className="runner-pause" onClick={pause} aria-label="Pause run">Ⅱ PAUSE</button>}
        {confirmAction && <div className="runner-confirm-backdrop" role="presentation">
          <section className="runner-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="runner-confirm-title">
            <span className="runner-overline">CONFIRM ACTION</span>
            <h2 id="runner-confirm-title">{confirmAction === "restart" ? "Restart this run?" : "Leave Football Runner?"}</h2>
            <p>{confirmAction === "restart" ? "Your current distance and score will be lost. A fresh run will begin." : phase === "over" ? "Return to the SETHIS games page." : phase === "ready" ? "Return to the SETHIS introduction. No run is currently in progress." : "Your current run will end and its progress will not be saved as a completed run."}</p>
            <div className="runner-confirm-actions">
              <button type="button" onClick={() => setConfirmAction(null)}>KEEP PLAYING</button>
              <button type="button" className="runner-confirm-primary" onClick={confirmPendingAction}>{confirmAction === "restart" ? "RESTART" : "EXIT"}</button>
            </div>
          </section>
        </div>}
      </section>

      <footer className="runner-controls">
        <div className="runner-control-pad" role="group" aria-label="Touch game controls">
          <button type="button" aria-label="Move left" disabled={phase !== "running"} onClick={() => engineRef.current?.act("left")}>←</button>
          <button type="button" aria-label="Move right" disabled={phase !== "running"} onClick={() => engineRef.current?.act("right")}>→</button>
          <button type="button" aria-label="Jump" disabled={phase !== "running"} onClick={() => engineRef.current?.act("jump")}>↑</button>
          <button type="button" aria-label="Slide" disabled={phase !== "running"} onClick={() => engineRef.current?.act("slide")}>↓</button>
        </div>
        <span>SWIPE OR TAP · COLLECT BY KICKING</span>
      </footer>
    </main>
  );
}
