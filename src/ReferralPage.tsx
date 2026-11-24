import { useCallback, useEffect, useState } from "react";
import { Check, Group, Lock, ShareAndroid, Trophy, UserPlus } from "iconoir-react";
import "./ReferralPage.css";

type ReferralRecord = { attributed_at: string; qualified_at: string | null; username: string | null; first_name: string | null };
type ReferralReward = { milestone: number; amount: number; created_at: string };
type ReferralMilestone = { milestone: number; threshold: number; reward: number; title: string; description: string; earned: boolean };
type ReferralData = { telegram_verified?: boolean; code: string | null; invite_link: string | null; total: number; qualified: number; pending: number; target: number; reward: number; token: string; milestones: ReferralMilestone[]; next_milestone: ReferralMilestone | null; referrals: ReferralRecord[]; rewards: ReferralReward[] };
type CommunityData = { invited: number; qualified: number; contributors: number; member_qualified: number; targets: Array<{number:number;threshold:number;title:string;reward_title:string;reward_description:string;achieved:boolean}>; achieved: number[]; next_target: number | null; progress_target: number; progress_percent: number; eligibility: boolean; eligibility_rule: string; reward_status: string; leaderboard?: Array<{rank:number;name:string;qualified:number;is_you:boolean}>; achievements?:Array<{number:number;threshold:number;title:string;achieved_at:string}> };

const number = (value: number) => (Number(value) || 0).toLocaleString();
const date = (value: string) => new Date(value.endsWith("Z") ? value : value + "Z").toLocaleDateString();
const challengeTitle = (threshold: number) => `Bring ${number(threshold)} qualified fans into SETHIS`;

