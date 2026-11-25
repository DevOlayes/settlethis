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

async function createRunnerShareCard(summary:RunnerSummary,playerName:string,avatarUrl?:string,includeReward=false):Promise<File>{
  const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=675;
  const context=canvas.getContext("2d");if(!context)throw new Error("The challenge card could not be prepared.");
  const ctx=context,background=ctx.createLinearGradient(0,0,1200,675);background.addColorStop(0,"#071522");background.addColorStop(.58,"#102b3b");background.addColorStop(1,"#171522");ctx.fillStyle=background;ctx.fillRect(0,0,1200,675);
  ctx.strokeStyle="rgba(39,215,242,.14)";ctx.lineWidth=2;for(let x=0;x<=1200;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,675);ctx.stroke();}for(let y=0;y<=675;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke();}
  ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=4;ctx.strokeRect(54,54,1092,567);ctx.beginPath();ctx.arc(600,338,180,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(600,60);ctx.lineTo(600,615);ctx.stroke();
  ctx.fillStyle="#27d7f2";ctx.font="900 26px Arial";ctx.fillText("SETHIS  ×  FOOTBALL RUNNER",94,116);
  ctx.fillStyle="#f8fafc";ctx.font="900 54px Arial";ctx.fillText("RUN COMPLETE.",94,190);
  ctx.fillStyle="#b7c9d8";ctx.font="700 23px Arial";ctx.fillText("A NEW SCORE IS ON THE BOARD.",96,231);
  ctx.save();ctx.beginPath();ctx.arc(160,340,62,0,Math.PI*2);ctx.closePath();ctx.clip();
  let avatarLoaded=false;
  if(avatarUrl){try{const avatar=new Image();avatar.crossOrigin="anonymous";const loaded=new Promise<void>(resolve=>{avatar.onload=()=>resolve();avatar.onerror=()=>resolve();avatar.src=avatarUrl;});await Promise.race([loaded,new Promise<void>(resolve=>window.setTimeout(resolve,1300))]);if(avatar.complete&&avatar.naturalWidth>0){ctx.drawImage(avatar,98,278,124,124);avatarLoaded=true;}}catch{}}
  if(!avatarLoaded){ctx.fillStyle="#18394b";ctx.fillRect(98,278,124,124);ctx.fillStyle="#27d7f2";ctx.font="900 58px Arial";ctx.textAlign="center";ctx.fillText((playerName.replace(/^@/,"").slice(0,1)||"S").toUpperCase(),160,360);}
  ctx.restore();ctx.textAlign="left";ctx.fillStyle="#f8fafc";ctx.font="900 30px Arial";ctx.fillText(playerName.slice(0,28),255,326);ctx.fillStyle="#9fb5c7";ctx.font="700 19px Arial";ctx.fillText("IS CHALLENGING YOU TO BEAT THIS RUN",255,362);
  ctx.fillStyle="#27d7f2";ctx.font="900 84px Arial";ctx.fillText(summary.points.toLocaleString(),94,500);ctx.fillStyle="#d5e5ef";ctx.font="900 22px Arial";ctx.fillText("POINTS",98,535);
  ctx.fillStyle="#f8fafc";ctx.font="900 34px Arial";ctx.fillText(summary.distance.toLocaleString()+" M",680,490);ctx.fillStyle="#b7c9d8";ctx.font="800 18px Arial";ctx.fillText("DISTANCE",684,523);
  ctx.fillStyle="#f8fafc";ctx.font="900 34px Arial";ctx.fillText(summary.balls.toLocaleString(),930,490);ctx.fillStyle="#b7c9d8";ctx.font="800 18px Arial";ctx.fillText("FOOTBALLS",934,523);
  if(includeReward&&summary.sethis>0){ctx.fillStyle="#27d7f2";ctx.font="900 21px Arial";ctx.fillText("SETHIS REWARD · "+summary.sethis.toLocaleString(),680,550);}ctx.fillStyle="#f6c98c";ctx.font="900 25px Arial";ctx.fillText("CAN YOU BEAT ME?",680,580);
  ctx.fillStyle="#d6e4ee";ctx.font="700 17px Arial";ctx.fillText("OPEN THE CHALLENGE LINK IN THE CAPTION TO PLAY",94,586);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("The challenge image could not be generated.")),"image/png",.94));
  return new File([blob],"sethis-football-run-challenge.png",{type:"image/png"});
}

