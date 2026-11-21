import { useEffect, useRef, useState } from "react";
import { RunnerEngine } from "./football-runner/RunnerEngine";
import { RUNNER_REWARD_DEMO } from "./football-runner/config";
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
                <span className="runner-overline">THREE LANES. ONE ENDLESS RUN.</span>
                <h1>Own the pitch.</h1>
                <p>Dodge the training obstacles, kick glowing footballs and see how far you can go.</p>
                <div className="runner-personal-best">
                  <span>PERSONAL BEST</span>
                  <b>{records.bestDistance.toLocaleString()} m</b>
                  <i>{records.bestPoints.toLocaleString()} points · {records.totalRuns} {records.totalRuns === 1 ? "run" : "runs"}</i>
                </div>
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
                <small>SWIPE OR USE THE CONTROLS BELOW · UP TO JUMP · DOWN TO SLIDE</small>
              </>}
              {phase === "paused" && <>
                <span className="runner-overline">TAKE A BREATHER</span>
                <h1>Run paused</h1>
                <p>Your distance and collected footballs are safe.</p>
                <button onClick={resume}>RESUME RUN <span>→</span></button>
                <button className="runner-secondary" onClick={() => setConfirmAction("restart")}>RESTART RUN</button>
                <button className="runner-text-action" onClick={requestExit}>EXIT TO GAMES</button>
              </>}
              {phase === "over" && summary && <>
                <span className="runner-overline">COLLISION · FULL TIME</span>
                <h1>Run complete.</h1>
                <p>Your run has ended. Here is your performance breakdown.</p>
                <div className="runner-result-grid">
                  <div><small>DISTANCE</small><b>{summary.distance.toLocaleString()} m</b></div>
                  <div><small>TOTAL POINTS</small><b>{summary.points.toLocaleString()}</b></div>
                  <div><small>FOOTBALLS</small><b>{summary.balls}</b></div>
                  <div><small>DISTANCE POINTS</small><b>{summary.distancePoints.toLocaleString()}</b></div>
                  <div><small>COLLECTION POINTS</small><b>{summary.footballPoints.toLocaleString()}</b></div>
                  <div><small>ESTIMATED SETHIS</small><b>{summary.sethis.toLocaleString()}</b></div>
                  <div><small>FOOTBALL REWARD</small><b>{summary.rewardFootball.toLocaleString()}</b></div>
                  <div><small>DISTANCE BONUS</small><b>{summary.rewardDistance.toLocaleString()}</b></div>
                  <div><small>PERFORMANCE BONUS</small><b>{summary.rewardPerformance.toLocaleString()}</b></div>
                  <div><small>DAILY PREVIEW TOTAL</small><b>{(summary.dailyPreviewTotal ?? summary.sethis).toLocaleString()} / {RUNNER_REWARD_DEMO.dailyPreviewCap.toLocaleString()}</b></div>
                </div>
                {(recordFlags.distance || recordFlags.points) && <div className="runner-new-record">
                  NEW PERSONAL {recordFlags.distance && recordFlags.points ? "RECORD" : recordFlags.distance ? "DISTANCE RECORD" : "POINTS RECORD"}!
                </div>}
                <div className="runner-personal-best runner-result-best">
                  <span>ALL-TIME BEST</span>
                  <b>{records.bestDistance.toLocaleString()} m</b>
                  <i>{records.bestPoints.toLocaleString()} points</i>
                </div>
                <p>Prototype estimate only. Daily preview cap remaining: {(summary.dailyPreviewRemaining ?? RUNNER_REWARD_DEMO.dailyPreviewCap).toLocaleString()} SETHIS. No real CT is charged and no SETHIS is credited.</p>
                <div className="runner-rescue-notice"><b>AD RESCUES NOT AVAILABLE IN THIS WEB PREVIEW</b><span>In-game rescue limits are configured, but rewarded-ad verification is not connected. This run has ended.</span></div>
                <div className="runner-ready-actions">
                  <button onClick={start}>RUN AGAIN <span>→</span></button>
                  <button className="runner-secondary" onClick={requestExit}>BACK TO GAMES</button>
                </div>
              </>}
            </div>
          ) : null}
        </div>

        {phase === "running" && <button className="runner-pause" onClick={pause} aria-label="Pause run">Ⅱ PAUSE</button>}
        {confirmAction && <div className="runner-confirm-backdrop" role="presentation">
          <section className="runner-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="runner-confirm-title">
            <span className="runner-overline">CONFIRM ACTION</span>
            <h2 id="runner-confirm-title">{confirmAction === "restart" ? "Restart this run?" : "Leave Football Runner?"}</h2>
            <p>{confirmAction === "restart" ? "Your current distance and score will be lost. A fresh run will begin." : phase === "over" ? "Return to the SETHIS games page." : "Your current run will end and its progress will not be saved as a completed run."}</p>
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
