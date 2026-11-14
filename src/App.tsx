import { useMemo, useState } from "react";

type League = { id: number; name: string; country: string; logo: string };
type CaseItem = {
  id: number; leagueId: number; home: string; away: string; homeId: number; awayId: number;
  title: string; topic: string; detail: string; left: string; right: string; votes: string; state: string;
};
const leagues: League[] = [
  { id: 39, name: "Premier League", country: "ENGLAND", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { id: 140, name: "La Liga", country: "SPAIN", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { id: 78, name: "Bundesliga", country: "GERMANY", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { id: 135, name: "Serie A", country: "ITALY", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { id: 61, name: "Ligue 1", country: "FRANCE", logo: "https://media.api-sports.io/football/leagues/61.png" },
  { id: 88, name: "Eredivisie", country: "NETHERLANDS", logo: "https://media.api-sports.io/football/leagues/88.png" }
];
const cases: CaseItem[] = [
  { id: 1, leagueId: 39, home: "Liverpool", away: "Manchester United", homeId: 40, awayId: 33, title: "Penalty or play on?", topic: "REFEREE DECISION", detail: "A penalty appeal after a challenge inside the area. Was there enough contact for a spot kick?", left: "Penalty should have been given", right: "Correct decision to play on", votes: "2.4K", state: "OPEN CASE" },
  { id: 2, leagueId: 39, home: "Arsenal", away: "Manchester City", homeId: 42, awayId: 50, title: "Who controlled the midfield?", topic: "MATCH DEBATE", detail: "A tactical battle that changed the rhythm of the game. Which side imposed its style?", left: "Arsenal dictated the game", right: "City controlled the contest", votes: "1.8K", state: "OPEN CASE" },
  { id: 3, leagueId: 140, home: "Real Madrid", away: "Barcelona", homeId: 541, awayId: 529, title: "Was the high line too risky?", topic: "TACTICAL COURT", detail: "The defensive line left space in behind. Was the tactical risk justified?", left: "The high line was worth it", right: "The defence was too exposed", votes: "3.1K", state: "OPEN CASE" },
  { id: 4, leagueId: 140, home: "Atlético Madrid", away: "Girona", homeId: 530, awayId: 547, title: "Brilliant defending or time-wasting?", topic: "FOOTBALL DEBATE", detail: "A disciplined defensive display frustrated the opposition. Where is the line?", left: "Smart game management", right: "Too much time-wasting", votes: "864", state: "OPEN CASE" },
  { id: 5, leagueId: 78, home: "Bayern Munich", away: "Borussia Dortmund", homeId: 157, awayId: 165, title: "Should the manager have changed shape?", topic: "MANAGER'S COURT", detail: "The opponent found space between the lines. Should the manager have reacted sooner?", left: "The change came too late", right: "The original plan was right", votes: "1.2K", state: "OPEN CASE" },
  { id: 6, leagueId: 78, home: "Bayer Leverkusen", away: "RB Leipzig", homeId: 168, awayId: 173, title: "Was that a world-class finish?", topic: "PLAYER'S COURT", detail: "A difficult chance was converted under pressure. How exceptional was the finish?", left: "An elite finish", right: "A good chance taken well", votes: "692", state: "OPEN CASE" },
  { id: 7, leagueId: 135, home: "Inter", away: "AC Milan", homeId: 505, awayId: 489, title: "Who owns the city?", topic: "DERBY DEBATE", detail: "A derby argument about identity, consistency and who sets the standard in Milan.", left: "Inter are the benchmark", right: "Milan have the bigger legacy", votes: "2.7K", state: "OPEN CASE" },
  { id: 8, leagueId: 135, home: "Juventus", away: "Napoli", homeId: 496, awayId: 492, title: "Is defence still the foundation?", topic: "FOOTBALL DEBATE", detail: "Does a strong defensive structure still decide the biggest matches?", left: "Defence wins titles", right: "Attack is the best foundation", votes: "941", state: "OPEN CASE" },
  { id: 9, leagueId: 61, home: "Paris Saint-Germain", away: "Marseille", homeId: 85, awayId: 81, title: "Does the Classique still decide the season?", topic: "MATCH DEBATE", detail: "The rivalry carries huge weight. Does this fixture still define the French season?", left: "It remains the biggest game", right: "The rivalry has changed", votes: "1.6K", state: "OPEN CASE" },
  { id: 10, leagueId: 61, home: "Monaco", away: "Lyon", homeId: 91, awayId: 80, title: "Was the transfer worth the fee?", topic: "TRANSFER COURT", detail: "A high-profile signing arrived with major expectations. Has the player delivered?", left: "Worth the investment", right: "The fee was excessive", votes: "578", state: "OPEN CASE" },
  { id: 11, leagueId: 88, home: "Ajax", away: "PSV Eindhoven", homeId: 194, awayId: 197, title: "Who sets the standard in the Netherlands?", topic: "LEAGUE DEBATE", detail: "Two major clubs, two different football identities. Which project is stronger?", left: "Ajax set the standard", right: "PSV are ahead now", votes: "1.1K", state: "OPEN CASE" },
  { id: 12, leagueId: 88, home: "Feyenoord", away: "AZ Alkmaar", homeId: 196, awayId: 201, title: "Is pressing the most important weapon?", topic: "TACTICAL COURT", detail: "High pressing can win the ball early but leave space behind. Is the trade-off worth it?", left: "Pressing changes everything", right: "Control matters more", votes: "437", state: "OPEN CASE" }
];
const crest = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
function BrandMark() { return <span className="brand-ball">ST<span>!</span></span>; }
function Team({ id, name }: { id: number; name: string }) {
  return <div className="team"><img src={crest(id)} alt="" loading="lazy" /><span>{name}</span></div>;
}
function Wallet({ close }: { close: () => void }) {
  return <div className="overlay" onClick={close}><section className="wallet-sheet" onClick={e => e.stopPropagation()}>
    <button className="close" onClick={close}>×</button><div className="sheet-kicker">SETTLE THIS WALLET</div><h2>Your balances</h2>
    <div className="balances"><div><small>COURT TOKENS</small><strong>3,500 <i>CT</i></strong><p>Used to enter Courts</p></div><div><small>REWARD TOKEN</small><strong>0 <i>SETHIS</i></strong><p>Earned from winning and activities</p></div></div>
    <div className="wallet-info"><b>How your wallet works</b><p>CT is your Court entry currency. Add CT through rewarded ads or funding. SETHIS is the reward token earned from winning arguments, check-ins, tasks and referrals. They are separate balances.</p></div>
    <label className="code-label">PROMO OR REFERRAL CODE</label><div className="code-row"><input placeholder="Enter code" /><button onClick={() => alert("Code redemption will be available when the wallet service is connected.")}>APPLY</button></div>
    <button className="done" onClick={close}>CLOSE</button>
  </section></div>;
}
export default function App() {
  const [selectedLeague, setSelectedLeague] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [nav, setNav] = useState("Courts");
  const visible = useMemo(() => cases.filter(item => (selectedLeague === "all" || item.leagueId === selectedLeague) && (!query || [item.home,item.away,item.title,item.topic].join(" ").toLowerCase().includes(query.toLowerCase()))), [selectedLeague, query]);
  const grouped = selectedLeague === "all" ? leagues : leagues.filter(l => l.id === selectedLeague);
  const open = (item: CaseItem) => { setSelectedCase(item); setSide(null); };
  return <div className="app">
    <header className="top">
      <a className="brand" href="#"><BrandMark/><span>SETTLE<span className="cyan">THIS</span><b>!</b></span></a>
      <div className="top-actions">
        {searchOpen && <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search teams or Courts" autoFocus />}
        <button className="top-icon" aria-label="Search" onClick={() => {setSearchOpen(v => !v); if(searchOpen)setQuery("");}}>⌕</button>
        <button className="wallet-button" onClick={() => setWalletOpen(true)}><span>CT</span><b>3,500</b><i>＋</i></button>
        <button className="avatar">G</button>
      </div>
    </header>
    <div className="ticker"><span className="ticker-live">● COURTROOM</span><span>FOOTBALL ARGUMENTS. YOUR SIDE. THE PEOPLE'S VERDICT.</span><span className="ticker-right">SAMPLE COURT DATA</span></div>
    <main>
      <div className="page-title"><div><small>WELCOME TO THE COURTROOM</small><h1>Settle the debate.</h1><p>Choose a league. Pick a side. Make your case.</p></div><div className="title-ball">⚽</div></div>
      <section className="league-panel">
        <div className="panel-heading"><div><small>COMPETITIONS</small><h2>Top six leagues</h2></div><span>6 LEAGUES</span></div>
        <div className="league-tabs">
          <button className={selectedLeague === "all" ? "league-tab active" : "league-tab"} onClick={() => setSelectedLeague("all")}><span className="all-leagues">6</span><b>All</b></button>
          {leagues.map(l => <button key={l.id} className={selectedLeague === l.id ? "league-tab active" : "league-tab"} onClick={() => setSelectedLeague(l.id)}><img src={l.logo} alt="" /><b>{l.name}</b></button>)}
        </div>
      </section>
      <section className="court-list-section">
        <div className="list-heading"><div><small>THE PEOPLE ARE DEBATING</small><h2>{selectedLeague === "all" ? "Open Courts" : leagues.find(l => l.id === selectedLeague)?.name + " Courts"}</h2></div><div className="filter-label"> <span>●</span> OPEN FOR VERDICT</div></div>
        {grouped.map(league => {
          const rows = visible.filter(c => c.leagueId === league.id);
          if (!rows.length) return null;
          return <div className="league-group" key={league.id}>
            <div className="league-group-head"><img src={league.logo} alt="" /><div><b>{league.name}</b><small>{league.country}</small></div><span>{rows.length} COURTS</span></div>
            {rows.map(item => <article className="match-row" key={item.id}>
              <div className="match-topic"><span>{item.topic}</span><b>{item.state}</b></div>
              <div className="match-main"><div className="teams"><Team id={item.homeId} name={item.home}/><Team id={item.awayId} name={item.away}/></div>
                <div className="case-summary"><b>{item.title}</b><span>{item.votes} fans debating</span></div>
                <button className="open-case" onClick={() => open(item)}>VIEW COURT <span>›</span></button>
              </div>
            </article>)}
          </div>;
        })}
        {visible.length === 0 && <div className="empty">No Courts found. Try another team or league.</div>}
      </section>
      <footer><BrandMark/><span>Football is a conversation. Make your case.</span><small>SETTLE THIS! · 2026</small></footer>
    </main>
    <nav className="bottom-nav">{["Courts","My Courts","Tasks","Rankings","Wallet"].map((n,i)=><button key={n} className={nav===n?"selected":""} onClick={()=>{setNav(n);if(n==="Wallet")setWalletOpen(true);}}><span>{["▦","▤","✦","♜","◉"][i]}</span>{n}</button>)}</nav>
    {nav !== "Courts" && nav !== "Wallet" && <div className="notice">{nav} will be added in the next product build.</div>}
    {walletOpen && <Wallet close={()=>{setWalletOpen(false);setNav("Courts");}}/>}
    {selectedCase && <div className="overlay" onClick={()=>setSelectedCase(null)}><section className="case-sheet" onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={()=>setSelectedCase(null)}>×</button>
      <div className="sheet-kicker">{leagues.find(l=>l.id===selectedCase.leagueId)?.name} · {selectedCase.topic}</div><h2>{selectedCase.title}</h2>
      <div className="case-teams"><Team id={selectedCase.homeId} name={selectedCase.home}/><span>VS</span><Team id={selectedCase.awayId} name={selectedCase.away}/></div>
      <div className="case-detail"><small>THE QUESTION</small><p>{selectedCase.detail}</p><span>ILLUSTRATIVE COURT CASE · NOT A LIVE MATCH REPORT</span></div>
      <div className="verdict-label">CHOOSE YOUR SIDE</div><div className="verdicts"><button className={side==="left"?"chosen":""} onClick={()=>setSide("left")}><i>A</i><b>{selectedCase.left}</b></button><button className={side==="right"?"chosen":""} onClick={()=>setSide("right")}><i>B</i><b>{selectedCase.right}</b></button></div>
      <div className="entry-line"><span>MINIMUM COURT ENTRY</span><b>500 CT</b></div><button className="submit-verdict" disabled={!side} onClick={()=>alert("Court entry is a design preview. Wallet transactions and live participation are not connected yet.")}>{side?"CONTINUE · 500 CT":"SELECT A SIDE TO CONTINUE"}</button>
    </section></div>}
  </div>;
}
