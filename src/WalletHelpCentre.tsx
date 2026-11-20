import { useState } from "react";
import CustomerCare from "./CustomerCare";
import "./WalletHelpCentre.css";

type ArticleKey = "how" | "terms" | "privacy" | "community";

function HelpIcon({name}:{name:"support"|"guide"|"rules"|"privacy"|"community"}) {
  const common={viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
  const paths:Record<string,React.ReactNode>={
    support:<><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4Zm16 0h-3v6h1a2 2 0 0 0 2-2v-4ZM17 20h-4"/></>,
    guide:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 6h12M8 9h8m-8 4h7"/></>,
    rules:<><path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    privacy:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    community:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1m2-9a3 3 0 1 0 0-6m1 9a5 5 0 0 1 3 5"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const faqs = [
  {q:"What is SETHIS?",a:"SETHIS is a football gaming and entertainment platform. Members take on football challenges, test their knowledge, build game records and compete on the rankings. Mystery Footballer is the first featured game, with more games planned for the platform."},
  {q:"What is Guess Who? / Mystery Footballer?",a:"Mystery Footballer is a football identity guessing game. A player's identity is hidden while you work through up to three clues and make up to three guesses. Identify the player to earn game points."},
  {q:"How do I start a Mystery Footballer round?",a:"Open Games, choose a difficulty and check the displayed CT entry cost. Select Start Game to begin. Your CT entry is deducted when the round is successfully created."},
  {q:"How many clues and guesses do I get?",a:"Each round has three clues and up to three guesses. You can unlock the next available clue when you need another hint. An incorrect guess uses one chance."},
  {q:"How are Mystery Footballer points awarded?",a:"The current scoring guide awards 100 points for a correct answer using clue one, 70 points using clue two and 40 points using clue three. Three incorrect guesses end the round and reveal the player. Spending more CT does not improve your ranking."},
  {q:"What are CT and SETHIS?",a:"CT is the in-app participation currency used to enter eligible games and activities. SETHIS is a separate platform reward token. They are different balances, are tracked separately and are not interchangeable. Check each activity's displayed rules before taking part."},
  {q:"How can I earn CT?",a:"Where rewarded ads are available, you can watch a verified ad from the Games or Wallet area to receive the displayed CT reward. Ad availability, daily limits and cooldowns apply and are shown in the app. CT is credited only after the reward is verified."},
  {q:"Do I need an account to play?",a:"Yes. SETHIS games are for registered members. Open the official SETHIS Telegram Mini App and complete registration before starting a game. Guest play is not available."},
  {q:"How do rankings work?",a:"Mystery Footballer rankings use recorded game points and performance. Your position is earned through play; buying or spending CT does not buy ranking points."},
  {q:"Will SETHIS have other games?",a:"Yes. Mystery Footballer is the first featured game. The platform is being developed to support additional football games, which will be introduced as they become available."},
  {q:"Why is my game, balance or history not loading?",a:"Make sure you opened the official SETHIS Mini App inside Telegram and that your connection is stable. Reopen the relevant section and try again. If the issue continues, contact Customer Care with the approximate time and a short description. Never share login codes or private credentials."},
  {q:"How do I contact Customer Care?",a:"Open Help & Information in your Wallet and select Contact Support. Choose the closest topic, describe what happened and follow replies in your support history."}
];

export default function WalletHelpCentre() {
  const [expanded,setExpanded]=useState<number|null>(null);
  const [article,setArticle]=useState<ArticleKey|null>(null);
  const [query,setQuery]=useState("");
  const [supportOpen,setSupportOpen]=useState(false);
  const filtered=faqs.filter(item=>(item.q+" "+item.a).toLowerCase().includes(query.trim().toLowerCase()));
  const titles:Record<ArticleKey,string>={how:"How SETHIS games work",terms:"Game rules & fair play",privacy:"Privacy & account information",community:"Community standards"};
  return <>
    <section className="wallet-help-centre">
      <div className="wallet-help-heading"><div><span className="eyebrow">NEED A HAND?</span><h3>Help & information</h3><p>Find quick answers about games, tokens, rewards and your account.</p></div><span className="wallet-help-mark">?</span></div>
      <div className="wallet-help-group-label">YOUR SETHIS ACCOUNT</div>
      <div className="wallet-help-menu">
        <button className="wallet-help-menu-row" onClick={()=>setSupportOpen(true)}><span className="wallet-help-icon"><HelpIcon name="support"/></span><span className="wallet-help-copy"><b>Contact Support</b><small>Get help with your account or a Court</small></span><span className="wallet-help-chevron">›</span></button>
        <button className="wallet-help-menu-row" onClick={()=>setArticle("how")}><span className="wallet-help-icon"><HelpIcon name="guide"/></span><span className="wallet-help-copy"><b>How It Works</b><small>Games, CT, SETHIS and how to play</small></span><span className="wallet-help-chevron">›</span></button>
        <button className="wallet-help-menu-row" onClick={()=>setArticle("terms")}><span className="wallet-help-icon"><HelpIcon name="rules"/></span><span className="wallet-help-copy"><b>Platform Rules & Terms</b><small>Game entries, rewards and fair play</small></span><span className="wallet-help-chevron">›</span></button>
        <button className="wallet-help-menu-row" onClick={()=>setArticle("privacy")}><span className="wallet-help-icon"><HelpIcon name="privacy"/></span><span className="wallet-help-copy"><b>Privacy & Account</b><small>What your account information is used for</small></span><span className="wallet-help-chevron">›</span></button>
        <button className="wallet-help-menu-row" onClick={()=>setArticle("community")}><span className="wallet-help-icon"><HelpIcon name="community"/></span><span className="wallet-help-copy"><b>Community Standards</b><small>Keep the gaming community safe</small></span><span className="wallet-help-chevron">›</span></button>
      </div>
      <div className="wallet-help-group-label wallet-faq-label">QUICK ANSWERS</div>
      <label className="wallet-faq-search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setExpanded(null);}} placeholder="Search frequently asked questions" aria-label="Search frequently asked questions"/></label>
      <div className="wallet-faq-list">
        {filtered.map((item,index)=><article className={"wallet-faq-item"+(expanded===index?" open":"")} key={item.q}><button aria-expanded={expanded===index} onClick={()=>setExpanded(expanded===index?null:index)}><span>{item.q}</span><b>{expanded===index?"−":"+"}</b></button>{expanded===index&&<p>{item.a}</p>}</article>)}
        {filtered.length===0&&<p className="wallet-faq-empty">No matching answer found. Try another search or contact our support team.</p>}
      </div>
      <div className="wallet-help-footnote">Still need help? Open Contact Support and tell us what happened.</div>
    </section>
    {article&&<div className="wallet-help-overlay" role="presentation" onClick={()=>setArticle(null)}><section className="wallet-help-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-help-modal-title" onClick={e=>e.stopPropagation()}><button className="wallet-help-close" onClick={()=>setArticle(null)} aria-label="Close">×</button><span className="eyebrow">SETTLE THIS! · HELP CENTRE</span><h2 id="wallet-help-modal-title">{titles[article]}</h2><div className="wallet-help-modal-body">
      {article==="how"&&<><h3>1. Open Games</h3><p>SETHIS is a member-based football gaming platform. Games is your home for featured and future football challenges. Mystery Footballer is the first available game.</p><h3>2. Choose your challenge</h3><p>In Mystery Footballer, select Easy, Medium or Hard. Review the entry cost shown before you start. Your CT balance is checked and the entry is deducted when the round is successfully created.</p><h3>3. Read the clues</h3><p>The player's identity is hidden. Each round gives you up to three clues and three guesses. Unlock another clue when you need more information, then enter the footballer's name.</p><h3>4. Build your game record</h3><p>Correct answers earn points. The current Mystery Footballer scoring guide is 100 points on clue one, 70 on clue two and 40 on clue three. Three incorrect guesses end the round and reveal the answer.</p><h3>5. Manage your tokens</h3><p>CT is the participation currency for eligible games and activities. SETHIS is a separate reward token. Your Wallet shows their balances and recorded transactions. Rewarded ads may provide CT when available and after verification.</p><h3>6. Compete and invite friends</h3><p>Rankings reflect recorded game performance, not CT spending. Use Referrals to invite friends and check the current qualification rules and rewards shown there. More football games will be added as they are ready.</p></>}
      {article==="terms"&&<><p className="wallet-help-notice">This is a plain-language in-app guide, not a substitute for the complete legal Terms & Conditions. The formal terms and eligibility documents must be published and reviewed before public launch.</p><h3>Participating in Courts</h3><p>Read each game's instructions, entry cost, scoring rules and any reward conditions before playing. Do not use another person's account or attempt to manipulate game outcomes.</p><h3>Wallets and rewards</h3><p>CT and SETHIS are separate platform balances. Rewards are subject to the rules shown for the relevant game or activity and are recorded only when verified by the platform. No cash value, exchange listing or external transfer is promised.</p><h3>Fair participation</h3><p>Do not automate participation, create multiple accounts to exploit rewards, interfere with platform operations or attempt to influence an official verdict through payments or coordinated manipulation.</p><h3>Editorial decisions</h3><p>Game scores and outcomes are recorded according to the rules of each game. Do not attempt to manipulate scores, leaderboards or reward verification.</p></>}
      {article==="privacy"&&<><h3>Account identity</h3><p>Your Telegram identity is used to link your Mini App account and protect account-specific activity. Profile details such as your chosen clubhouse, country and bio are information you choose to provide.</p><h3>Platform records</h3><p>Settle This! maintains the activity, participation, moderation and wallet records needed to operate Courts, display history, resolve outcomes and prevent abuse.</p><h3>Keep your account safe</h3><p>Never share Telegram login codes, passwords or private credentials with anyone claiming to be support. Use the official Mini App and contact support through the in-app entry point.</p><h3>Your choices</h3><p>Only provide profile information you are comfortable sharing. The full privacy notice, retention details and applicable data-rights contact must be published before public launch.</p></>}
      {article==="community"&&<><h3>Enjoy the game. Respect the player.</h3><p>Keep interactions respectful. Harassment, threats, hate, impersonation and personal attacks are not allowed.</p><h3>Bring credible evidence</h3><p>Do not submit fabricated answers, manipulate game activity, impersonate another member or mislead others to exploit rewards.</p><h3>Protect privacy</h3><p>Do not publish private contact details, account information or personal data belonging to another member.</p><h3>Respect moderation</h3><p>Use reporting tools responsibly. Do not spam, coordinate abuse, evade moderation or attempt to manipulate reactions and participation.</p><h3>Keep outcomes fair</h3><p>Never buy, sell or coordinate account activity, game answers, scores or reward claims.</p></>}
    </div><button className="wallet-help-done" onClick={()=>setArticle(null)}>GOT IT</button></section></div>}
    {supportOpen&&<CustomerCare onClose={()=>setSupportOpen(false)}/>}
  </>;
}
