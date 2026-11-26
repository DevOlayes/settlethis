import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import BrandMark from "./BrandMark";
import "./GiftBoxPreview.css";

export default function GiftBoxPreview() {
  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(0);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const openGift = () => {
    if (opened) return;
    setOpened(true);
    setBurst(value => value + 1);
  };

  const resetGift = () => setOpened(false);

  return (
    <main className={`gift-preview-page ${opened ? "is-open" : ""}`}>
      {opened && <Confetti key={burst} width={viewport.width} height={viewport.height} numberOfPieces={230} recycle={false} gravity={0.2} tweenDuration={5200} frameRate={45} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }} />}
      <header className="gift-preview-header">
        <a className="gift-preview-brand" href="/" aria-label="SETHIS home">
          <BrandMark className="gift-preview-brand-mark" />
          <span><b>SETTLE</b><i>THIS!</i></span>
        </a>
        <span className="gift-preview-tag">WELCOME GIFT PREVIEW</span>
      </header>

      <section className="gift-preview-content">
        <span className="gift-preview-eyebrow">A LITTLE SOMETHING FROM SETHIS</span>
        <h1>{opened ? "Your welcome gift is here." : "Your first gift is waiting."}</h1>
        <p className="gift-preview-intro">{opened ? "A warm welcome to the football reward arena." : "Tap the present to unwrap your 3,500 GT welcome gift."}</p>

        <div className="gift-preview-scene">
          <div className="gift-preview-aura" />
          <div className="gift-preview-floor-glow" />
          <button type="button" className="gift-preview-object" onClick={openGift} disabled={opened} aria-label="Open the 3,500 GT welcome gift" aria-expanded={opened}>
            <span className="gift-preview-gift" aria-hidden="true">
              <span className="gift-preview-light" />
              <span className="gift-preview-prize">
                <span className="gift-preview-prize-star">✦</span>
                <strong>3,500 <small>GT</small></strong>
                <em>YOUR WELCOME GIFT</em>
              </span>
              <span className="gift-preview-box">
                <span className="gift-preview-box-top" />
                <span className="gift-preview-box-front">
                  <span className="gift-preview-front-ribbon" />
                  <span className="gift-preview-front-seal">S</span>
                </span>
                <span className="gift-preview-box-side">
                  <span className="gift-preview-side-ribbon" />
                </span>
                <span className="gift-preview-box-lid">
                  <span className="gift-preview-lid-top">
                    <span className="gift-preview-lid-ribbon" />
                    <span className="gift-preview-bow">
                      <i className="bow-loop bow-loop-left" />
                      <i className="bow-loop bow-loop-right" />
                      <i className="bow-knot" />
                      <i className="bow-tail bow-tail-left" />
                      <i className="bow-tail bow-tail-right" />
                    </span>
                  </span>
                  <span className="gift-preview-lid-front"><i /></span>
                  <span className="gift-preview-lid-side"><i /></span>
                </span>
              </span>
              <span className="gift-preview-sparkle sparkle-one">✦</span>
              <span className="gift-preview-sparkle sparkle-two">✧</span>
              <span className="gift-preview-sparkle sparkle-three">✦</span>
              <span className="gift-preview-sparkle sparkle-four">✧</span>
            </span>
          </button>
          <div className="gift-preview-caption" aria-live="polite">{opened ? "YOUR 3,500 GT GIFT IS REVEALED" : "TAP THE PRESENT TO OPEN"}</div>
        </div>

        <div className="gift-preview-actions">
          {!opened ? <button type="button" className="gift-preview-open-button" onClick={openGift}>UNWRAP YOUR 3,500 GT GIFT <span>↗</span></button> : <button type="button" className="gift-preview-open-button" onClick={resetGift}>REPLAY THE REVEAL <span>↻</span></button>}
          <span className="gift-preview-safety-note">DESIGN PREVIEW ONLY · NO TOKENS ARE CLAIMED OR CREDITED</span>
        </div>
      </section>
      <footer className="gift-preview-footer"><span><BrandMark className="gift-preview-footer-mark"/> SETHIS · FOOTBALL REWARD ARENA</span><a href="/">BACK TO SETHIS INTRODUCTION ↗</a></footer>
    </main>
  );
}
