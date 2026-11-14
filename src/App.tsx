import { useMemo, useState } from "react";

type Court = {
  id: number; category: string; title: string; league: string; fixture: string;
  home: string; away: string; score: string; matchDate: string; minute: string;
  incident: string; evidence: string; left: string; right: string; participants: string;
  closes: string; status: "LIVE" | "CLOSING" | "NEW";
};

const courts: Court[] = [
  {
    id: 1, category: "REFEREE'S COURT", title: "Penalty or play on?",
    league: "PREMIER LEAGUE · SAMPLE CASE", fixture: "Liverpool vs Manchester United",
    home: "LIV", away: "MUN", score: "1 – 1", matchDate: "ILLUSTRATIVE MATCH", minute: "56'",
    incident: "Penalty appeal · Contact inside the penalty area",
    evidence: "A forward goes down as a defender challenges from the side. The referee waves play on. Was there enough contact for a penalty?",
    left: "Penalty. The defender made contact.", right: "Play on. The attacker went down too easily.",
    participants: "2,408", closes: "01:42:18", status: "LIVE"
  },
  {
    id: 2, category: "MANAGER'S COURT", title: "Was the substitution too late?",
    league: "CHAMPIONS LEAGUE · SAMPLE CASE", fixture: "Real Madrid vs Bayern Munich",
    home: "RMA", away: "BAY", score: "2 – 2", matchDate: "ILLUSTRATIVE MATCH", minute: "72'",
    incident: "Tactical decision · Late attacking change",
    evidence: "The midfield was losing control before the manager made the change. Should the substitution have come earlier?",
    left: "The manager waited too long.", right: "The timing was right.",
    participants: "986", closes: "04:18:05", status: "CLOSING"
  },
  {
    id: 3, category: "PLAYER'S COURT", title: "World-class or a purple patch?",
    league: "LA LIGA · PLAYER DEBATE", fixture: "Barcelona vs Atlético Madrid",
    home: "BAR", away: "ATM", score: "—", matchDate: "PLAYER PERFORMANCE CASE", minute: "FULL MATCH",
    incident: "Player assessment · Consistency vs peak form",
    evidence: "A run of standout performances has raised a bigger question about the player's true level.",
    left: "World-class. The quality is clear.", right: "Too early. Show consistency first.",
    participants: "741", closes: "NEW CASE", status: "NEW"
  },
  {
    id: 4, category: "TRANSFER COURT", title: "Was that transfer fee justified?",
    league: "TRANSFER DESK · EUROPE", fixture: "Summer transfer window",
    home: "BUY", away: "FEE", score: "—", matchDate: "TRANSFER CASE", minute: "SEASON REVIEW",
    incident: "Transfer verdict · Fee vs performance",
    evidence: "A major fee brought major expectations. Has the signing delivered enough to justify the investment?",
    left: "Worth every penny.", right: "The fee was far too high.",
    participants: "1,104", closes: "09:06:44", status: "LIVE"
  }
];

const categories = ["All Courts", "Match Court", "Referee's Court", "Manager's Court", "Player's Court", "Transfer Court", "Football Debate"];

