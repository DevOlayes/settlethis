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
      {opened && <Confetti key={burst} width={viewport.width} height={viewport.height} numberOfPieces={190} recycle={false} gravity={0.22} tweenDuration={4300} frameRate={45} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }} />}
      <header className="gift-preview-header">
        <a className="gift-preview-brand" href="/" aria-label="SETHIS home">
          <BrandMark className="gift-preview-brand-mark" />
          <span><b>SETTLE</b><i>THIS!</i></span>
        </a>
        <span className="gift-preview-tag">INTERACTIVE DESIGN PREVIEW</span>
      </header>

      <section className="gift-preview-content">
        <span className="gift-preview-eyebrow">YOUR FIRST SETHIS MOMENT</span>
        <h1>{opened ? "A little something to get you started." : "Every new journey deserves a gift."}</h1>
        <p className="gift-preview-intro">{opened ? "Your welcome gift is ready. This is the reveal animation we are considering for the onboarding experience." : "Tap the gift to lift the lid, reveal your welcome reward and let the celebration begin."}</p>

        <div className="gift-preview-scene">
          <div className="gift-preview-aura" />
          <div className="gift-preview-floor-glow" />
          <button type="button" className="gift-preview-object" onClick={openGift} disabled={opened} aria-label="Open the 3,500 GT welcome gift" aria-expanded={opened}>
            <svg className="gift-preview-svg" viewBox="0 0 320 270" role="img" aria-label="A three-dimensional coral and plum gift box with a pale coral ribbon">
              <defs>
                <linearGradient id="giftBodyLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e98272"/><stop offset="1" stopColor="#a94f50"/></linearGradient>
                <linearGradient id="giftBodyRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c76563"/><stop offset="1" stopColor="#733b4c"/></linearGradient>
                <linearGradient id="giftLidTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5ad9e"/><stop offset=".55" stopColor="#e98272"/><stop offset="1" stopColor="#bd5c5b"/></linearGradient>
                <linearGradient id="giftRibbon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0e9"/><stop offset=".5" stopColor="#f6c8bd"/><stop offset="1" stopColor="#d98b83"/></linearGradient>
                <radialGradient id="giftInner" cx=".5" cy=".1" r=".9"><stop offset="0" stopColor="#f7b6a7"/><stop offset="1" stopColor="#28162f"/></radialGradient>
                <filter id="giftSoftGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12"/></filter>
                <filter id="giftCardShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#09030d" floodOpacity=".48"/></filter>
              </defs>

              <ellipse className="gift-preview-svg-halo" cx="160" cy="143" rx="103" ry="89" fill="#f08c7a" opacity=".0" filter="url(#giftSoftGlow)"/>
              <ellipse cx="160" cy="231" rx="91" ry="13" fill="#07030d" opacity=".5"/>

              <g className="gift-preview-prize" filter="url(#giftCardShadow)">
                <rect x="91" y="78" width="138" height="86" rx="13" fill="#29172f" stroke="#f2a092" strokeWidth="2"/>
                <rect x="98" y="85" width="124" height="72" rx="9" fill="url(#giftInner)" opacity=".28"/>
                <circle cx="160" cy="98" r="11" fill="#f1a18f" opacity=".2"/>
                <path d="M160 90l2.5 6.2 6.5.5-5 4.1 1.6 6.2-5.6-3.4-5.6 3.4 1.6-6.2-5-4.1 6.5-.5z" fill="#ffd5a5"/>
                <text x="160" y="132" textAnchor="middle" className="gift-preview-prize-number">+3,500</text>
                <text x="160" y="149" textAnchor="middle" className="gift-preview-prize-token">GT · GAME TOKEN</text>
              </g>

              <g className="gift-preview-box-body">
                <path d="M76 111 160 151 160 225 76 184Z" fill="url(#giftBodyLeft)" stroke="#f7b2a3" strokeOpacity=".6" strokeWidth="1.5"/>
                <path d="M160 151 244 111 244 184 160 225Z" fill="url(#giftBodyRight)" stroke="#f7b2a3" strokeOpacity=".45" strokeWidth="1.5"/>
                <path d="M76 111 160 72 244 111 160 151Z" fill="#3b233c" stroke="#f5b2a5" strokeOpacity=".55" strokeWidth="1.5"/>
                <path d="M148 145 160 151 160 225 148 219Z" fill="url(#giftRibbon)"/>
                <path d="M160 151 172 145 172 219 160 225Z" fill="#e8a69b"/>
                <path d="M76 111 160 151 160 166 76 126Z" fill="#f5c8bd"/>
                <path d="M160 151 244 111 244 126 160 166Z" fill="#d98b83"/>
                <path d="M151 147 160 151 160 225 151 221Z" fill="#fff0e9" opacity=".65"/>
              </g>

              <g className="gift-preview-lid">
                <path d="M67 91 160 45 253 91 160 139Z" fill="url(#giftLidTop)" stroke="#ffd0c5" strokeWidth="2"/>
                <path d="M67 91 160 139 160 160 67 112Z" fill="#b85a5b" stroke="#f7b5a8" strokeOpacity=".7" strokeWidth="1.4"/>
                <path d="M160 139 253 91 253 112 160 160Z" fill="#914653" stroke="#f7b5a8" strokeOpacity=".55" strokeWidth="1.4"/>
                <path d="M150 96 160 101 160 155 150 150Z" fill="url(#giftRibbon)"/>
                <path d="M160 101 170 96 170 150 160 155Z" fill="#e6a096"/>
                <path d="M67 91 160 139 160 151 67 103Z" fill="#fff0e9" opacity=".72"/>
                <path d="M160 139 253 91 253 103 160 151Z" fill="#d98b83"/>
                <g className="gift-preview-bow">
                  <path d="M153 56C128 17 94 27 109 58c9 18 28 18 47 8Z" fill="url(#giftRibbon)" stroke="#ffe2da" strokeWidth="1.5"/>
                  <path d="M167 56c25-39 59-29 44 2-9 18-28 18-47 8Z" fill="#e6a096" stroke="#ffe2da" strokeWidth="1.5"/>
                  <path d="M150 56c-10-17-25-27-39-25 12 7 19 20 23 34Z" fill="#fff0e9" opacity=".5"/>
                  <path d="M170 56c10-17 25-27 39-25-12 7-19 20-23 34Z" fill="#fff0e9" opacity=".35"/>
                  <path d="M160 47c-12 0-18 8-14 17 4 8 24 8 28 0 4-9-2-17-14-17Z" fill="#ffe5dc" stroke="#fff6f0" strokeWidth="1.5"/>
                </g>
              </g>

              <g className="gift-preview-sparkles" aria-hidden="true">
                <path d="M55 85v17m-8.5-8.5h17M262 72v15m-7.5-7.5h15M52 167v11m-5.5-5.5h11M270 158v12m-6-6h12" stroke="#ffd6bd" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="44" cy="125" r="3" fill="#ffd6bd"/><circle cx="277" cy="119" r="3" fill="#ffd6bd"/>
              </g>
            </svg>
          </button>
          <div className="gift-preview-caption" aria-live="polite">{opened ? "YOUR WELCOME GIFT IS REVEALED" : "A LITTLE SURPRISE IS WAITING INSIDE"}</div>
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