const EMPTY_HUD: RunnerHud = { distance: 0, points: 0, balls: 0, speed: 1 };
const EMPTY_RECORDS: RunnerRecords = { bestDistance: 0, bestPoints: 0, totalRuns: 0, recentRuns: [] };


export default function FootballRunner({ telegramUser, onBack, preview = false }: Props) {
  const initData = window.Telegram?.WebApp?.initData || "";
  useEffect(() => { if (preview || !telegramUser || !initData) return; const ping = () => { void fetch("/api/game-presence", { method: "POST", headers: { "content-type": "application/json", "x-telegram-init-data": initData }, body: JSON.stringify({ game_key: "football_runner" }), keepalive: true }).catch(() => {}); }; ping(); const timer = window.setInterval(ping, 60000); return () => window.clearInterval(timer); }, [preview, telegramUser, initData]);
  const avatarDiagnostic = window.location.pathname === "/avatar-diagnostic" || new URLSearchParams(window.location.search).get("avatar-test") === "1";
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RunnerControls | null>(null);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const phaseRef = useRef<RunnerPhase>("ready");
  phaseRef.current = phase;
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
  const [botUsername,setBotUsername]=useState("");
  const [runnerAccessUnlocked,setRunnerAccessUnlocked]=useState(false);
  const [shareCard,setShareCard] = useState<File|null>(null);
  const [tutorialOpen,setTutorialOpen]=useState(false);
  const [tutorialStep,setTutorialStep]=useState(0);
  const [tutorialComplete,setTutorialComplete]=useState(()=>{try{return window.localStorage.getItem("sethis_runner_tutorial_v1")==="complete";}catch{return false;}});
  const tutorialPointer=useRef<{x:number;y:number;id:number}|null>(null);
  const [shareCardBusy,setShareCardBusy] = useState(false);
  useEffect(()=>{
    if(!summary||preview){setShareCard(null);setShareCardBusy(false);return;}
    let cancelled=false;setShareCard(null);setShareCardBusy(true);
    const playerName=telegramUser?.username?"@"+telegramUser.username:telegramUser?.first_name||"A SETHIS player";
    void createRunnerShareCard(summary,playerName,telegramUser?.photo_url,true).then(file=>{if(!cancelled)setShareCard(file);}).catch(()=>{if(!cancelled)setShareCard(null);}).finally(()=>{if(!cancelled)setShareCardBusy(false);});
    return()=>{cancelled=true;};
  },[summary?.points,summary?.distance,summary?.balls,summary?.sethis,preview,telegramUser?.username,telegramUser?.first_name,telegramUser?.photo_url]);
  const [rescueBusy, setRescueBusy] = useState(false);
  const [rescueStatus, setRescueStatus] = useState("");
  const [runAchievement, setRunAchievement] = useState<"first" | "record" | "standard">("standard");
  const activeRunIdRef = useRef<string | null>(null);
  const recordsRef = useRef<RunnerRecords>(EMPTY_RECORDS);
  useEffect(() => { setCollectionPulse(hud.balls); }, [hud.balls]);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restart" | "exit" | null>(null);
  const [incomingChallenge] = useState(() => decodeRunnerChallenge(new URLSearchParams(window.location.search).get("challenge") || telegramUser?.runner_challenge || null));
  const [incomingChallengeResult] = useState(() => decodeRunnerChallengeResult(new URLSearchParams(window.location.search).get("challengeResult")));

  useEffect(() => {
    if (preview || !telegramUser || !initData) { setRecordsLoading(false); return; }
    let active = true;
    fetch("/api/runner/config", { headers: { "x-telegram-init-data": initData }, cache: "no-store" }).then(response=>response.json()).then(data=>{if(active){if(typeof data.bot_username==="string")setBotUsername(data.bot_username);setRunnerAccessUnlocked(Boolean(data.daily_access_unlocked));}}).catch(()=>{});
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
          const previousRecords = recordsRef.current;
          setRunAchievement(previousRecords.totalRuns === 0
            ? "first"
            : result.distance > previousRecords.bestDistance || result.points > previousRecords.bestPoints
              ? "record"
              : "standard");
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
          if (preview) { setRunSaveStatus("Browser preview only. This run was not saved and earns no GT or SETHIS."); return; }
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
              setSummary(current=>current?{...current,sethis:Math.max(0,Number(data.sethis_reward)||0)}:current);
              setRunSaveStatus(Number(data.sethis_reward)>0?"Run saved · "+Number(data.sethis_reward).toLocaleString()+" SETHIS earned.":"Run saved · no SETHIS earned on this run.");
            })
            .catch((error) => {
              activeRunIdRef.current = null;
              setRunSaveStatus(error instanceof Error ? error.message : "Your result could not be saved.");
            })
            .finally(() => setSavingRun(false));
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
  }, [preview, initData, avatarDiagnostic]);

  const start = async () => {
    if (startBusy || savingRun) return;
    if (!preview) {
      const webApp=window.Telegram?.WebApp;
      webApp?.expand();
      if(webApp?.requestFullscreen&&!webApp.isFullscreen)webApp.requestFullscreen();
    }
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
      setRunnerAccessUnlocked(Boolean(data.daily_access_unlocked));
      engineRef.current?.start();
    } catch (error) {
      setRunSaveStatus(error instanceof Error ? error.message : "A new run could not be started.");
    } finally {
      setStartBusy(false);
    }
  };
  const requestStart = () => {
    if (!tutorialComplete) { setTutorialStep(0); setTutorialOpen(true); return; }
    void start();
  };
  const completeTutorialAction = (action:"left"|"right"|"jump"|"slide") => {
    const sequence = ["left","right","jump","slide"] as const;
    if (action !== sequence[tutorialStep]) { setTutorialStep(0); return; }
    const next = tutorialStep + 1;
    setTutorialStep(next);
    if (next === sequence.length) { setTutorialComplete(true); try{window.localStorage.setItem("sethis_runner_tutorial_v1","complete");}catch{} setTutorialOpen(false); void start(); }
  };
  const onTutorialPointerDown = (event:React.PointerEvent<HTMLDivElement>) => {
    tutorialPointer.current = {x:event.clientX,y:event.clientY,id:event.pointerId};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onTutorialPointerUp = (event:React.PointerEvent<HTMLDivElement>) => {
    const origin=tutorialPointer.current; tutorialPointer.current=null;
    if(!origin||origin.id!==event.pointerId)return;
    const dx=event.clientX-origin.x,dy=event.clientY-origin.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;
    if(Math.abs(dx)>Math.abs(dy)*1.15)completeTutorialAction(dx<0?"left":"right");
    else completeTutorialAction(dy<0?"jump":"slide");
  };
  const onTutorialKeyDown = (event:React.KeyboardEvent<HTMLDivElement>) => {
    const actions:Record<string,"left"|"right"|"jump"|"slide">={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump",ArrowDown:"slide"};
    const action=actions[event.key];if(action){event.preventDefault();completeTutorialAction(action);}
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
      const result = await showAd({ type: "end", ymid: attempt.ymid, requestVar: "runner_rescue" }) as unknown as { reward_event_type?: string } | undefined;
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
    const url = createRunnerChallengeUrl(challenge,botUsername);
    const playerName = telegramUser?.username ? "@" + telegramUser.username : telegramUser?.first_name || "A SETHIS player";
    const message = playerName + " is challenging you to beat " + summary.points.toLocaleString() + " points and " + summary.distance.toLocaleString() + "m in SETHIS Football Runner. Open the challenge link and take your turn: " + url;
    try {
      const card = shareCard;
      if (!card) { setShareStatus(shareCardBusy ? "Your challenge card is still being prepared. Try again in a moment." : "The challenge card could not be prepared. Please try again."); return; }
      const shareData: ShareData = { title: "Your SETHIS Football Runner challenge", text: message };
      if (navigator.share && typeof navigator.canShare === "function" && navigator.canShare({ files: [card] })) {
        const pendingShare = navigator.share({ ...shareData, files: [card] });
        await pendingShare;
        setShareStatus("Your challenge card and personal challenge link are ready to send.");
      } else {
        const objectUrl = URL.createObjectURL(card);
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = "sethis-football-run-challenge.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
        if (navigator.share) {
          const pendingShare = navigator.share(shareData);
          await pendingShare;
          setShareStatus("Challenge card saved. Your personal challenge link is ready to send.");
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message);
          setShareStatus("Challenge card saved and the invitation caption copied.");
        } else setShareStatus("Challenge card saved to your device.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareStatus(error instanceof Error ? error.message : "Could not prepare your challenge card.");
    }
  };
  const pause = () => engineRef.current?.pause();
  const resume = () => {
    setConfirmAction(null);
    engineRef.current?.resume();
  };
  const requestExit = () => {
    if (phaseRef.current === "running") engineRef.current?.pause();
    setConfirmAction("exit");
  };
  const requestRestart = () => {
    if (phase === "running") engineRef.current?.pause();
    setConfirmAction("restart");
  };
  useEffect(()=>{
    const webApp=window.Telegram?.WebApp;
    if(!webApp)return;
    const backButton=webApp.BackButton;
    const handleBack=()=>requestExit();
    webApp.disableVerticalSwipes?.();
    backButton?.show();
    backButton?.onClick(handleBack);
    const handleDeactivated=()=>{if(phaseRef.current==="running")engineRef.current?.pause();};
    webApp.onEvent?.("deactivated",handleDeactivated);
    return()=>{
      backButton?.offClick(handleBack);
      backButton?.hide();
      webApp.offEvent?.("deactivated",handleDeactivated);
      webApp.enableVerticalSwipes?.();
      if(webApp.isFullscreen)webApp.exitFullscreen?.();
    };
  },[]);
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
    <div className="football-runner-page">
      <header className="runner-topbar">
        <button onClick={requestExit} aria-label="Exit Football Runner">←</button>
        <div className="runner-brand-lockup"><b>SETHIS <i>×</i> RUNNER</b><span>RUNNER FIELD SERIES</span></div>
        <span className="runner-prototype-tag">{preview ? "PREVIEW · NO REWARDS" : ""}</span>
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
                <div className="runner-lobby-hero" aria-label="SETHIS football runner field">
                  <span>THE RUNNER FIELD · ENDLESS RUN</span>
                </div>
                <div className="runner-lobby-title">
                  <div className="runner-lobby-title-copy">
                    <span className="runner-overline">THE RUNNER FIELD CHALLENGE</span>
                    <h1>CHASE <i>THE</i><br/>DISTANCE.</h1>
                    <p>Three lanes. No easy route. Your record to break.</p>
                  </div>
                  <img className="runner-game-emblem" src="/football-runner-icon.svg" alt="SETHIS Football Runner emblem" />
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
                {!preview&&<div className="runner-entry-note"><b>{runnerAccessUnlocked?"ACCESS UNLOCKED TODAY":"500 GT DAILY ACCESS"}</b><span>{runnerAccessUnlocked?"Repeat runs are free for the rest of today.":"Pay once to unlock unlimited runs for today."} Earn SETHIS from verified performance. Less-active accounts have a starter daily limit; consistently active players unlock uncapped performance rewards.</span></div>}
                <div className="runner-ready-actions">
                  <button onClick={requestStart} disabled={startBusy || savingRun}>{savingRun?"SAVING RESULT…":startBusy?"PREPARING RUN…":"START RUN"} <span>→</span></button>
                  <button className="runner-secondary" onClick={() => setInstructionsOpen((open) => !open)} aria-expanded={instructionsOpen}>{instructionsOpen ? "HIDE INSTRUCTIONS" : "HOW TO PLAY"}</button>
                </div>
                <small>SWIPE LEFT OR RIGHT TO CHANGE LANES · UP TO JUMP · DOWN TO SLIDE</small>
              </>}
              {phase === "collision" && <>
                <div className="runner-collision-panel">
                  <span className="runner-overline">COLLISION · YOUR RUN IS STILL HERE</span>
                  <div className="runner-rescue-emblem" aria-hidden="true">▶</div>
                  <h1>DON’T CALL IT YET.</h1>
                  <p>Your distance, score and collected footballs are ready to carry on. Complete a rewarded ad to pick up this same run where you left off.</p>
                  <div className="runner-collision-actions">
                    <button className="runner-rescue-primary" onClick={() => void watchToContinue()} disabled={preview || rescueBusy}>
                      <span className="runner-rescue-button-title">{rescueBusy ? "PREPARING YOUR RESCUE…" : preview ? "WATCH AD IN TELEGRAM" : "WATCH AD & KEEP RUNNING"}</span>
                      <span className="runner-rescue-button-subtitle">{preview ? "Rewarded rescue is available in the Telegram game" : "Complete one short rewarded ad · Continue this run"}</span>
                    </button>
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
                <div className={"runner-result-screen runner-result-" + runAchievement}>
                  <div className="runner-result-kicker"><span>✦</span> {runAchievement === "first" ? "MILESTONE UNLOCKED" : runAchievement === "record" ? "NEW PERSONAL RECORD" : "FULL TIME"} <span>✦</span></div>
                  <h1>{runAchievement === "first" ? "FIRST RUN COMPLETE!" : runAchievement === "record" ? "NEW RECORD!" : "RUN COMPLETE"}</h1>
                  {runAchievement !== "standard" && <div className="runner-achievement-banner">{runAchievement === "first" ? "🏆 YOUR FIRST FINISH ON THE RUNNER FIELD" : "🏆 YOU JUST RAISED YOUR PERSONAL BEST"}</div>}
                  <section className="runner-distance-podium" aria-label="Distance achieved">
                    <div className="runner-podium-stars" aria-hidden="true">✦　★　✦</div>
                    <small>YOUR DISTANCE</small>
                    <b>{summary.distance.toLocaleString()}<em>m</em></b>
                    <span>{runAchievement === "first" ? "FIRST FINISH" : runAchievement === "record" ? "PERSONAL BEST" : "KEEP PUSHING"}</span>
                  </section>
                  <section className="runner-result-metrics" aria-label="Your run summary">
                    <div><small>RUNS PLAYED</small><b>{preview ? "PRACTICE" : (records.totalRuns + (savingRun ? 1 : 0)).toLocaleString()}</b></div>
                    <div><small>FOOTBALLS</small><b>{summary.balls.toLocaleString()}</b></div>
                    <div><small>SETHIS EARNED</small><b>{summary.sethis.toLocaleString()} <em>SETHIS</em></b></div>
                  </section>
                  <p>{preview ? "Practice run only · no account rewards." : savingRun ? "Saving your run…" : runSaveStatus || "Your run has been recorded."}</p>{!preview&&summary.sethis>0&&<div className="runner-result-earned">+{summary.sethis.toLocaleString()} SETHIS EARNED</div>}
                  <section className="runner-share-trophy" aria-label="Share your Football Runner challenge">
                    <div className="runner-share-trophy-brand"><img src="/football-runner-icon.svg" alt="" /><span>SETHIS FOOTBALL RUNNER</span><b>CHALLENGE</b></div>
                    <div className="runner-share-trophy-stars">✦　★　✦</div>
                    <small>{telegramUser?.username?"@"+telegramUser.username:telegramUser?.first_name||"MY RUN"} · MY RECORD</small>
                    <strong>{summary.points.toLocaleString()}<em>PTS</em></strong>
                    <span>{summary.distance.toLocaleString()} M DISTANCE · {summary.balls.toLocaleString()} FOOTBALLS</span>{!preview&&<b className="runner-share-trophy-reward">+{summary.sethis.toLocaleString()} SETHIS EARNED</b>}
                    <b className="runner-share-dare">CAN YOU BEAT ME?</b>
                  </section>
                  <div className="runner-result-actions">
                    <button className="runner-share-action" onClick={()=>void shareRun()} disabled={savingRun||shareCardBusy}><span>↗</span><b>{shareCardBusy?"PREPARING CARD…":"SHARE CHALLENGE CARD"}</b><small>Send your run graphic with the challenge link</small></button>
                    <button onClick={requestStart} disabled={startBusy || savingRun}>{savingRun?"SAVING…":startBusy?"PREPARING…":"PLAY AGAIN"} <span>→</span></button>
                    <button className="runner-secondary" onClick={requestExit}>{preview ? "EXIT PREVIEW" : "EXIT TO GAMES"}</button>
                  </div>
                  {shareStatus && <p className="runner-share-status" role="status">{shareStatus}</p>}
                </div>
              </>}
            </div>
          ) : null}
        {tutorialOpen && <div className="runner-tutorial" role="dialog" aria-modal="true" aria-label="Swipe control tutorial" onPointerDown={onTutorialPointerDown} onPointerUp={onTutorialPointerUp} onPointerCancel={()=>{tutorialPointer.current=null;}} onKeyDown={onTutorialKeyDown} tabIndex={0}>
          <span className="runner-overline">QUICK TOUCH TUTORIAL</span><h2>LEARN THE MOVES</h2><p>Swipe in the direction shown. Complete all four moves and your run starts automatically.</p>
          <div className="runner-tutorial-progress">{["LEFT","RIGHT","JUMP","SLIDE"].map((name,index)=><span key={name} className={index<tutorialStep?"done":index===tutorialStep?"current":""}>{index<tutorialStep?"✓":index+1}</span>)}</div>
          <div className="runner-tutorial-gesture">{["←","→","↑","↓"][tutorialStep]}</div>
          <b>{["SWIPE LEFT · CHANGE LANE","SWIPE RIGHT · CHANGE LANE","SWIPE UP · JUMP","SWIPE DOWN · SLIDE"][tutorialStep]}</b>
          <small>USE YOUR FINGER ON THIS PANEL · WRONG DIRECTION RESETS THE LESSON</small>
        </div>}
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


    </div>
  );
}