function BallIcon({ large = false }: { large?: boolean }) {
  return <svg className={large ? "ball-svg large-ball" : "ball-svg"} viewBox="0 0 200 200" role="img" aria-label="3D football">
    <defs>
      <radialGradient id="ballBase" cx="32%" cy="24%" r="78%"><stop offset="0" stopColor="#ffffff"/><stop offset=".48" stopColor="#d9e5ed"/><stop offset=".78" stopColor="#91a8b8"/><stop offset="1" stopColor="#40586a"/></radialGradient>
      <radialGradient id="ballShine" cx="24%" cy="16%" r="62%"><stop offset="0" stopColor="#fff" stopOpacity=".95"/><stop offset=".24" stopColor="#fff" stopOpacity=".2"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <linearGradient id="ballEdge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a9f7ff"/><stop offset=".45" stopColor="#27d7f2" stopOpacity=".08"/><stop offset="1" stopColor="#071522"/></linearGradient>
      <clipPath id="ballClip"><circle cx="100" cy="100" r="82"/></clipPath>
      <filter id="ballShadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <ellipse cx="105" cy="181" rx="62" ry="10" fill="#020811" opacity=".55" filter="url(#ballShadow)"/>
    <circle cx="100" cy="98" r="83" fill="url(#ballBase)" stroke="url(#ballEdge)" strokeWidth="2"/>
    <g clipPath="url(#ballClip)" stroke="#23394a" strokeWidth="3" strokeLinejoin="round">
      <path d="m100 55 22 16-8 26H86l-8-26z" fill="#152a3b"/>
      <path d="m100 55-20-27-25 7-7 29 30 17 8-10z" fill="#eaf2f5"/>
      <path d="m122 71 29-17 25 17-2 28-31 9-29-11z" fill="#eaf2f5"/>
      <path d="m86 97-25 11-3 33 27 19 23-17 6-46z" fill="#eaf2f5"/>
      <path d="m114 97 29 11 11 31-24 22-28-18-8-37z" fill="#eaf2f5"/>
      <path d="m78 71-30-7-18 25 12 27 19-8 25-11z" fill="#172e40"/>
      <path d="m151 108 31-9 8 26-19 24-27-10z" fill="#172e40"/>
      <path d="m85 160-27-19-8 25 20 22 27-8 14-18z" fill="#172e40"/>
      <path d="m130 161 24-22 27 10-1 27-28 14-22-12z" fill="#172e40"/>
    </g>
    <circle cx="100" cy="98" r="82" fill="url(#ballShine)"/>
    <path d="M42 51c20-27 54-39 83-29" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".55"/>
    <circle cx="100" cy="98" r="83" fill="none" stroke="#8ff4ff" strokeOpacity=".45" strokeWidth="1.5"/>
  </svg>;
}

function IncidentFrame() {
  return <div className="incident-frame" aria-label="Illustrative football incident diagram">
    <div className="frame-top"><span>INCIDENT REPLAY</span><span>ILLUSTRATION · NOT MATCH FOOTAGE</span></div>
    <svg viewBox="0 0 720 350" className="pitch-diagram" role="img" aria-label="Illustration of an attacker and defender during a penalty-area challenge">
      <defs><linearGradient id="grass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1b695c"/><stop offset="1" stopColor="#0d403b"/></linearGradient><linearGradient id="light" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".16"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
      <rect width="720" height="350" fill="url(#grass)"/>
      <path d="M0 0h720v350H0z" fill="url(#light)"/>
      <path d="M0 0h720v350H0z" fill="none" stroke="#d6fff0" strokeOpacity=".58" strokeWidth="3"/>
      <path d="M0 175h720M540 0v350M540 85h180v180H540M610 85v180" fill="none" stroke="#d6fff0" strokeOpacity=".48" strokeWidth="3"/>
      <path d="M610 140a35 35 0 0 1 0 70" fill="none" stroke="#d6fff0" strokeOpacity=".45" strokeWidth="2"/>
      <path d="M0 45h720M0 305h720" stroke="#ffffff" strokeOpacity=".05" strokeWidth="1"/>
      <g transform="translate(395 178) rotate(-26)"><ellipse cx="0" cy="61" rx="25" ry="8" fill="#061d1b" opacity=".45"/><circle cx="0" cy="-28" r="15" fill="#c58d6a"/><path d="M-16-10q16-14 32 0l15 57q-31 17-62 0z" fill="#e8f4f6"/><path d="m-12 43-12 56 14 4 20-50M12 43l29 46-11 9-37-39" fill="none" stroke="#182d3a" strokeWidth="14" strokeLinecap="round"/><path d="m-14-5 29 0" stroke="#27d7f2" strokeWidth="5"/></g>
      <g transform="translate(490 205) rotate(18)"><ellipse cx="0" cy="60" rx="25" ry="8" fill="#061d1b" opacity=".45"/><circle cx="0" cy="-28" r="15" fill="#a97558"/><path d="M-16-10q16-14 32 0l15 57q-31 17-62 0z" fill="#e34c55"/><path d="m-12 43-12 56 14 4 20-50M12 43l29 46-11 9-37-39" fill="none" stroke="#172b3c" strokeWidth="14" strokeLinecap="round"/></g>
      <circle cx="430" cy="248" r="11" fill="#f4f7f8" stroke="#102334" strokeWidth="2"/><path d="m430 238 4 5-3 6-6-1-2-6z" fill="#14283a"/>
      <path d="M390 166q54-52 116-3" fill="none" stroke="#27d7f2" strokeWidth="3" strokeDasharray="7 8"/><circle cx="449" cy="184" r="38" fill="none" stroke="#27d7f2" strokeWidth="2" strokeDasharray="5 6"/>
      <path d="M449 184 500 112" stroke="#27d7f2" strokeWidth="2"/><rect x="488" y="76" width="174" height="43" rx="7" fill="#0a1a28" stroke="#27d7f2" strokeOpacity=".7"/><text x="502" y="94" fill="#bff8ff" fontSize="11" fontWeight="700">CONTACT POINT</text><text x="502" y="108" fill="#7e9bad" fontSize="9">Challenge under review</text>
    </svg>
    <div className="frame-foot"><span><i/> ATTACKING PLAYER</span><span><i/> DEFENDING PLAYER</span><span>56' · PENALTY AREA</span></div>
  </div>;
}

