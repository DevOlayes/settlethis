import { useEffect, useRef, useState } from "react";
import { RunnerEngine } from "./football-runner/RunnerEngine";
import type { RunnerControls, RunnerHud, RunnerPhase, RunnerSummary } from "./football-runner/types";
import "./FootballRunner.css";

type Props = { onBack: () => void };

const EMPTY_HUD: RunnerHud = { distance: 0, points: 0, balls: 0, speed: 1 };

export default function FootballRunner({ onBack }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RunnerControls | null>(null);
  const [phase, setPhase] = useState<RunnerPhase>("ready");
  const [summary, setSummary] = useState<RunnerSummary | null>(null);
  const [hud, setHud] = useState<RunnerHud>(EMPTY_HUD);
  const [engineError, setEngineError] = useState(false);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;

    let engine: RunnerEngine;
    try {
      engine = new RunnerEngine(host, {
        onPhase: setPhase,
        onHud: setHud,
        onSummary: setSummary,
      });
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

  const start = () => engineRef.current?.start();
  const pause = () => engineRef.current?.pause();
  const resume = () => engineRef.current?.resume();

  return (
    <main className="football-runner-page">
      <header className="runner-topbar">
        <button onClick={onBack} aria-label="Back to SETHIS introduction">←</button>
        <div><b>SETHIS</b><span>FOOTBALL RUNNER</span></div>
        <span className="runner-prototype-tag">WEB PROTOTYPE</span>
      </header>

      <section className="runner-stage-wrap">
        <div className="runner-hud">
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
                <button onClick={start}>START RUN <span>→</span></button>
                <small>SWIPE OR USE THE CONTROLS BELOW · UP TO JUMP · DOWN TO SLIDE</small>
              </>}
              {phase === "paused" && <>
                <span className="runner-overline">TAKE A BREATHER</span>
                <h1>Run paused</h1>
                <p>Your distance and collected footballs are safe.</p>
                <button onClick={resume}>RESUME RUN <span>→</span></button>
                <button className="runner-secondary" onClick={start}>RESTART RUN</button>
              </>}
              {phase === "over" && summary && <>
                <span className="runner-overline">FULL TIME</span>
                <h1>Run complete.</h1>
                <div className="runner-result-grid">
                  <div><small>DISTANCE</small><b>{summary.distance.toLocaleString()} m</b></div>
                  <div><small>POINTS</small><b>{summary.points.toLocaleString()}</b></div>
                  <div><small>FOOTBALLS</small><b>{summary.balls}</b></div>
                  <div><small>SIMULATED SETHIS</small><b>{summary.sethis.toLocaleString()}</b></div>
                </div>
                <p>Prototype rewards only. No real CT is charged and no SETHIS is credited.</p>
                <button onClick={start}>RUN AGAIN <span>→</span></button>
                <button className="runner-secondary" onClick={onBack}>BACK TO SETHIS</button>
              </>}
            </div>
          ) : null}
        </div>

        {phase === "running" && <button className="runner-pause" onClick={pause}>Ⅱ PAUSE</button>}
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
