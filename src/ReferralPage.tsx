import { useCallback, useEffect, useState } from "react";

type ReferralRecord = { attributed_at: string; qualified_at: string | null; username: string | null; first_name: string | null };
type ReferralReward = { milestone: number; amount: number; created_at: string };
type ReferralData = { code: string | null; invite_link: string | null; total: number; qualified: number; target: number; reward: number; token: string; referrals: ReferralRecord[]; rewards: ReferralReward[] };

export default function ReferralPage({ onBack, showNotice }: { onBack: () => void; showNotice: (message: string) => void }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) { setError("Open Settle This! inside Telegram to access your personal referral dashboard."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/referrals", { headers: { "x-telegram-init-data": initData }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.code) throw new Error(result.error || "Referral information could not be loaded.");
      setData({ ...result, referrals: Array.isArray(result.referrals) ? result.referrals : [], rewards: Array.isArray(result.rewards) ? result.rewards : [] });
    } catch (e) { setError(e instanceof Error ? e.message : "Referral information could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const copyLink = async () => {
    if (!data?.invite_link) { showNotice("Your referral link is not available. The official Telegram bot username must be configured."); return; }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(data.invite_link);
      else throw new Error("Clipboard access is unavailable in this browser.");
      showNotice("Your personal referral link has been copied.");
    } catch (e) { showNotice(e instanceof Error ? e.message : "The referral link could not be copied."); }
  };
  const shareLink = () => {
    if (!data?.invite_link) { showNotice("Your referral link is not available. The official Telegram bot username must be configured."); return; }
    const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(data.invite_link) + "&text=" + encodeURIComponent("Join me on Settle This! — the football courtroom.");
    if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(shareUrl);
    else window.open(shareUrl, "_blank", "noopener,noreferrer");
  };
  const progress = data ? Math.min(data.target, data.qualified) : 0;
  return <div className="referral-page">
    <div className="referral-page-top"><button type="button" onClick={onBack} aria-label="Back to home">← BACK</button><span className="eyebrow">SETTLE THIS! · COMMUNITY GROWTH</span></div>
    <div className="referral-page-heading"><div><span className="eyebrow">YOUR REFERRAL CENTRE</span><h1>Build your football network.</h1><p>Invite fans to join the courtroom. Follow every referral from sign-up to qualification and see the rewards you have earned.</p></div><span className="referral-page-mark">↗</span></div>
    {loading ? <div className="referral-page-state">Loading your referral dashboard…</div> : error ? <div className="referral-page-state referral-page-error"><b>We couldn't load your referrals.</b><p>{error}</p><button type="button" onClick={()=>void refresh()}>TRY AGAIN</button></div> : data && <>
      <section className="referral-link-card"><div className="referral-link-head"><span>YOUR PERSONAL INVITE LINK</span><b>{data.code}</b></div><div className="referral-link-value">{data.invite_link || "Invite link unavailable — check bot configuration"}</div><div className="referral-link-actions"><button type="button" onClick={()=>void copyLink()} disabled={!data.invite_link}>COPY LINK</button><button type="button" onClick={shareLink} disabled={!data.invite_link}>SHARE INVITE ↗</button></div></section>
      <section className="referral-performance"><div className="referral-performance-title"><div><span className="eyebrow">YOUR NETWORK</span><h2>Referral performance</h2></div><button type="button" onClick={()=>void refresh()}>↻ REFRESH</button></div><div className="referral-metric-grid"><article><small>INVITED</small><strong>{data.total.toLocaleString()}</strong><span>Members attributed to your link</span></article><article><small>QUALIFIED</small><strong>{data.qualified.toLocaleString()}</strong><span>Completed the qualification steps</span></article><article><small>IN PROGRESS</small><strong>{Math.max(0,data.total-data.qualified).toLocaleString()}</strong><span>Not qualified yet</span></article></div></section>
      <section className="referral-milestone-card"><div className="referral-milestone-top"><div><span className="eyebrow">CURRENT REWARD MILESTONE</span><h2>Three qualified referrals</h2><p>A referral qualifies after the invited member completes onboarding and claims the welcome gift.</p></div><div className="referral-milestone-reward"><strong>{data.reward.toLocaleString()}</strong><small>{data.token}</small></div></div><div className="referral-milestone-progress"><div><b>{progress} of {data.target} qualified</b><span>{Math.round(progress/data.target*100)}%</span></div><div className="referral-page-track"><i style={{width:(progress/data.target*100)+"%"}}/></div><p>{data.qualified>=data.target?"Milestone reached. Your reward is recorded in your wallet when credited.":(data.target-data.qualified)+" more qualified referral"+(data.target-data.qualified===1?"":"s")+" needed to reach this milestone."}</p></section>
      <section className="referral-steps"><span className="eyebrow">HOW REFERRALS WORK</span><div><b>01 · Share your link</b><p>Send your personal Settle This! invite link to football fans and communities.</p></div><div><b>02 · They join Settle This!</b><p>Their first registration through your link is attributed to your account. Self-referrals are not counted.</p></div><div><b>03 · They complete onboarding</b><p>They must finish onboarding and claim the welcome gift before the referral becomes qualified.</p></div><div><b>04 · Your milestone is credited</b><p>When you reach three qualified referrals, the current milestone reward is 500 SETHIS. The credit is recorded in your wallet.</p></div></section>
      <section className="referral-activity"><div className="referral-performance-title"><div><span className="eyebrow">INVITATION TRACKER</span><h2>Your referred members</h2></div><span>{data.referrals.length} RECORDS</span></div>{data.referrals.length===0?<div className="referral-empty">No referrals yet. Share your link to start building your network.</div>:<div className="referral-member-list">{data.referrals.map((person,index)=><article key={person.attributed_at+":"+index}><span className="referral-member-avatar">{(person.first_name||person.username||"F").slice(0,1).toUpperCase()}</span><div><b>{person.username?"@"+person.username:person.first_name||"Settle This! member"}</b><small>Joined {new Date(person.attributed_at+"Z").toLocaleDateString()}</small></div><span className={"referral-member-status"+(person.qualified_at?" qualified":"")}>{person.qualified_at?"QUALIFIED":"IN PROGRESS"}</span></article>)}</div>}</section>
      <section className="referral-reward-history"><span className="eyebrow">REWARD HISTORY</span><h2>Milestones earned</h2>{data.rewards.length===0?<p>No referral milestone rewards have been recorded yet. Your progress will appear here.</p>:data.rewards.map(reward=><article key={reward.milestone}><span><b>{reward.milestone} qualified referrals</b><small>{new Date(reward.created_at+"Z").toLocaleDateString()}</small></span><strong>+{reward.amount.toLocaleString()} SETHIS</strong></article>)}</section>
      <small className="referral-page-note">Referral rewards are governed by the programme rules. Only genuine new members who complete the required steps qualify. Do not create duplicate accounts or misrepresent invitations.</small>
    </>}
  </div>;
}
