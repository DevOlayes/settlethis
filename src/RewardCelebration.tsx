import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { SoccerBall, Xmark } from "iconoir-react";
import "./RewardCelebration.css";

export type RewardCelebrationData = {
  amount: number;
  token: "SETHIS" | "GT";
  source: string;
};

export default function RewardCelebration({ reward, onClose }: { reward: RewardCelebrationData; onClose: () => void }) {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="reward-celebration-overlay" role="presentation" onClick={onClose}>
    <Confetti width={size.width} height={size.height} numberOfPieces={190} recycle={false} gravity={0.24} tweenDuration={4200} frameRate={45} zIndex={10001} disableForReducedMotion />
    <section className="reward-celebration-card" role="dialog" aria-modal="true" aria-labelledby="reward-celebration-title" onClick={event => event.stopPropagation()}>
      <button type="button" className="reward-celebration-close" onClick={onClose} aria-label="Close reward celebration"><Xmark width={18} height={18}/></button>
      <div className="reward-flight-track" aria-hidden="true"><span className="reward-flight-glow"/><SoccerBall className="reward-flight-ball" width={43} height={43}/></div>
      <span className="reward-celebration-kicker">SETHIS · REWARD UNLOCKED</span>
      <h2 id="reward-celebration-title">That's a win!</h2>
      <p className="reward-celebration-source">{reward.source}</p>
      <div className="reward-celebration-amount"><strong>+{Number(reward.amount).toLocaleString()}</strong><span>{reward.token}</span></div>
      <p className="reward-celebration-confirmation">Your reward has been added to your wallet.</p>
      <button type="button" className="reward-celebration-cta" onClick={onClose}>NICE ONE <span>↗</span></button>
    </section>
  </div>;
}
