import { useEffect, useRef, useState } from "react";
import { RunnerEngine } from "./football-runner/RunnerEngine";
import AvatarDiagnostic from "./AvatarDiagnostic";
import type { TelegramUser } from "./telegram";
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

type Props = { telegramUser: TelegramUser | null; onBack: () => void; preview?: boolean };

const EMPTY_HUD: RunnerHud = { distance: 0, points: 0, balls: 0, speed: 1 };
const EMPTY_RECORDS: RunnerRecords = { bestDistance: 0, bestPoints: 0, totalRuns: 0, recentRuns: [] };


export default function FootballRunner({ telegramUser, onBack, preview = false }: Props) {
  const initData = window.Telegram?.WebApp?.initData || "";
  const avatarDiagnostic = window.location.pathname === "/avatar-diagnostic" || new URLSearchParams(window.location.search).get("avatar-test") === "1";
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RunnerControls | null>(null);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [selectedEnvironment, setSelectedEnvironment] = useState<"classic" | "club-ground">("classic");
  const [summary, setSummary] = useState<RunnerSummary | null>(null);
  const [hud, setHud] = useState<RunnerHud>(EMPTY_HUD);
  const [engineError, setEngineError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [records, setRecords] = useState<RunnerRecords>(EMPTY_RECORDS);
  const [recordsLoading, setRecordsLoading] = useState(!preview);
  const [recordsError, setRecordsError] = useState("");
  const [startBusy, setStartBusy] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [runSaveStatus, setRunSaveStatus] = useState("");
  const activeRunIdRef = useRef<string | null>(null);
  const recordsRef = useRef<RunnerRecords>(EMPTY_RECORDS);
  const [recordFlags, setRecordFlags] = useState({ distance: false, points: false });
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restart" | "exit" | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [incomingChallenge] = useState(() => decodeRunnerChallenge(new URLSearchParams(window.location.search).get("challenge")));
  const [incomingChallengeResult] = useState(() => decodeRunnerChallengeResult(new URLSearchParams(window.location.search).get("challengeResult")));

  useEffect(() => {
    if (preview || !telegramUser || !initData) { setRecordsLoading(false); return; }
    let active = true;
    fetch("/api/runner/records", { headers: { "x-telegram-init-data": initData }, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Your Football Runner record is unavailable.");
        return data.records as RunnerRecords;
      })
      .then((saved) => {
        if (!active) return;
        const next: RunnerRecords = {
          bestDistance: Math.max(0, Number(saved.bestDistance) || 0),
          bestPoints: Math.max(0, Number(saved.bestPoints) || 0),
          totalRuns: Math.max(0, Number(saved.totalRuns) || 0),
          recentRuns: Array.isArray(saved.recentRuns) ? saved.recentRuns.slice(0, 20) : [],
        };
        recordsRef.current = next;
        setRecords(next);
        setRecordsError("");
      })
      .catch((error) => {
        if (active) setRecordsError(error instanceof Error ? error.message : "Your record could not be loaded.");
      })
      .finally(() => { if (active) setRecordsLoading(false); });
    return () => { active = false; };
  }, [telegramUser, initData, preview]);

  useEffect(() => {
    if (avatarDiagnostic) return;
    const host = mountRef.current;
    if (!host) return;

    let engine: RunnerEngine;
    try {
      engine = new RunnerEngine(host, {
        onPhase: setPhase,
        onHud: setHud,
        onSummary: (result) => {
          const previous = recordsRef.current;
          setRecordFlags({
            distance: result.distance > previous.bestDistance,
            points: result.points > previous.bestPoints,
          });
          setSummary({
            ...result,
            rewardFootball: 0,
            rewardDistance: 0,
            rewardPerformance: 0,
            sethis: 0,
            dailyPreviewEarned: 0,
            dailyPreviewTotal: 0,
            dailyPreviewRemaining: 0,
          });
          if (preview) { setRunSaveStatus("Browser preview only. This run was not saved and earns no CT or SETHIS."); return; }
          const runId = activeRunIdRef.current;
          if (!runId || !initData) {
            setRunSaveStatus("This run could not be linked to your SETHIS account.");
            return;
          }
          setSavingRun(true);
          setRunSaveStatus("Checking and saving your run…");
          fetch("/api/runner/finish", {
            method: "POST",
            headers: { "content-type": "application/json", "x-telegram-init-data": initData },
            body: JSON.stringify({ run_id: runId, distance: result.distance, points: result.points, footballs: result.balls }),
          })
            .then(async (response) => {
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Your result could not be saved.");
              return data;
            })
            .then((data) => {
              activeRunIdRef.current = null;
              const saved = data.records as RunnerRecords;
              const next: RunnerRecords = {
                bestDistance: Math.max(0, Number(saved.bestDistance) || 0),
                bestPoints: Math.max(0, Number(saved.bestPoints) || 0),
                totalRuns: Math.max(0, Number(saved.totalRuns) || 0),
                recentRuns: Array.isArray(saved.recentRuns) ? saved.recentRuns.slice(0, 20) : [],
              };
              recordsRef.current = next;
              setRecords(next);
              setRunSaveStatus("Run checked and saved to your SETHIS account.");
            })
            .catch((error) => {
              activeRunIdRef.current = null;
              setRunSaveStatus(error instanceof Error ? error.message : "Your result could not be saved.");
            })
            .finally(() => setSavingRun(false));
        },
      }, selectedEnvironment);
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
  }, [preview, initData, avatarDiagnostic, selectedEnvironment]);

  const start = async () => {
    if (startBusy || savingRun) return;
    if (preview) { setStartBusy(true); setConfirmAction(null); setInstructionsOpen(false); setRunSaveStatus(""); engineRef.current?.start(); setStartBusy(false); return; }
    if (!initData || !telegramUser) return;
    setStartBusy(true);
    setConfirmAction(null);
    setInstructionsOpen(false);
    setRunSaveStatus("");
    try {
      const response = await fetch("/api/runner/start", {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || typeof data.run_id !== "string") throw new Error(data.error || "A new run could not be started.");
      activeRunIdRef.current = data.run_id;
      engineRef.current?.start();
    } catch (error) {
      setRunSaveStatus(error instanceof Error ? error.message : "A new run could not be started.");
    } finally {
      setStartBusy(false);
    }
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
    if (action === "restart") void start();
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

  if (avatarDiagnostic) return <AvatarDiagnostic onBack={onBack} />;

  return (
    <main className="football-runner-page">
      <header className="runner-topbar">
        <button onClick={requestExit} aria-label="Exit Football Runner">←</button>
        <div><b>SETHIS</b><span>FOOTBALL RUNNER</span></div>
        <span className="runner-prototype-tag">{preview ? "BROWSER PREVIEW · NO REWARDS" : "TELEGRAM MINI APP"}</span>
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
              <p>Try a browser with WebGL support. This browser preview does not access accounts, balances or rewards.</p>
              <button onClick={onBack}>BACK TO SETHIS</button>
            </div>
          ) : phase !== "running" ? (
            <div className="runner-overlay">
              {phase === "ready" && <>
                <div className="runner-environment-picker" style={{ display: "flex", gap: 8, width: "100%", margin: "0 0 14px" }}>
                  <button type="button" onClick={() => { setEngineError(false); setSelectedEnvironment("classic"); }} aria-pressed={selectedEnvironment === "classic"} style={{ flex: 1, minWidth: 0, padding: "10px 9px", borderRadius: 11, border: selectedEnvironment === "classic" ? "1px solid #e98272" : "1px solid #ffffff2b", background: selectedEnvironment === "classic" ? "#e982721c" : "#ffffff08", color: "#f4f1f7", textAlign: "left", fontSize: 10, fontWeight: 850, letterSpacing: ".04em" }}>
                    CURRENT ENVIRONMENT <span style={{ display: "block", marginTop: 4, color: "#aaa3b5", fontSize: 9, fontWeight: 600, letterSpacing: "0" }}>Original SETHIS stadium</span>
                  </button>
                  <button type="button" onClick={() => { setEngineError(false); setSelectedEnvironment("club-ground"); }} aria-pressed={selectedEnvironment === "club-ground"} style={{ flex: 1, minWidth: 0, padding: "10px 9px", borderRadius: 11, border: selectedEnvironment === "club-ground" ? "1px solid #e98272" : "1px solid #ffffff2b", background: selectedEnvironment === "club-ground" ? "#e982721c" : "#ffffff08", color: "#f4f1f7", textAlign: "left", fontSize: 10, fontWeight: 850, letterSpacing: ".04em" }}>
                    CLUB GROUND <span style={{ display: "block", marginTop: 4, color: "#aaa3b5", fontSize: 9, fontWeight: 600, letterSpacing: 0 }}>New imported environment</span>
                  </button>
                </div>
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
                  <span>{preview ? "BROWSER PREVIEW" : "PERSONAL BEST"}</span>
                  <b>{preview ? "NOT SAVED" : recordsLoading?"…":records.bestDistance.toLocaleString()+" m"}</b>
                  <i>{preview ? "Practice mode · no account record" : recordsLoading?"Loading account record…":records.bestPoints.toLocaleString()+" points · "+records.totalRuns+" "+(records.totalRuns===1?"run":"runs")}</i>
                  {!preview && recordsError && <small className="runner-record-error">{recordsError}</small>}
                </div>
                <button className="runner-leaderboard-toggle" onClick={() => setLeaderboardOpen((open) => !open)} aria-expanded={leaderboardOpen}>{leaderboardOpen ? "HIDE MY LEADERBOARD" : "MY LEADERBOARD"} <span>{records.recentRuns.length} RUNS ↕</span></button>
                {leaderboardOpen && <section className="runner-local-leaderboard"><div className="runner-instructions-heading">ACCOUNT RECORDS · RECENT RUNS</div>
                  {[...records.recentRuns].sort((a,b) => b.points-a.points || b.distance-a.distance || b.balls-a.balls).slice(0,5).map((run,index) => <div key={`${run.playedAt}-${index}`}><b>#{index+1}</b><span>{run.points.toLocaleString()} pts</span><small>{run.distance.toLocaleString()} m · {run.balls} balls</small></div>)}
                  {records.recentRuns.length === 0 && <p>{preview ? "Browser preview runs are not saved." : "Complete a run to start your personal leaderboard."}</p>}
                  <small>{preview ? "Preview only. No account data or public ranking is used." : "Saved to your SETHIS account. Public ranking eligibility follows score-integrity validation."}</small>
                </section>}
                {!preview && records.recentRuns.length > 0 && <div className="runner-recent-runs">
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
                  <button onClick={()=>void start()} disabled={startBusy || savingRun}>{savingRun?"SAVING RESULT…":startBusy?"PREPARING RUN…":"START RUN"} <span>→</span></button>
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
                  <div className="runner-reward-status"><span>SETHIS REWARDS</span><b>NOT ACTIVE YET</b><small>Only published and approved reward rules can credit your wallet. No estimated reward is shown as earned.</small></div>
                </section>
                {(recordFlags.distance || recordFlags.points) && <div className="runner-new-record"><span>✦</span> NEW PERSONAL {recordFlags.distance && recordFlags.points ? "RECORD" : recordFlags.distance ? "DISTANCE RECORD" : "POINTS RECORD"} <span>✦</span></div>}
                {incomingChallenge && <section className="runner-challenge-outcome">
                  <span>YOUR CHALLENGE RESULT</span>
                  <b>{compareRunnerScores({ points: summary.points, distance: summary.distance, balls: summary.balls }, incomingChallenge.score) > 0 ? "YOU BEAT THE CHALLENGE!" : compareRunnerScores({ points: summary.points, distance: summary.distance, balls: summary.balls }, incomingChallenge.score) < 0 ? "THE CHALLENGE HOLDER WINS" : "IT'S A TIE!"}</b>
                  <div><span>YOUR SCORE <strong>{summary.points.toLocaleString()}</strong></span><span>TO BEAT <strong>{incomingChallenge.score.points.toLocaleString()}</strong></span></div><small>Points decide. Distance, then collected footballs, break ties.</small>
                  <button className="runner-secondary" onClick={shareChallengeResult}>SEND RESULT TO CHALLENGER ↗</button>
                </section>}
                {!preview && <div className="runner-personal-best runner-result-best">
                  <span>ALL-TIME BEST</span>
                  <b>{records.bestDistance.toLocaleString()} m</b>
                  <i>{records.bestPoints.toLocaleString()} points</i>
                </div>}
                <p>{preview ? "Browser preview only. Your run is not saved to an account." : runSaveStatus || "Your score is being prepared for your account record."}</p>
                <div className="runner-rescue-notice"><b>{preview ? "BROWSER PREVIEW · PRACTICE ONLY" : "EARLY ACCESS · FREE ENTRY"}</b><span>{preview ? "No Telegram sign-in, account record, CT deduction or SETHIS reward is connected to this preview." : "No CT is deducted. SETHIS payouts and rewarded-ad rescues are not enabled yet; this run does not create a wallet credit."}</span></div>
                <div className="runner-ready-actions">
                  <button onClick={()=>void start()} disabled={startBusy || savingRun}>{savingRun?"SAVING RESULT…":startBusy?"PREPARING RUN…":"RUN AGAIN"} <span>→</span></button>
                  {!preview && <button className="runner-secondary" onClick={shareMyChallenge}>CHALLENGE A FRIEND ↗</button>}
                  <button className="runner-secondary" onClick={requestExit}>{preview ? "BACK TO SETHIS INTRO" : "BACK TO GAMES"}</button>
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
