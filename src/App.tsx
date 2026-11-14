import { useMemo, useState } from "react";

type Court = {
  id: number;
  category: string;
  title: string;
  context: string;
  left: string;
  right: string;
  participants: string;
  time: string;
  status: "LIVE" | "CLOSING" | "NEW";
};

const courts: Court[] = [
  {
    id: 1,
    category: "Referee's Court",
    title: "Was that a penalty — or a very clever dive?",
    context: "A late challenge in the box has split the football world. The referee pointed to the spot. Was the decision right?",
    left: "Penalty. The contact was enough.",
    right: "No penalty. He was already going down.",
    participants: "2.4k",
    time: "Closes in 01:42:18",
    status: "LIVE",
  },
  {
    id: 2,
    category: "Manager's Court",
    title: "Should the manager have made that substitution earlier?",
    context: "The game was slipping away before the change came. Was the timing the real turning point?",
    left: "The change came too late.",
    right: "The timing was right.",
    participants: "986",
    time: "Closes in 04:18:05",
    status: "CLOSING",
  },
  {
    id: 3,
    category: "Player's Court",
    title: "World-class talent or simply a purple patch?",
    context: "A run of brilliant performances has raised the question: is this the real level or a temporary peak?",
    left: "World-class. The quality is clear.",
    right: "Too early. Show consistency first.",
    participants: "741",
    time: "New court",
    status: "NEW",
  },
  {
    id: 4,
    category: "Transfer Court",
    title: "Was that transfer fee justified?",
    context: "A huge fee brings huge expectations. Has the signing delivered enough to justify the investment?",
    left: "Worth every penny.",
    right: "The fee was far too high.",
    participants: "1.1k",
    time: "Closes in 09:06:44",
    status: "LIVE",
  },
];

const categories = ["All Courts", "Match Court", "Referee's Court", "Manager's Court", "Player's Court", "Transfer Court", "Football Debate"];

function BallMark() {
  return <span className="ball-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" /><path d="m20 10 6 4-2 7h-8l-2-7zM14 14l-6-2m22 0-6 2m-8 7-5 6m13-6 5 6m-10-2v7m-7-1-5-4m19 4 5-4" /></svg></span>;
}

function FootballArtwork() {
  return (
    <div className="hero-art" aria-label="Football stadium illustration">
      <div className="stadium-glow" />
      <div className="stadium-lights"><i /><i /><i /><i /></div>
      <div className="stand stand-back" />
      <div className="pitch">
        <span className="half-line" /><span className="centre-circle" /><span className="box-left" /><span className="box-right" />
      </div>
      <div className="player player-one"><span className="head" /><span className="body" /><span className="leg leg-a" /><span className="leg leg-b" /></div>
      <div className="player player-two"><span className="head" /><span className="body" /><span className="leg leg-a" /><span className="leg leg-b" /></div>
      <div className="football"><BallMark /></div>
      <div className="art-caption">THE PEOPLE DECIDE</div>
    </div>
  );
}

