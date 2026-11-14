import { useState } from "react";

type Tab = "Courts" | "My Courts" | "Tasks" | "Rankings" | "Wallet";
const crest = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
function Brand() { return <a className="brand" href="#" aria-label="Settle This home"><span className="brand-mark">ST<span>!</span></span><span className="brand-name">SETTLE<span>THIS</span><i>!</i></span></a>; }
function Team({ id, name }: { id: number; name: string }) { return <span className="team"><span className="crest"><img src={crest(id)} alt="" /></span><b>{name}</b></span>; }
function App() {
  const [tab, setTab] = useState<Tab>("Courts");
    const [walletOpen, setWalletOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [courtSide, setCourtSide] = useState<"A" | "B" | "">("");
  const [courtArgument, setCourtArgument] = useState("");
  const [poolOpen, setPoolOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizChoice, setQuizChoice] = useState("");
  const [infoPage, setInfoPage] = useState<"How it works" | "Customer support" | "Terms & conditions" | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !localStorage.getItem("sethis-onboarding-seen"));
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const nav = (next: Tab) => { setTab(next); if (next === "Wallet") setWalletOpen(true); };
  const closeOnboarding = () => { setOnboardingOpen(false); localStorage.setItem("sethis-onboarding-seen", "yes"); };
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
          <div className="hero-copy"><span className="hero-kicker">FOOTBALL MOMENTS. REAL OPINIONS.</span><h1>The moment.<br/><em>The argument.</em></h1><p>Take your position. Make your argument. Let the football community deliver its verdict.</p><button className="hero-cta" onClick={() => setCourtOpen(true)}>EXPLORE THE COURT <span>↗</span></button></div>
          <div className="hero-art" aria-hidden="true"><div className="pitch-lines"><span/><span/><span/><i/></div><div className="whistle">◉</div><div className="hero-stamp">YOUR<br/>VERDICT<br/><b>COUNTS</b></div></div>
          <div className="hero-foot"><span><b>01</b> PICK A MOMENT</span><span><b>02</b> TAKE A POSITION</span><span><b>03</b> MAKE YOUR CASE</span></div>
        </section>
        <section className="section-block">
          <div className="section-heading"><div><span className="eyebrow">THE DISCOVERY FEED</span><h2>Moments worth debating</h2><p>Football decisions, unforgettable moments and the arguments they spark.</p></div><span className="curation-tag"><i/> CURATED</span></div>
          <article className="featured-court">
            <div className="court-visual"><div className="visual-top"><span className="court-category">REFEREE'S COURT</span></div><div className="moment-display"><span className="minute">67′</span><span className="moment-line">THE MOMENT<br/><b>THAT SPLIT OPINION</b></span></div><div className="versus-row"><Team id={40} name="Liverpool"/><span className="versus">VS</span><Team id={42} name="Arsenal"/></div></div>
            <div className="featured-content"><div className="featured-meta"><span>THE FEATURED COURT</span><span className="status-dot">OPEN</span></div><h3>Was the referee right to award the free kick?</h3><p>Was the contact enough for a foul, or should play have continued?</p><div className="case-context"><span>◷ 67TH MINUTE</span><span>◈ MATCH INCIDENT</span></div><div className="entry-callout"><div><span>ENTRY TO JOIN</span><small>One-time Court entry</small></div><b>500 CT</b><div className="reward-line fixed-reward-line"><strong>WIN 1,550 SETHIS</strong></div></div><button className="view-court" onClick={() => setCourtOpen(true)}>JOIN COURT <span>→</span></button></div>
          </article>
          <article className="pool-court-preview">
            <div className="pool-preview-top"><span className="eyebrow">POOL COURT</span><span className="pool-tag">ONE-WEEK COURT</span></div>
            <div className="pool-main"><div><h3>Back your side. Share the pool.</h3><p>Choose the argument you believe in and stake CT. Participants on the winning side share the SETHIS prize in proportion to their stakes.</p></div><div className="pool-pot"><small>POOL PRIZE</small><b>150,000</b><span>SETHIS</span></div></div>
            <div className="pool-rules"><div><b>500 CT</b><small>MINIMUM STAKE</small></div><div><b>500+</b><small>STAKE MORE IF YOU CHOOSE</small></div><div><b>7 DAYS</b><small>COURT DURATION</small></div></div>
            <p className="pool-share-note">Your share is calculated from your CT stake compared with the total CT staked on the winning side. The final share is determined when the Court closes.</p>
            <button className="view-court pool-open-button" onClick={() => setPoolOpen(true)}>JOIN POOL COURT <span>→</span></button>
          </article>
        </section>
        <button className="quiz-promo quiz-promo-button" onClick={() => setQuizOpen(true)}><div className="quiz-art"><span className="quiz-ball">⚽</span><span className="quiz-art-mark">?</span></div><div><span className="eyebrow">SETTLE THIS! · FOOTBALL QUIZ</span><h3>How well do you know football?</h3><p>Test your memory. Pick the right answer. Prove your knowledge.</p><div className="quiz-meta"><span>QUICK-FIRE QUESTIONS</span><span>▶ START QUIZ</span></div></div><span className="quiz-chevron">↗</span></button>
      </>}
      {tab === "Tasks" && <section className="inner-page"><span className="eyebrow">EARN & ENGAGE</span><h1>Make every visit count.</h1><p className="page-intro">Earn SETHIS through eligible activity. Fund your Court entries with CT by watching designated ads.</p><div className="task-feature"><div><span className="eyebrow">DAILY CHECK-IN</span><h2>Keep your streak alive.</h2><p>Come back daily and build your check-in streak.</p></div><span className="reward-token">SETHIS</span><button onClick={() => showNotice("Daily check-in will activate when rewards are connected.")}>CHECK IN <span>→</span></button></div><div className="task-list"><div className="task-row"><span className="task-symbol cyan-symbol">▶</span><div><b>Watch & earn SETHIS</b><small>Designated reward ads · SETHIS reward</small></div><span className="task-arrow">›</span></div><div className="task-row"><span className="task-symbol gold-symbol">↗</span><div><b>Community & social tasks</b><small>Support the community and complete eligible tasks</small></div><span className="task-arrow">›</span></div><div className="task-row"><span className="task-symbol gold-symbol">♧</span><div><b>Invite football friends</b><small>Successful referrals and future milestone bonuses</small></div><span className="task-arrow">›</span></div><button className="quiz-task" onClick={() => setQuizOpen(true)}><span className="quiz-big">?</span><span><small>FOOTBALL QUIZ</small><b>One question. How well do you know the game?</b><i>Sample quiz preview · no reward credited</i></span><strong>PLAY ↗</strong></button></div></section>}
      {tab === "My Courts" && <section className="inner-page"><span className="eyebrow">YOUR FOOTBALL ARGUMENTS</span><h1>My Courts</h1><p className="page-intro">Your joined Courts, arguments and verdict history will live here.</p><div className="empty-state"><span className="empty-ball">⚖</span><b>Your courtroom is waiting.</b><p>When you join a Court, you’ll find your active arguments and completed verdicts here.</p><button onClick={() => setTab("Courts")}>DISCOVER COURTS →</button></div></section>}
      {tab === "Rankings" && <section className="inner-page"><span className="eyebrow">THE COMMUNITY SCOREBOARD</span><h1>Rankings</h1><p className="page-intro">See who is making the strongest case across the Settle This! community.</p><div className="ranking-tabs"><span>OVERALL</span><span>SETHIS</span><span>CLUB</span><span>COUNTRY</span></div><div className="empty-state"><span className="empty-ball">♜</span><b>The leaderboard is warming up.</b><p>Rankings will appear when verified participation and results are available.</p></div></section>}
      {tab === "Wallet" && <section className="inner-page"><span className="eyebrow">YOUR TOKENS, CLEARLY SEPARATED</span><h1>Wallet</h1><WalletContent showNotice={showNotice}/></section>}
    </main>
    <nav className="bottom-nav">{(["Courts","My Courts","Tasks","Rankings","Wallet"] as Tab[]).map((n,i)=><button key={n} className={tab===n?"selected":""} onClick={() => nav(n)}><span>{["▦","▤","✦","♜","◈"][i]}</span>{n}</button>)}</nav>
    {walletOpen && <div className="overlay" onClick={() => setWalletOpen(false)}><section className="modal wallet-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setWalletOpen(false)}>×</button><WalletContent showNotice={showNotice}/></section></div>}
    {poolOpen && <PoolCourtModal onClose={() => setPoolOpen(false)} showNotice={showNotice}/>}\n    {courtOpen && <div className="overlay" onClick={() => setCourtOpen(false)}><section className="modal court-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setCourtOpen(false)}>×</button><span className="eyebrow">REFEREE'S COURT</span><h2>Was the referee right to award the free kick?</h2><p className="modal-context">Liverpool vs Arsenal · 67th minute</p><div className="evidence-preview"><span className="evidence-icon">▶</span><span><b>MOMENT EVIDENCE</b><small>Verified match footage, event details and source links will appear here before a real Court is published.</small></span><i>NOT ATTACHED</i></div><div className="court-sides"><button className={courtSide==="A"?"chosen":""} onClick={() => setCourtSide("A")}><b>A</b><span>The contact was enough. The free kick was correct.</span></button><button className={courtSide==="B"?"chosen":""} onClick={() => setCourtSide("B")}><b>B</b><span>It was too soft. The referee should have played on.</span></button></div><div className="entry-preview"><div><span>ENTRY TO JOIN</span><b>500 CT</b></div><div className="modal-reward"><span>FIXED COURT REWARD</span><b>1,550 SETHIS</b><small>Per qualifying participant on the winning side.</small></div></div><button className="primary-wide" onClick={() => showNotice("Court entry and wallet deductions are not connected yet.")}>JOIN COURT · 500 CT</button></section></div>}
    {infoPage && <div className="overlay" onClick={() => setInfoPage(null)}><section className="modal info-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setInfoPage(null)}>×</button><span className="eyebrow">SETTLE THIS! · HELP CENTRE</span><h2>{infoPage}</h2>{infoPage === "How it works" ? <div className="info-steps"><p><b>01 · Discover a moment</b> Read the match context and review the evidence attached to a Court.</p><p><b>02 · Choose your position</b> Select the side you agree with and register your opinion using the displayed CT entry.</p><p><b>03 · Make your argument</b> Explain why your position is right and engage respectfully with the other side.</p><p><b>04 · Follow the verdict</b> See the community outcome and any eligible rewards after a Court is settled.</p></div> : infoPage === "Customer support" ? <p className="modal-context">Need help with your account, wallet, Court entry or a reported issue? Customer support contact options will be published here before launch.</p> : <p className="modal-context">The full Terms &amp; Conditions, eligibility rules, reward rules, privacy information and community standards will be available here before public launch.</p>}</section></div>}
    {onboardingOpen && <div className="overlay onboarding-overlay"><section className="modal onboarding-modal"><div className="onboarding-progress">{[0,1,2].map(i => <span key={i} className={i<=onboardingStep?"done":""}/>)}</div><button className="onboarding-skip" onClick={closeOnboarding}>SKIP</button><div className="onboarding-art"><div className="onboarding-ball">⚽</div><span>SETTLE THIS!</span></div><span className="eyebrow">WELCOME TO THE FOOTBALL COURTROOM</span><h2>{["Football moments worth debating.","Take a position. Make your case.","Know the entry. See the reward."][onboardingStep]}</h2><p>{["Explore carefully selected match moments, decisions and arguments from the football world.","Choose your position, explain your reasoning and engage with other fans.","Every regular Court displays its fixed SETHIS reward before you join. Pool Courts have a separate CT stake and shared-pool reward."][onboardingStep]}</p><div className="onboarding-bottom"><span>{onboardingStep+1} / 3</span><button className="primary-wide" onClick={() => onboardingStep<2?setOnboardingStep(s=>s+1):closeOnboarding()}>{onboardingStep<2?"NEXT":"LETS GO"} →</button></div></section></div>}
    {quizOpen && <div className="overlay" onClick={() => setQuizOpen(false)}><section className="modal quiz-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setQuizOpen(false)}>×</button><span className="eyebrow">SAMPLE FOOTBALL QUIZ</span><h2>Which country won the 2022 FIFA World Cup?</h2><div className="quiz-options">{["France","Argentina","Croatia","Brazil"].map(v => <button key={v} className={quizChoice===v?"chosen":""} onClick={() => setQuizChoice(v)}>{v}</button>)}</div>{quizChoice && <p className="quiz-feedback">{quizChoice === "Argentina" ? "Correct answer. This is a sample quiz preview." : "Not quite. The correct answer is Argentina. Sample quiz preview."}</p>}<span className="preview-footnote">Practice preview only · no SETHIS is credited</span></section></div>}
    {notice && <div className="toast">{notice}</div>}
    <footer className="site-footer"><Brand/><span>Football moments. Strong opinions. The people's verdict.</span><div className="footer-links"><button onClick={() => setInfoPage("How it works")}>How it works</button><button onClick={() => setInfoPage("Customer support")}>Customer support</button><button onClick={() => setInfoPage("Terms & conditions")}>Terms &amp; conditions</button><button onClick={() => { setOnboardingStep(0); setOnboardingOpen(true); }}>Onboarding</button></div><small>SETTLE THIS! · FOOTBALL COURTROOM</small></footer>
  </div>;
}

function PoolCourtModal({ onClose, showNotice }: { onClose: () => void; showNotice: (message: string) => void }) {
  const [side, setSide] = useState<"A" | "B" | "">("");
  const [stake, setStake] = useState("500");
  const amount = Number(stake);
  const validStake = Number.isInteger(amount) && amount >= 500;
  const inviteUrl = side ? `${window.location.origin}/#pool-court-001?side=${side}` : `${window.location.origin}/#pool-court-001`;
  const invite = async () => {
    const text = `Join my side in Settle This! Pool Court: ${inviteUrl}`;
    try {
      if (navigator.share) await navigator.share({ title: "Join my Pool Court", text, url: inviteUrl });
      else { await navigator.clipboard.writeText(text); showNotice("Pool Court invitation copied."); }
    } catch { showNotice("Invitation sharing was cancelled."); }
  };
  return <div className="overlay" onClick={onClose}><section className="modal pool-modal" onClick={e => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}>×</button>
    <span className="eyebrow">SETTLE THIS! · POOL COURT</span>
    <div className="pool-modal-prize"><div><small>SHARED PRIZE POOL</small><strong>150,000 <i>SETHIS</i></strong></div><span>7 DAYS</span></div>
    <h2>Take your position</h2>
    <p className="modal-context">Choose a side and set your CT stake. You can invite friends to join your side.</p>
    <div className="pool-side-options">
      <button className={side==="A"?"chosen":""} onClick={()=>setSide("A")}><b>A</b><span><strong>Side A</strong><small>Take this position</small></span><i>{side==="A"?"✓":"+"}</i></button>
      <button className={side==="B"?"chosen":""} onClick={()=>setSide("B")}><b>B</b><span><strong>Side B</strong><small>Take the opposing position</small></span><i>{side==="B"?"✓":"+"}</i></button>
    </div>
    <label className="pool-stake-label" htmlFor="pool-stake">YOUR CT STAKE <span>MINIMUM 500 CT</span></label>
    <div className="pool-stake-input"><input id="pool-stake" type="number" min="500" step="1" value={stake} onChange={e=>setStake(e.target.value)} /><b>CT</b></div>
    {!validStake && <small className="pool-validation">Enter a whole-number stake of at least 500 CT.</small>}
    <div className="pool-calculation"><div><span>Your selected side</span><b>{side ? `SIDE ${side}` : "Not selected"}</b></div><div><span>Your stake</span><b>{validStake ? amount.toLocaleString() : "—"} CT</b></div><p>Final SETHIS share = (your CT stake ÷ total CT staked on the winning side) × 150,000. Your exact share can only be calculated when the Court closes and the winning-side total is known.</p></div>
    <button className="primary-wide" disabled={!side || !validStake} onClick={()=>showNotice("Wallet transactions are not enabled yet. Your CT has not been deducted and no position has been placed.")}>JOIN POOL COURT</button>
    <button className="pool-invite-button" disabled={!side} onClick={invite}>INVITE FRIENDS TO SIDE {side || "—"} ↗</button>
    <small className="pool-wallet-note">Your wallet balance and stake will be verified before a live position can be confirmed.</small>
  </section></div>;
}

function WalletContent({ showNotice }: { showNotice: (message: string) => void }) {
  return <><span className="eyebrow">SETTLE THIS WALLET</span><h2 className="wallet-title">Your balances</h2><div className="wallet-balances"><div className="balance-card ct-card"><small>COURT TOKENS</small><strong>3,500 <i>CT</i></strong><p>Used to enter eligible Courts</p></div><div className="balance-card sethis-card"><small>MAIN REWARD TOKEN</small><strong>0 <i>SETHIS</i></strong><p>Earned through wins and activities</p></div></div><section className="fund-card"><div><span className="eyebrow">FUND YOUR COURT ENTRIES</span><h3>Get 100 CT per completed ad.</h3><p>Watch a designated rewarded advertisement to add CT to your Court balance.</p></div><div className="ad-reward"><b>+100</b><small>CT / AD</small></div><button className="primary-wide" onClick={() => showNotice("Rewarded-ad provider is not connected yet. No CT has been added.")}>WATCH AD · EARN 100 CT <span>→</span></button><small className="integration-note">Ad integration pending · CT is not credited in this preview.</small></section><section className="wallet-separation"><b>Two tokens. Two different purposes.</b><p><strong>CT</strong> is funded through designated CT ads and used for eligible Court entry. <strong>SETHIS</strong> is earned separately through qualifying Court wins, check-ins, SETHIS ads, community tasks, quizzes and successful referrals.</p></section><div className="wallet-history"><span className="eyebrow">RECENT ACTIVITY</span><p>No transactions yet. Your verified credits and debits will appear here.</p></div><div className="wallet-future">Crypto funding is not available in this version.</div></>;
}
export default App;