export default function ReferralPage({ onBack, showNotice }: { onBack: () => void; showNotice: (message: string) => void }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [communityError, setCommunityError] = useState("");
  const [showAllMilestones, setShowAllMilestones] = useState(true);
  const [referralView,setReferralView]=useState<"overview"|"community"|"activity">("overview");

  const refresh = useCallback(async () => {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) { setError("Open SETHIS inside Telegram to access your referrals."); setLoading(false); return; }
    setLoading(true); setError("");
    const headers = { "x-telegram-init-data": initData };
    try {
      const [referralResponse, communityResponse] = await Promise.all([
        fetch("/api/referrals", { headers, cache: "no-store" }),
        fetch("/api/referral-community", { headers, cache: "no-store" })
      ]);
      const referralResult = await referralResponse.json();
      if (!referralResponse.ok || !referralResult?.code) {
        const message=referralResponse.status===401 ? "Telegram could not verify this session. Close and reopen SETHIS from its official bot, then retry." : referralResponse.status===503 ? "The referral service is temporarily unavailable. Please retry shortly." : (referralResult.error || "Referral information could not be loaded.");
        throw new Error(message);
      }
      setData({ ...referralResult, referrals: Array.isArray(referralResult.referrals) ? referralResult.referrals : [], rewards: Array.isArray(referralResult.rewards) ? referralResult.rewards : [], milestones: Array.isArray(referralResult.milestones) ? referralResult.milestones : [] });
      if (communityResponse.ok) { setCommunity(await communityResponse.json()); setCommunityError(""); }
      else { const result = await communityResponse.json().catch(() => ({})); setCommunityError(result.error || "Community progress could not be loaded."); }
    } catch (e) { setError(e instanceof Error ? e.message : "Referral information could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const copyLink = async () => {
    if (!data?.invite_link) { showNotice("Your referral link is not available."); return; }
    try { await navigator.clipboard.writeText(data.invite_link); showNotice("Your invite link has been copied."); }
    catch { showNotice("The referral link could not be copied on this device."); }
  };
  const shareLink = () => {
    if (!data?.invite_link) { showNotice("Your referral link is not available."); return; }
    const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(data.invite_link) + "&text=" + encodeURIComponent("Join me on SETHIS Football Games. Let's see who really knows football.");
    if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(shareUrl);
    else window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const next = data?.next_milestone || null;
  const nextProgress = next && data ? Math.min(100, Math.round(data.qualified / next.threshold * 100)) : 100;
  const communityTarget = community?.next_target || community?.progress_target || 1000;

  return <div className="referral-page">
    <div className="referral-page-top">
      <button type="button" onClick={onBack} aria-label="Back to home">← BACK</button>
      <span className="eyebrow">SETHIS · COMMUNITY GROWTH</span>
    </div>

    <header className="referral-hero">
      <div className="referral-hero-copy">
        <span className="eyebrow">YOUR REFERRAL CENTRE</span>
        <h1>Grow your football circle.</h1>
        <p>Bring your people into the game.</p>
      </div>
      <span className="referral-hero-icon" aria-hidden="true"><Group width={30} height={30} strokeWidth={1.8}/></span>
    </header>

    {loading ? <div className="referral-state">Loading your referrals…</div> : error ? <div className="referral-state referral-error"><b>We couldn't load your referrals.</b><p>{error}</p><button type="button" onClick={()=>void refresh()}>TRY AGAIN</button></div> : data && <>
      <section className="referral-invite-card">
        <div className="referral-invite-heading">
          <div><span className="eyebrow">YOUR PERSONAL INVITE LINK</span><b>{data.code}</b></div>
          <span className="referral-invite-icon"><UserPlus width={21} height={21}/></span>
        </div>
        <div className="referral-link-value">{data.invite_link || "Invite link unavailable"}</div>
        <div className="referral-link-actions">
          <button type="button" className="referral-copy-button" onClick={()=>void copyLink()} disabled={!data.invite_link}>COPY LINK</button>
          <button type="button" className="referral-share-button" onClick={shareLink} disabled={!data.invite_link}><ShareAndroid width={16} height={16}/> SHARE INVITE</button>
        </div>
      </section>

      <nav className="referral-tabs" role="tablist" aria-label="Referral sections">
        <button role="tab" aria-selected={referralView==="overview"} className={referralView==="overview"?"active":""} onClick={()=>setReferralView("overview")}>MY PROGRESS</button>
        <button role="tab" aria-selected={referralView==="community"} className={referralView==="community"?"active":""} onClick={()=>setReferralView("community")}>COMMUNITY</button>
        <button role="tab" aria-selected={referralView==="activity"} className={referralView==="activity"?"active":""} onClick={()=>setReferralView("activity")}>ACTIVITY</button>
      </nav>

      {referralView==="overview"&&<div className="referral-view-panel">
        <section className="referral-section">
          <div className="referral-section-heading"><div><span className="eyebrow">YOUR NETWORK</span><h2>Referral snapshot</h2></div><button type="button" onClick={()=>void refresh()} aria-label="Refresh referrals">↻</button></div>
          <div className="referral-stat-grid">
            <article><small>INVITED</small><strong>{number(data.total)}</strong></article>
            <article><small>QUALIFIED</small><strong>{number(data.qualified)}</strong></article>
            <article><small>PENDING</small><strong>{number(data.pending ?? Math.max(0,data.total-data.qualified))}</strong></article>
          </div>
        </section>

        <section className="referral-next-card">
          <div className="referral-next-main">
            <span className="eyebrow">YOUR NEXT CHALLENGE</span>
            {next ? <><h2>{challengeTitle(next.threshold)}</h2><div className="referral-next-reward"><Trophy width={16} height={16}/><strong>{number(next.reward)} SETHIS</strong></div></> : <><h2>Milestone ladder completed</h2><div className="referral-next-reward"><Check width={16} height={16}/><strong>ALL CURRENT REWARDS UNLOCKED</strong></div></>}
          </div>
          <div className="referral-progress-summary">
            <div><b>{number(data.qualified)} <span>/ {next?number(next.threshold):"20,000"} qualified</span></b><strong>{next?nextProgress+"%":"100%"}</strong></div>
            <div className="referral-progress-track"><i style={{width:nextProgress+"%"}}/></div>
            <small>{next?number(Math.max(0,next.threshold-data.qualified))+" more qualified invite"+(next.threshold-data.qualified===1?"":"s")+" to unlock":"Every published personal milestone reached"}</small>
          </div>
        </section>

        <section className="referral-section referral-milestone-journey">
          <div className="referral-section-heading">
            <div><span className="eyebrow">KEEP THE MOMENTUM</span><h2>Milestone challenges</h2></div>
            <button type="button" onClick={()=>setShowAllMilestones(v=>!v)}>{showAllMilestones?"COLLAPSE":"VIEW ALL"}</button>
          </div>
          <div className="referral-milestone-list">
            {(showAllMilestones?data.milestones:data.milestones.filter(m=>m.earned||m.milestone===next?.milestone)).map(item=>{
              const earned=item.earned;
              const current=!earned&&item.milestone===next?.milestone;
              const progress=earned?100:Math.min(100,Math.round(data.qualified/item.threshold*100));
              const remaining=Math.max(0,item.threshold-data.qualified);
              return <article key={item.milestone} className={"referral-milestone-item "+(earned?"earned":current?"current":"locked")}>
                <span className="referral-milestone-state" aria-label={earned?"Unlocked":current?"In progress":"Locked"}>{earned?<Check width={17} height={17}/>:current?<Trophy width={17} height={17}/>:<Lock width={16} height={16}/>}</span>
                <div className="referral-milestone-content">
                  <div className="referral-milestone-title-row"><b>{challengeTitle(item.threshold)}</b><small>{earned?"UNLOCKED":current?"IN PROGRESS":"LOCKED"}</small></div>
                  <div className="referral-milestone-progress-label"><span>{number(Math.min(data.qualified,item.threshold))} / {number(item.threshold)} qualified</span><span>{progress}%</span></div>
                  <div className="referral-milestone-track"><i style={{width:progress+"%"}}/></div>
                  <small className="referral-milestone-remaining">{earned?"Challenge completed":current?number(remaining)+" more to unlock":"Reach the previous challenge to unlock"}</small>
                </div>
                <div className="referral-milestone-reward"><strong>{number(item.reward)}</strong><small>SETHIS</small></div>
              </article>;
            })}
          </div>
        </section>
      </div>}

      {referralView==="community"&&<div className="referral-view-panel">
        <section className="referral-community-card">
          {communityError?<div className="referral-error">{communityError}</div>:community?<>
            <div className="referral-community-heading"><div><span className="eyebrow">ONE SHARED TARGET</span><h2>Community challenge</h2></div><span className="referral-community-icon"><Group width={25} height={25}/></span></div>
            <div className="referral-community-total">
              <div><small>QUALIFIED MEMBERS</small><strong>{number(community.qualified)}</strong><span>of {number(communityTarget)}</span></div>
              <div className="referral-community-percent">{community.progress_percent}%</div>
            </div>
            <div className="referral-progress-track"><i style={{width:community.progress_percent+"%"}}/></div>
            <p className="referral-community-explainer">Every qualified referral from every member adds to this same community total.</p>
            <div className="referral-community-stats">
              <article><strong>{number(community.member_qualified)}</strong><small>YOUR CONTRIBUTION</small></article>
              <article><strong>{number(community.contributors)}</strong><small>ACTIVE CONTRIBUTORS</small></article>
              <article><strong>{number(community.invited)}</strong><small>TOTAL INVITES</small></article>
            </div>
            <div className="referral-contribution-status">
              <span className={community.eligibility?"contributing":"not-contributing"}>{community.eligibility?"✓ YOU'RE CONTRIBUTING":"YOUR FIRST QUALIFIED INVITE AWAITS"}</span>
              <b>{community.eligibility?number(community.member_qualified)+" qualified invite"+(community.member_qualified===1?"":"s")+" added by you":"Invite a friend and help move the shared target"}</b>
            </div>
            <div className="referral-community-ladder">
              <div className="referral-section-heading"><div><span className="eyebrow">SHARED MILESTONES</span><h3>Community targets</h3></div></div>
              <div className="referral-community-targets">{community.targets.map(target=>{
                const active=!target.achieved&&community.next_target===target.threshold;
                return <div key={target.number} className={"referral-community-target "+(target.achieved?"achieved":active?"active":"locked")}>
                  <span>{target.achieved?<Check width={16} height={16}/>:active?<Trophy width={16} height={16}/>:<Lock width={15} height={15}/>}</span>
                  <b>{number(target.threshold)}</b>
                  <small>{target.achieved?"REACHED":active?"NEXT TARGET":"LOCKED"}</small>
                </div>;
              })}</div>
            </div>
            <div className="referral-community-reward">
              <span className="eyebrow">COMMUNITY REWARD</span>
              <b>{community.reward_status==="not_announced"?"REWARD DETAILS TO BE ANNOUNCED":community.targets.find(target=>target.threshold===community.next_target)?.reward_title||"COMMUNITY REWARD"}</b>
              <small>{community.reward_status==="not_announced"?"The shared progress is live. Reward and eligibility terms will be published before activation.":community.targets.find(target=>target.threshold===community.next_target)?.reward_description}</small>
            </div>
            <div className="referral-community-leaders">
              <div className="referral-section-heading"><div><span className="eyebrow">LEADING THE WAY</span><h3>Top contributors</h3></div></div>
              {community.leaderboard?.length?community.leaderboard.map(person=><div key={person.rank} className={"referral-community-leader"+(person.is_you?" you":"")}>
                <span className="referral-leader-rank">{person.rank===1?<Trophy width={15} height={15}/>:person.rank}</span>
                <b>{person.name}{person.is_you?" · YOU":""}</b>
                <strong>{number(person.qualified)} <small>QUALIFIED</small></strong>
              </div>):<div className="referral-empty">No qualified contributors yet.</div>}
            </div>
            {community.achievements?.length? <div className="referral-community-achievements"><span className="eyebrow">COMPLETED</span>{community.achievements.map(a=><span key={a.number}><Check width={13} height={13}/>{a.title} · {number(a.threshold)}</span>)}</div>:null}
          </>:<div className="referral-state">Loading shared progress…</div>}
        </section>
      </div>}

      {referralView==="activity"&&<div className="referral-view-panel">
        <section className="referral-section referral-activity">
          <div className="referral-section-heading"><div><span className="eyebrow">INVITATION TRACKER</span><h2>Your invitations</h2></div><strong className="referral-record-count">{number(data.referrals.length)}</strong></div>
          {data.referrals.length===0?<div className="referral-empty"><UserPlus width={22} height={22}/><b>No invitations yet</b><span>Share your link to bring the first fan in.</span></div>:<div className="referral-member-list">{data.referrals.map((person,index)=><article key={person.attributed_at+":"+index}>
            <span className="referral-member-avatar">{(person.first_name||person.username||"F").slice(0,1).toUpperCase()}</span>
            <div><b>{person.username?"@"+person.username:person.first_name||"SETHIS member"}</b><small>{date(person.attributed_at)}</small></div>
            <span className={"referral-member-status"+(person.qualified_at?" qualified":"")}>{person.qualified_at?"QUALIFIED":"PENDING"}</span>
          </article>)}</div>}
        </section>
        <section className="referral-section referral-reward-history">
          <div className="referral-section-heading"><div><span className="eyebrow">REWARD HISTORY</span><h2>Milestones earned</h2></div><strong className="referral-record-count">{number(data.rewards.length)}</strong></div>
          {data.rewards.length===0?<div className="referral-empty"><Trophy width={22} height={22}/><b>No rewards recorded yet</b><span>Unlocked rewards will appear here.</span></div>:data.rewards.map(reward=><article key={reward.milestone}>
            <span><b>{number(reward.milestone)} qualified referrals</b><small>{date(reward.created_at)}</small></span>
            <strong>+{number(reward.amount)} SETHIS</strong>
          </article>)}
        </section>
      </div>}
    </>}
  </div>;
}
