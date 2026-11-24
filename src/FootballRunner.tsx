import { useEffect, useRef, useState } from "react";
import { RunnerEngine } from "./football-runner/RunnerEngine";
import AvatarDiagnostic from "./AvatarDiagnostic";
import type { TelegramUser } from "./telegram";
import {
  compareRunnerScores,
  createRunnerChallenge,
  createRunnerChallengeUrl,
  decodeRunnerChallenge,
  decodeRunnerChallengeResult,
} from "./football-runner/challenges";
import type { RunnerControls, RunnerHud, RunnerPhase, RunnerRecords, RunnerSummary } from "./football-runner/types";
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
  const [summary, setSummary] = useState<RunnerSummary | null>(null);
  const [hud, setHud] = useState<RunnerHud>(EMPTY_HUD);
  const [collectionPulse, setCollectionPulse] = useState(0);
  const [engineError, setEngineError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [records, setRecords] = useState<RunnerRecords>(EMPTY_RECORDS);
  const [recordsLoading, setRecordsLoading] = useState(!preview);
  const [recordsError, setRecordsError] = useState("");
  const [startBusy, setStartBusy] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [runSaveStatus, setRunSaveStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [rescueBusy, setRescueBusy] = useState(false);
  const [rescueStatus, setRescueStatus] = useState("");
  const activeRunIdRef = useRef<string | null>(null);
  const recordsRef = useRef<RunnerRecords>(EMPTY_RECORDS);
  useEffect(() => { setCollectionPulse(hud.balls); }, [hud.balls]);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restart" | "exit" | null>(null);
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
        onEnvironmentStatus: (status) => { if (status === "error") setEngineError(true); },
        onSummary: (result) => {
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
      }, "club-ground");
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
  }, [preview, initData, avatarDiagnostic]);

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
  const watchToContinue = async () => {
    if (preview || rescueBusy || !initData || !activeRunIdRef.current) return;
    setRescueBusy(true);
    setRescueStatus("Preparing your rewarded ad…");
    try {
      const startResponse = await fetch("/api/runner/rescue/start", {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ run_id: activeRunIdRef.current }),
      });
      const attempt = await startResponse.json();
      if (!startResponse.ok || typeof attempt.ymid !== "string" || !attempt.zone_id) throw new Error(attempt.error || "A rescue ad is not available right now.");
      setRescueStatus("Watch the full ad to get back into your run.");
      const { default: createAdHandler } = await import("monetag-tg-sdk");
      const showAd = createAdHandler(Number(attempt.zone_id));
      const result = await showAd({ ymid: attempt.ymid, requestVar: "runner_rescue" });
      if (result?.reward_event_type !== "valued") throw new Error("The ad was not completed for a valid reward. Your run will now end.");
      setRescueStatus("Ad completed. Confirming your rescue…");
      let verified = false;
      for (let check = 0; check < 30; check += 1) {
        const statusResponse = await fetch("/api/runner/rescue/status?ymid=" + encodeURIComponent(attempt.ymid), {
          headers: { "x-telegram-init-data": initData }, cache: "no-store",
        });
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          if (status.verified === true && status.status === "valued") { verified = true; break; }
          if (status.status === "non_valued" || status.status === "expired") break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 650));
      }
      if (!verified) throw new Error("Monetag has not confirmed this ad yet. Your run cannot resume without confirmation.");
      setRescueStatus("");
      engineRef.current?.revive();
    } catch (error) {
      setRescueStatus(error instanceof Error ? error.message : "The ad could not be verified. Your run has ended.");
      engineRef.current?.endCollision();
    } finally {
      setRescueBusy(false);
    }
  };
  const endCollision = () => {
    if (rescueBusy) return;
    engineRef.current?.endCollision();
  };

  const shareRun = async () => {
    if (!summary) return;
    const challenge = createRunnerChallenge({ points: summary.points, distance: summary.distance, balls: summary.balls });
    const url = createRunnerChallengeUrl(challenge);
    const playerName = telegramUser?.username ? "@" + telegramUser.username : telegramUser?.first_name || "A SETHIS player";
    const message = playerName + " scored " + summary.points.toLocaleString() + " points and ran " + summary.distance.toLocaleString() + "m in SETHIS Football Runner. Can you beat my score? " + url;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Can you beat my Football Runner score?", text: message, url });
        setShareStatus("Challenge ready to share.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setShareStatus("Challenge copied. Send it to your friends.");
      } else setShareStatus(url);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareStatus("Could not open sharing on this device.");
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
        <div className="runner-brand-lockup"><b>SETHIS <i>×</i> RUNNER</b><span>CLUB GROUND SERIES</span></div>
        <span className="runner-prototype-tag">{preview ? "BROWSER PREVIEW · NO REWARDS" : "TELEGRAM MINI APP"}</span>
        <button className="runner-sound-toggle" type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? "Mute game sound" : "Enable game sound"}>{soundEnabled ? "♫ SOUND ON" : "♪ SOUND OFF"}</button>
      </header>

      <section className="runner-stage-wrap">


        <div className="runner-stage" ref={mountRef}>
          {phase === "running" && <div className="runner-hud" aria-label="Live game statistics" aria-live="off">
          <div className="runner-hud-distance"><small><span>↗</span> DISTANCE</small><b>{hud.distance.toLocaleString()}<em>m</em></b></div>
          <div className="runner-hud-points"><small><span>✦</span> SCORE</small><b key={collectionPulse} className="runner-points-value">{hud.points.toLocaleString()}</b></div>
          <div className="runner-hud-balls"><small><span>⚽</span> BALLS</small><b>{hud.balls.toLocaleString()}</b></div>
          <div className="runner-hud-speed"><small><span>ϟ</span> SPEED</small><b>{hud.speed.toFixed(1)}<em>×</em></b></div>
          </div>}
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
                <div className="runner-lobby-hero" aria-label="Club Ground football course">
                  <img className="runner-game-emblem" src="/football-runner-icon.svg" alt="SETHIS Football Runner emblem" />
                  <span>CLUB GROUND · ENDLESS RUN</span>
                </div>
                <div className="runner-lobby-title">
                  <span className="runner-overline">THE CLUB GROUND CHALLENGE</span>
                  <h1>CHASE <i>THE</i><br/>DISTANCE.</h1>
                  <p>One pitch. Your pace. Your record to break.</p>
                </div>
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
                <section className="runner-lobby-records" aria-label="Your running record">
                  <div><small>BEST DISTANCE</small><b>{preview ? "—" : recordsLoading ? "…" : records.bestDistance.toLocaleString()+" m"}</b></div>
                  <div><small>RUNS PLAYED</small><b>{preview ? "PRACTICE" : recordsLoading ? "…" : records.totalRuns.toLocaleString()}</b></div>
                  {!preview && recordsError && <p className="runner-record-error">{recordsError}</p>}
                </section>
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
                <small>SWIPE OR USE THE CONTROLS BELOW · UP TO JUMP · DOWN TO SLIDE</small>
              </>}
              {phase === "collision" && <>
                <div className="runner-collision-panel">
                  <span className="runner-overline">COLLISION · DOWN ON THE PITCH</span>
                  <h1>ONE MORE RUN?</h1>
                  <p>You hit an obstacle. Watch a complete rewarded ad to continue this same run with your distance, score and footballs intact.</p>
                  <div className="runner-collision-actions">
                    <button onClick={() => void watchToContinue()} disabled={rescueBusy}>{rescueBusy ? "VERIFYING AD…" : "▶ WATCH AD TO CONTINUE"}</button>
                    <button className="runner-secondary" onClick={endCollision} disabled={rescueBusy}>END RUN</button>
                  </div>
                  {rescueStatus && <small className="runner-rescue-status" role="status">{rescueStatus}</small>}
                  <small>UP TO 2 RESCUES PER RUN · 10 PER DAY</small>
                </div>
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
                <div className="runner-result-screen">
                  <div className="runner-result-kicker"><span>✦</span> FULL TIME <span>✦</span></div>
                  <h1>RUN COMPLETE</h1>
                  <section className="runner-distance-podium" aria-label="Best distance achieved">
                    <div className="runner-podium-stars" aria-hidden="true">✦　★　✦</div>
                    <small>YOUR DISTANCE</small>
                    <b>{Math.max(records.bestDistance, summary.distance).toLocaleString()}<em>m</em></b>
                    <span>{summary.distance >= records.bestDistance && summary.distance > 0 ? "RECORD RUN" : "KEEP PUSHING"}</span>
                  </section>
                  <section className="runner-result-metrics" aria-label="Your run summary">
                    <div><small>RUNS PLAYED</small><b>{preview ? "PRACTICE" : (records.totalRuns + (savingRun ? 1 : 0)).toLocaleString()}</b></div>
                    <div><small>FOOTBALLS</small><b>{summary.balls.toLocaleString()}</b></div>
                    <div><small>SETHIS EARNED</small><b>{summary.sethis.toLocaleString()} <em>SETHIS</em></b></div>
                  </section>
                  <p>{preview ? "Practice run only · no account rewards." : savingRun ? "Saving your run…" : runSaveStatus || "Your run has been recorded."}</p>
                  <section className="runner-share-trophy" aria-label="Share your Football Runner challenge">
                    <div className="runner-share-trophy-brand"><img src="/football-runner-icon.svg" alt="" /><span>SETHIS FOOTBALL RUNNER</span><b>CHALLENGE</b></div>
                    <div className="runner-share-trophy-stars">✦　★　✦</div>
                    <small>MY RUN · MY RECORD</small>
                    <strong>{summary.points.toLocaleString()}<em>PTS</em></strong>
                    <span>{summary.distance.toLocaleString()} M DISTANCE · {summary.balls.toLocaleString()} FOOTBALLS</span>
                    <b className="runner-share-dare">CAN YOU BEAT ME?</b>
                  </section>
                  <div className="runner-result-actions">
                    <button onClick={()=>void shareRun()} disabled={savingRun}>CHALLENGE A FRIEND ↗</button>
                    <button onClick={()=>void start()} disabled={startBusy || savingRun}>{savingRun?"SAVING…":startBusy?"PREPARING…":"PLAY AGAIN"} <span>→</span></button>
                    <button className="runner-secondary" onClick={requestExit}>{preview ? "EXIT PREVIEW" : "EXIT TO GAMES"}</button>
                  </div>
                  {shareStatus && <p className="runner-share-status" role="status">{shareStatus}</p>}
                </div>
              </>}
            </div>
          ) : null}
          {phase === "running" && collectionPulse > 0 && <div key={collectionPulse} className="runner-collect-fly" aria-hidden="true"><span>⚽</span><b>+100 PTS</b></div>}
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
          <button type="button" aria-label="Move left" disabled={phase !== "running"} onClick={() => engineRef.current?.act("left")}><span>←</span><small>LEFT</small></button>
          <button type="button" aria-label="Move right" disabled={phase !== "running"} onClick={() => engineRef.current?.act("right")}><span>→</span><small>RIGHT</small></button>
          <button type="button" aria-label="Jump" disabled={phase !== "running"} onClick={() => engineRef.current?.act("jump")}><span>↑</span><small>JUMP</small></button>
          <button type="button" aria-label="Slide" disabled={phase !== "running"} onClick={() => engineRef.current?.act("slide")}><span>↓</span><small>SLIDE</small></button>
        </div>
        <span>SWIPE OR TAP · COLLECT BY KICKING</span>
      </footer>
    </main>
  );
}