function CourtCard({ court, onOpen, featured = false }: { court: Court; onOpen: (court: Court) => void; featured?: boolean }) {
  return (
    <article className={featured ? "court-card featured-card" : "court-card"}>
      <div className="court-card-top">
        <span className="category-label">{court.category}</span>
        <span className={`court-status ${court.status.toLowerCase()}`}>{court.status === "LIVE" ? "● LIVE" : court.status}</span>
      </div>
      <h3>{court.title}</h3>
      <div className="sides-preview">
        <div className="side side-a"><span className="side-letter">A</span><span>{court.left}</span></div>
        <div className="versus">VS</div>
        <div className="side side-b"><span className="side-letter">B</span><span>{court.right}</span></div>
      </div>
      <div className="court-card-footer">
        <span>◉ {court.participants} in this Court</span>
        <span>{court.time}</span>
      </div>
      <button className={featured ? "button-primary enter-button" : "button-quiet enter-button"} onClick={() => onOpen(court)}>Enter Court <span>↗</span></button>
    </article>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All Courts");
  const [activeNav, setActiveNav] = useState("Courts");
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [joinedSide, setJoinedSide] = useState<string | null>(null);

  const filtered = useMemo(() => courts.filter((court) => {
    const matchesCategory = activeCategory === "All Courts" || court.category === activeCategory;
    const matchesSearch = !search || court.title.toLowerCase().includes(search.toLowerCase()) || court.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [activeCategory, search]);

  const openCourt = (court: Court) => { setSelectedCourt(court); setJoinedSide(null); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Settle This home"><span className="brand-placeholder">ST</span><span>SETTLE<span className="brand-accent">THIS</span><b>!</b></span></a>
        <div className="topbar-actions">
          {searchOpen && <input className="search-input" autoFocus placeholder="Search Courts..." value={search} onChange={(e) => setSearch(e.target.value)} />}
          <button className="icon-button" aria-label="Search Courts" onClick={() => { setSearchOpen(!searchOpen); setSearch(""); }}><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button>
          <button className="icon-button notification-button" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><i /></button>
          <button className="profile-button" aria-label="Open profile">G</button>
        </div>
      </header>

      <main className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">THE FOOTBALL COURTROOM</p><h1>Every opinion has<br className="desktop-break" /> a place. <span>Make yours count.</span></h1></div><div className="welcome-date">MATCHDAY ENERGY<br /><strong>THE DEBATE STARTS HERE</strong></div></div>

        <section className="controversy-section">
          <div className="controversy-copy">
            <div className="feature-kicker"><span className="pulse-dot" /> TODAY'S BIGGEST CONTROVERSY</div>
            <p className="feature-overline">THE REFEREE'S CALL · MATCH INCIDENT</p>
            <h2>Penalty or<br /><em>play on?</em></h2>
            <p className="feature-description">One decision. Two sides. Millions of opinions. The football world is divided — now it's your turn to make the call.</p>
            <div className="feature-meta"><span>◉ 2.4K debating</span><span>◷ 01:42:18 left</span></div>
            <button className="button-primary feature-cta" onClick={() => openCourt(courts[0])}>ENTER THE COURT <span>↗</span></button>
          </div>
          <FootballArtwork />
          <div className="feature-bottom-line"><span>01 / THE PEOPLE'S VERDICT</span><span>YOUR VOICE. YOUR VERDICT.</span></div>
        </section>

        <section className="category-section">
          <div className="section-heading"><div><p className="eyebrow">FIND YOUR ARGUMENT</p><h2>Explore Courts</h2></div><span className="section-count">07 CATEGORIES</span></div>
          <div className="category-scroller" role="tablist" aria-label="Court categories">
            {categories.map((category) => <button key={category} role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "category-chip selected" : "category-chip"} onClick={() => setActiveCategory(category)}>{category}</button>)}
          </div>
        </section>

        <section className="courts-section">
          <div className="section-heading compact-heading"><div><p className="eyebrow">THE DEBATES EVERYONE'S TALKING ABOUT</p><h2>{activeCategory === "All Courts" ? "Trending Courts" : activeCategory}</h2></div><button className="text-link" onClick={() => setActiveCategory("All Courts")}>View all <span>→</span></button></div>
          <div className="courts-grid">
            {filtered.slice(0, 3).map((court, index) => <CourtCard key={court.id} court={court} onOpen={openCourt} featured={index === 0} />)}
          </div>
          {filtered.length === 0 && <div className="empty-state">No Courts match that search. Try another category or keyword.</div>}
        </section>
        <footer className="page-footer"><BallMark /><span>Football is better when every side gets heard.</span><span>SETTLE THIS! © 2026</span></footer>
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {[["Courts","◈"],["My Courts","▤"],["Tasks","✦"],["Rankings","♜"],["Wallet","◉"]].map(([label, icon]) => <button key={label} className={activeNav === label ? "nav-item active" : "nav-item"} onClick={() => setActiveNav(label)}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}
      </nav>

      {activeNav !== "Courts" && <div className="nav-notice" role="status"><strong>{activeNav}</strong> is in the Phase One build sequence. Courts is the first screen being implemented.</div>}

      {selectedCourt && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCourt(null)}><section className="court-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelectedCourt(null)} aria-label="Close">×</button><p className="eyebrow">{selectedCourt.category.toUpperCase()}</p><h2 id="modal-title">{selectedCourt.title}</h2><p className="modal-context">{selectedCourt.context}</p><p className="modal-instruction">WHICH SIDE ARE YOU ON?</p><div className="modal-sides"><button className={joinedSide === "A" ? "modal-side chosen" : "modal-side"} onClick={() => setJoinedSide("A")}><b>A</b>{selectedCourt.left}</button><button className={joinedSide === "B" ? "modal-side chosen" : "modal-side"} onClick={() => setJoinedSide("B")}><b>B</b>{selectedCourt.right}</button></div>{joinedSide ? <p className="selection-note">Side {joinedSide} selected. Account sign-in and Court entry will be connected in the next implementation step.</p> : <p className="selection-note">Choose a side to preview the participation flow.</p>}<button className="button-primary modal-action" onClick={() => setSelectedCourt(null)}>GOT IT</button></section></div>}
    </div>
  );
}