function CourtCard({ court, onOpen }: { court: Court; onOpen: (court: Court) => void }) {
  return <article className="court-card">
    <div className="card-league">{court.league}</div>
    <div className="mini-fixture"><div className="mini-team"><b>{court.home}</b><span>{court.fixture.split(" vs ")[0]}</span></div><strong>{court.score}</strong><div className="mini-team away"><b>{court.away}</b><span>{court.fixture.split(" vs ")[1] || "Case"}</span></div></div>
    <div className="court-card-body"><div className="court-card-top"><span className="category-label">{court.category}</span><span className={"court-status " + court.status.toLowerCase()}>{court.status === "LIVE" ? "● LIVE" : court.status}</span></div>
      <h3>{court.title}</h3><p>{court.incident}</p>
      <div className="card-meta"><span>◉ {court.participants} debating</span><span>{court.minute}</span></div>
      <button className="button-outline enter-button" onClick={() => onOpen(court)}>VIEW CASE <span>↗</span></button>
    </div>
  </article>;
}

function WalletPanel({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [entryAmount, setEntryAmount] = useState(500);
  return <div className="modal-backdrop" onClick={onClose}><section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onClick={e => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label="Close wallet">×</button>
    <p className="eyebrow">YOUR FOOTBALL ECONOMY</p><h2 id="wallet-title">Wallet <span>& rewards</span></h2>
    <div className="wallet-balances">
      <div className="balance-card ct-balance"><span>COURT TOKENS</span><strong>3,500 <small>CT</small></strong><p>Entry currency · Demo balance</p><div className="balance-actions"><button onClick={() => setCodeMessage("Watch a rewarded ad or fund your CT balance to add entry tokens.")}>GET CT</button><button onClick={() => setCodeMessage("Enter a valid campaign or referral code below to redeem it.")}>REDEEM CODE</button></div></div>
      <div className="balance-card sethis-balance"><span>REWARD TOKEN</span><strong>0 <small>SETHIS</small></strong><p>Earned from wins and community activity · Demo balance</p><div className="token-note">Your reward token balance</div></div>
    </div>
    <div className="wallet-rule"><b>How it works</b><p><strong>CT</strong> is used to enter Courts. CT is added through rewarded ads or funding — it is not earned by winning. <strong>SETHIS</strong> is the reward token earned from winning arguments, daily check-ins, tasks, referrals and other qualifying activities.</p></div>
    <div className="redeem-row"><label htmlFor="redeem-code">HAVE A CODE?</label><div><input id="redeem-code" value={code} onChange={e => {setCode(e.target.value);setCodeMessage("");}} placeholder="Enter promo or referral code"/><button onClick={() => setCodeMessage(code.trim() ? "Code redemption will be verified when the wallet service is connected." : "Enter your code first.")}>APPLY</button></div>{codeMessage && <small>{codeMessage}</small>}</div>
    <button className="modal-done" onClick={onClose}>CLOSE WALLET</button>
  </section></div>;
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All Courts");
  const [activeNav, setActiveNav] = useState("Courts");
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [joinedSide, setJoinedSide] = useState<string | null>(null);
  const [entryAmount, setEntryAmount] = useState(500);

  const filtered = useMemo(() => courts.filter(c => {
    const category = activeCategory === "All Courts" || c.category.toLowerCase().includes(activeCategory.replace(" Court", "").toLowerCase().replace("'s", ""));
    const query = !search || [c.title,c.category,c.fixture,c.league,c.incident].join(" ").toLowerCase().includes(search.toLowerCase());
    return category && query;
  }), [activeCategory, search]);

  const openCourt = (court: Court) => { setSelectedCourt(court); setJoinedSide(null); setEntryAmount(500); };
  const nav = (name: string) => { setActiveNav(name); if(name === "Wallet") setWalletOpen(true); };

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" aria-label="Settle This home"><span className="brand-mark"><BallIcon/></span><span>SETTLE<span className="brand-accent">THIS</span><b>!</b></span></a>
      <div className="topbar-actions">{searchOpen && <input className="search-input" autoFocus placeholder="Search matches, teams, Courts..." value={search} onChange={e => setSearch(e.target.value)}/>}
        <button className="icon-button" aria-label="Search Courts" onClick={() => {setSearchOpen(!searchOpen);setSearch("");}}><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button>
        <button className="wallet-pill" onClick={() => setWalletOpen(true)}><span>CT BALANCE</span><b>3,500</b><small>↗</small></button>
        <button className="icon-button notification-button" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><i/></button>
        <button className="profile-button" aria-label="Open profile">G</button>
      </div>
    </header>
    <main className="page-content">
      <div className="welcome-row"><div><p className="eyebrow">THE FOOTBALL COURTROOM</p><h1>Football has its moments.<br/><span>Now settle the argument.</span></h1></div><div className="welcome-date">YOUR CLUB. YOUR LEAGUE.<br/><strong>YOUR VERDICT.</strong></div></div>
      <section className="controversy-section">
        <div className="controversy-copy">
          <div className="feature-kicker"><span className="pulse-dot"/> TODAY'S CASE · REFEREE'S COURT</div>
          <div className="hero-fixture"><span className="league-tag">PREMIER LEAGUE · SAMPLE CASE</span><div className="hero-teams"><div><b>LIV</b><span>Liverpool</span></div><strong>1 <i>:</i> 1</strong><div><b>MUN</b><span>Man United</span></div></div><div className="match-time"><span>ILLUSTRATIVE MATCH</span><b>56' · PENALTY APPEAL</b></div></div>
          <p className="feature-overline">THE REFEREE'S CALL · CONTACT IN THE BOX</p><h2>Penalty or<br/><em>play on?</em></h2>
          <p className="feature-description">A challenge inside the area. The referee waves play on. Look at the incident, study the match context and make your call.</p>
          <div className="feature-meta"><span>◉ 2,408 debating</span><span>◷ 01:42:18 left</span></div>
          <button className="button-primary feature-cta" onClick={() => openCourt(courts[0])}>OPEN MATCH CASE <span>↗</span></button>
        </div>
        <div className="hero-art"><div className="ball-orbit orbit-one"/><div className="ball-orbit orbit-two"/><div className="hero-ball"><BallIcon large/></div><div className="hero-art-caption"><span>THE PEOPLE'S VERDICT</span><b>ONE GAME. TWO SIDES.</b></div><div className="hero-index">ST / 001</div></div>
        <div className="feature-bottom-line"><span>01 / MATCH INCIDENT</span><span>EVERY DETAIL MATTERS.</span></div>
      </section>
      <section className="category-section"><div className="section-heading"><div><p className="eyebrow">PICK YOUR SIDE OF FOOTBALL</p><h2>Explore Courts</h2></div><span className="section-count">07 CATEGORIES</span></div>
        <div className="category-scroller" role="tablist" aria-label="Court categories">{categories.map(c => <button key={c} role="tab" aria-selected={activeCategory===c} className={activeCategory===c?"category-chip selected":"category-chip"} onClick={() => setActiveCategory(c)}>{c}</button>)}</div>
      </section>
      <section className="courts-section"><div className="section-heading compact-heading"><div><p className="eyebrow">REAL MATCHES. REAL CONTEXT. REAL DEBATE.</p><h2>{activeCategory==="All Courts"?"Trending Courts":activeCategory}</h2></div><button className="text-link" onClick={() => setActiveCategory("All Courts")}>View all <span>→</span></button></div>
        <div className="courts-grid">{filtered.slice(0,3).map(c => <CourtCard key={c.id} court={c} onOpen={openCourt}/>)}</div>{filtered.length===0 && <div className="empty-state">No Courts match that search. Try another team, league or keyword.</div>}
      </section>
      <footer className="page-footer"><span className="footer-ball"><BallIcon/></span><span>Football is better when every side gets heard.</span><span>SETTLE THIS! © 2026</span></footer>
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{[["Courts","◈"],["My Courts","▤"],["Tasks","✦"],["Rankings","♜"],["Wallet","◉"]].map(([label,icon]) => <button key={label} className={activeNav===label?"nav-item active":"nav-item"} onClick={() => nav(label)}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}</nav>
    {activeNav!=="Courts" && activeNav!=="Wallet" && <div className="nav-notice" role="status"><strong>{activeNav}</strong> is part of the Phase One experience and is being built out next.</div>}
    {walletOpen && <WalletPanel onClose={() => {setWalletOpen(false);setActiveNav("Courts");}}/>}
    {selectedCourt && <div className="modal-backdrop" onClick={() => setSelectedCourt(null)}><section className="court-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setSelectedCourt(null)} aria-label="Close">×</button><p className="eyebrow">{selectedCourt.category} · MATCH CASE</p><h2 id="modal-title">{selectedCourt.title}</h2>
      <div className="modal-matchline"><span>{selectedCourt.league}</span><b>{selectedCourt.fixture}</b><strong>{selectedCourt.score}</strong><small>{selectedCourt.minute} · {selectedCourt.matchDate}</small></div>
      <IncidentFrame/><div className="incident-description"><b>{selectedCourt.incident}</b><p>{selectedCourt.evidence}</p></div>
      <p className="modal-instruction">CHOOSE YOUR VERDICT</p><div className="modal-sides"><button className={joinedSide==="A"?"modal-side chosen":"modal-side"} onClick={() => setJoinedSide("A")}><b>A</b><span>{selectedCourt.left}</span></button><button className={joinedSide==="B"?"modal-side chosen":"modal-side"} onClick={() => setJoinedSide("B")}><b>B</b><span>{selectedCourt.right}</span></button></div>
      <div className="entry-box"><div><b>COURT ENTRY</b><span>Minimum entry: 500 CT</span></div><div className="entry-amounts">{[500,1000,2000,3500].map(n=><button key={n} className={entryAmount===n?"amount-chip selected":"amount-chip"} onClick={()=>setEntryAmount(n)}>{n.toLocaleString()} CT</button>)}</div><p>Potential reward is shown from the live Court pool before you confirm entry.</p></div>
      {joinedSide && <p className="selection-note">Side {joinedSide} selected · {entryAmount.toLocaleString()} CT entry preview. Wallet connection and live pool calculations are not active in this design preview.</p>}
      <button className="button-primary modal-action" onClick={()=>setSelectedCourt(null)}>{joinedSide?"CONTINUE TO ENTRY":"CLOSE CASE"}</button>
    </section></div>}
  </div>;
}
