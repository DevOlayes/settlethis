import { useState } from "react";

type Tab = "Courts" | "My Courts" | "Tasks" | "Rankings" | "Wallet";
type League = { name: string; country: string; id: number; logo: string };
const leagues: League[] = [
  { name: "Premier League", country: "ENGLAND", id: 39, logo: "https://media.api-sports.io/football/leagues/39.png" },
  { name: "La Liga", country: "SPAIN", id: 140, logo: "https://media.api-sports.io/football/leagues/140.png" },
  { name: "Bundesliga", country: "GERMANY", id: 78, logo: "https://media.api-sports.io/football/leagues/78.png" },
  { name: "Serie A", country: "ITALY", id: 135, logo: "https://media.api-sports.io/football/leagues/135.png" },
  { name: "Ligue 1", country: "FRANCE", id: 61, logo: "https://media.api-sports.io/football/leagues/61.png" },
  { name: "Eredivisie", country: "NETHERLANDS", id: 88, logo: "https://media.api-sports.io/football/leagues/88.png" }
];
const crest = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
function Brand() { return <a className="brand" href="#" aria-label="Settle This home"><span className="brand-mark">ST<span>!</span></span><span className="brand-name">SETTLE<span>THIS</span><i>!</i></span></a>; }
function Team({ id, name }: { id: number; name: string }) { return <span className="team"><span className="crest"><img src={crest(id)} alt="" /></span><b>{name}</b></span>; }
function App() {
  const [tab, setTab] = useState<Tab>("Courts");
  const [sport, setSport] = useState<"Club football" | "International">("Club football");
  const [league, setLeague] = useState("All");
  const [walletOpen, setWalletOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizChoice, setQuizChoice] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const nav = (next: Tab) => { setTab(next); if (next === "Wallet") setWalletOpen(true); };
  return <div className="app-shell">
    <header className="topbar"><Brand /><div className="top-actions">
      {searchOpen && <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Courts, clubs..." autoFocus />}
      <button className="icon-button" aria-label="Search" onClick={() => { setSearchOpen(v => !v); setSearch(""); }}>⌕</button>
      <button className="balance-pill" onClick={() => setWalletOpen(true)}><span className="ct-gem">◆</span><b>3,500</b><small>CT</small><span className="plus">＋</span></button>
      <button className="profile-dot" onClick={() => showNotice("Your football profile is coming together.")}>G</button>
    </div></header>
    <main className="main-content">
      {tab === "Courts" && <>
        <div className="welcome-line"><span className="eyebrow"><i/> THE FOOTBALL COURTROOM</span><span className="edition">BUILT FOR THE FANS</span></div>
        <section className="hero">
          <div className="hero-copy"><span className="hero-kicker">FOOTBALL MOMENTS. REAL OPINIONS.</span><h1>Every moment<br/>has <em>two sides.</em></h1><p>Take your position. Make your argument. Let the football community deliver its verdict.</p><button className="hero-cta" onClick={() => setCourtOpen(true)}>EXPLORE THE COURT <span>↗</span></button></div>
          <div className="hero-art" aria-hidden="true"><div className="pitch-lines"><span/><span/><span/><i/></div><div className="whistle">◉</div><div className="hero-stamp">YOUR<br/>VERDICT<br/><b>COUNTS</b></div></div>
          <div className="hero-foot"><span><b>01</b> PICK A MOMENT</span><span><b>02</b> CHOOSE A SIDE</span><span><b>03</b> MAKE YOUR CASE</span></div>
        </section>
        <section className="section-block">
          <div className="section-heading"><div><span className="eyebrow">THE DISCOVERY FEED</span><h2>Find your Court</h2><p>Only the moments worth arguing about.</p></div><span className="curation-tag"><i/> CURATED</span></div>
          <div className="sport-switch"><button className={sport === "Club football" ? "active" : ""} onClick={() => setSport("Club football")}>Club football</button><button className={sport === "International" ? "active" : ""} onClick={() => setSport("International")}>International</button></div>
          {sport === "Club football" ? <>
            <div className="league-strip"><button className={league === "All" ? "league-chip active" : "league-chip"} onClick={() => setLeague("All")}>All leagues</button>{leagues.map(l => <button key={l.id} className={league === l.name ? "league-chip active" : "league-chip"} onClick={() => setLeague(l.name)}><span className="league-logo"><img src={l.logo} alt="" /></span>{l.name}</button>)}</div>
            <article className="featured-court">
              <div className="court-visual"><div className="visual-top"><span className="preview-label">DESIGN PREVIEW</span><span className="court-category">REFEREE'S COURT</span></div><div className="moment-display"><span className="minute">67′</span><span className="moment-line">THE MOMENT<br/><b>THAT SPLIT OPINION</b></span></div><div className="versus-row"><Team id={40} name="Liverpool"/><span className="versus">VS</span><Team id={42} name="Arsenal"/></div><span className="visual-note">ILLUSTRATIVE CASE · NOT A LIVE MATCH REPORT</span></div>
              <div className="featured-content"><div className="featured-meta"><span>THE FEATURED COURT</span><span className="status-dot">PREVIEW</span></div><h3>Was the referee right to award the free kick?</h3><p>A single decision. Two opposing views. What should the referee have called?</p><div className="case-context"><span>◷ 67TH MINUTE</span><span>◈ MATCH INCIDENT</span></div><button className="view-court" onClick={() => setCourtOpen(true)}>OPEN THIS COURT <span>→</span></button></div>
            </article>
          </> : <div className="empty-state compact"><span className="empty-ball">⚽</span><b>International Courts</b><p>National-team moments and tournament debates will appear here when verified cases are ready.</p><span className="preview-label">CONTENT CATEGORY READY · CASES NOT YET PUBLISHED</span></div>}
          <div className="moment-note"><span className="note-icon">✦</span><p><b>Quality over quantity.</b> Courts are selected for their debate value and supported by match context and sources—not generated just to fill the feed.</p></div>
        </section>
        <section className="section-block how-section"><div className="section-heading"><div><span className="eyebrow">THE COURTROOM</span><h2>How it works</h2></div></div><div className="steps"><div><span>01</span><b>THE CASE</b><p>Understand the football moment and the question being judged.</p></div><div><span>02</span><b>THE SIDES</b><p>Choose the position you believe and defend it with your argument.</p></div><div><span>03</span><b>THE VERDICT</b><p>Follow the community decision and the final Court outcome.</p></div></div></section>
        <section className="quiz-promo"><div className="quiz-icon">?</div><div><span className="eyebrow">TEST YOUR FOOTBALL KNOWLEDGE</span><h3>Think you know the game?</h3><p>Quick football quizzes are joining the Earn experience.</p></div><button onClick={() => { setTab("Tasks"); }}>EXPLORE <span>→</span></button></section>
      </>}
      {tab === "Tasks" && <section className="inner-page"><span className="eyebrow">EARN & ENGAGE</span><h1>Make every visit count.</h1><p className="page-intro">Earn SETHIS through eligible activity. Fund your Court entries with CT by watching designated ads.</p><div className="task-feature"><div><span className="eyebrow">DAILY CHECK-IN</span><h2>Keep your streak alive.</h2><p>Come back daily and build your check-in streak.</p></div><span className="reward-token">SETHIS</span><button onClick={() => showNotice("Daily check-in will activate when rewards are connected.")}>CHECK IN <span>→</span></button></div><div className="task-list"><div className="task-row"><span className="task-symbol cyan-symbol">▶</span><div><b>Watch & earn SETHIS</b><small>Designated reward ads · SETHIS reward</small></div><span className="task-arrow">›</span></div><div className="task-row"><span className="task-symbol gold-symbol">↗</span><div><b>Community & social tasks</b><small>Support the community and complete eligible tasks</small></div><span className="task-arrow">›</span></div><div className="task-row"><span className="task-symbol gold-symbol">♧</span><div><b>Invite football friends</b><small>Successful referrals and future milestone bonuses</small></div><span className="task-arrow">›</span></div><button className="quiz-task" onClick={() => setQuizOpen(true)}><span className="quiz-big">?</span><span><small>FOOTBALL QUIZ</small><b>One question. How well do you know the game?</b><i>Sample quiz preview · no reward credited</i></span><strong>PLAY ↗</strong></button></div></section>}
      {tab === "My Courts" && <section className="inner-page"><span className="eyebrow">YOUR FOOTBALL ARGUMENTS</span><h1>My Courts</h1><p className="page-intro">Your joined Courts, arguments and verdict history will live here.</p><div className="empty-state"><span className="empty-ball">⚖</span><b>Your courtroom is waiting.</b><p>When you join a Court, you’ll find your active arguments and completed verdicts here.</p><button onClick={() => setTab("Courts")}>DISCOVER COURTS →</button></div></section>}
      {tab === "Rankings" && <section className="inner-page"><span className="eyebrow">THE COMMUNITY SCOREBOARD</span><h1>Rankings</h1><p className="page-intro">See who is making the strongest case across the Settle This! community.</p><div className="ranking-tabs"><span>OVERALL</span><span>SETHIS</span><span>CLUB</span><span>COUNTRY</span></div><div className="empty-state"><span className="empty-ball">♜</span><b>The leaderboard is warming up.</b><p>Rankings will appear when verified participation and results are available.</p></div></section>}
      {tab === "Wallet" && <section className="inner-page"><span className="eyebrow">YOUR TOKENS, CLEARLY SEPARATED</span><h1>Wallet</h1><WalletContent showNotice={showNotice}/></section>}
    </main>
    <nav className="bottom-nav">{(["Courts","My Courts","Tasks","Rankings","Wallet"] as Tab[]).map((n,i)=><button key={n} className={tab===n?"selected":""} onClick={() => nav(n)}><span>{["▦","▤","✦","♜","◈"][i]}</span>{n}</button>)}</nav>
    {walletOpen && <div className="overlay" onClick={() => setWalletOpen(false)}><section className="modal wallet-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setWalletOpen(false)}>×</button><WalletContent showNotice={showNotice}/></section></div>}
    {courtOpen && <div className="overlay" onClick={() => setCourtOpen(false)}><section className="modal court-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setCourtOpen(false)}>×</button><span className="eyebrow">REFEREE'S COURT · DESIGN PREVIEW</span><h2>Was the referee right to award the free kick?</h2><p className="modal-context">Example match · 67th minute · Illustrative content only. No real match event or source is being claimed.</p><div className="evidence-preview"><span className="evidence-icon">▶</span><span><b>MOMENT EVIDENCE</b><small>Verified match footage, event details and source links will appear here before a real Court is published.</small></span><i>NOT ATTACHED</i></div><div className="court-sides"><button onClick={() => showNotice("Position selection is a preview; Court entry is not connected.")}><b>A</b><span>The contact was enough. The free kick was correct.</span></button><button onClick={() => showNotice("Position selection is a preview; Court entry is not connected.")}><b>B</b><span>It was too soft. The referee should have played on.</span></button></div><div className="entry-preview"><span>MINIMUM ENTRY</span><b>500 CT</b></div><button className="primary-wide" onClick={() => showNotice("Court entry and wallet deductions are not connected yet.")}>CONTINUE · 500 CT</button></section></div>}
    {quizOpen && <div className="overlay" onClick={() => setQuizOpen(false)}><section className="modal quiz-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setQuizOpen(false)}>×</button><span className="eyebrow">SAMPLE FOOTBALL QUIZ</span><h2>Which country won the 2022 FIFA World Cup?</h2><div className="quiz-options">{["France","Argentina","Croatia","Brazil"].map(v => <button key={v} className={quizChoice===v?"chosen":""} onClick={() => setQuizChoice(v)}>{v}</button>)}</div>{quizChoice && <p className="quiz-feedback">{quizChoice === "Argentina" ? "Correct answer. This is a sample quiz preview." : "Not quite. The correct answer is Argentina. Sample quiz preview."}</p>}<span className="preview-footnote">Practice preview only · no SETHIS is credited</span></section></div>}
    {notice && <div className="toast">{notice}</div>}
    <footer className="site-footer"><Brand/><span>Football moments. Strong opinions. The people's verdict.</span><small>SETTLE THIS! · PREVIEW BUILD</small></footer>
  </div>;
}
function WalletContent({ showNotice }: { showNotice: (message: string) => void }) {
  return <><span className="eyebrow">SETTLE THIS WALLET</span><h2 className="wallet-title">Your balances</h2><div className="wallet-balances"><div className="balance-card ct-card"><small>COURT TOKENS</small><strong>3,500 <i>CT</i></strong><p>Used to enter eligible Courts</p></div><div className="balance-card sethis-card"><small>MAIN REWARD TOKEN</small><strong>0 <i>SETHIS</i></strong><p>Earned through wins and activities</p></div></div><section className="fund-card"><div><span className="eyebrow">FUND YOUR COURT ENTRIES</span><h3>Get 100 CT per completed ad.</h3><p>Watch a designated rewarded advertisement to add CT to your Court balance.</p></div><div className="ad-reward"><b>+100</b><small>CT / AD</small></div><button className="primary-wide" onClick={() => showNotice("Rewarded-ad provider is not connected yet. No CT has been added.")}>WATCH AD · EARN 100 CT <span>→</span></button><small className="integration-note">Ad integration pending · CT is not credited in this preview.</small></section><section className="wallet-separation"><b>Two tokens. Two different purposes.</b><p><strong>CT</strong> is funded through designated CT ads and used for eligible Court entry. <strong>SETHIS</strong> is earned separately through qualifying Court wins, check-ins, SETHIS ads, community tasks, quizzes and successful referrals.</p></section><div className="wallet-history"><span className="eyebrow">RECENT ACTIVITY</span><p>No transactions yet. Your verified credits and debits will appear here.</p></div><div className="wallet-future">Crypto funding is not available in this version.</div></>;
}
export default App;
