import { useEffect, useState } from "react";
import { Check, Group, Lock, ShareAndroid, Trophy, UserPlus } from "iconoir-react";
import "./ReferralPage.css";

type ReferralRecord = { attributed_at: string; qualified_at: string | null; username: string | null; first_name: string | null };
type ReferralReward = { milestone: number; amount: number; created_at: string };
type ReferralMilestone = { milestone: number; threshold: number; reward: number; title: string; description: string; earned: boolean };
export type ReferralData = { code: string | null; invite_link: string | null; total: number; qualified: number; pending: number; target: number; reward: number; token: string; milestones: ReferralMilestone[]; next_milestone: ReferralMilestone | null; referrals: ReferralRecord[]; rewards: ReferralReward[] };
type LeadershipData={is_leader:boolean;status:string;personal_qualified:number;branch_qualified:number;active_members:number;active_ratio:number;low_activity_since:string|null;recovery_days_remaining:number;commission_earned:number;commission_paid:number;commission_pending:number;branch_leaders:Array<{user_id:string;name:string;status:string;personal_qualified:number;branch_qualified:number;active_ratio:number}>;personal_threshold:number;hybrid_personal_threshold:number;branch_threshold:number;active_threshold:number;recovery_days:number};
export type CommunityData = { invited: number; qualified: number; contributors: number; member_qualified: number; leadership?:LeadershipData; commission_rates?:{direct_percent:number;upline_percent:number;maximum_combined_percent:number}; activity_rule?:{window_days:number;minimum_active_percent:number;warning_below_percent:number;recovery_days:number}; targets: Array<{number:number;threshold:number;title:string;reward_title:string;reward_description:string;achieved:boolean}>; achieved: number[]; next_target: number | null; progress_target: number; progress_percent: number; eligibility: boolean; eligibility_rule: string; reward_status: string; leaderboard?: Array<{rank:number;name:string;qualified:number;is_you:boolean}>; achievements?:Array<{number:number;threshold:number;title:string;achieved_at:string}> };

const number = (value: number) => (Number(value) || 0).toLocaleString();
const date = (value: string) => new Date(value.endsWith("Z") ? value : value + "Z").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
const clampPercent = (value:number) => Math.max(0,Math.min(100,Number(value)||0));
const challengeTitle = (threshold:number) => {
  const titles:Record<number,string> = {
    3:"Kick off your squad",8:"Grow your football circle",15:"Build a stronger squad",25:"Bring a crowd to SETHIS",
    50:"Make it fifty strong",100:"Hit the century",250:"Build a community movement",500:"Fill the stands",
    1000:"Lead a thousand fans",2500:"Take it city-wide",5000:"Make it national",10000:"Reach ten thousand",20000:"Build a football movement"
  };
  return titles[threshold] || `Bring ${number(threshold)} fans into SETHIS`;
};

export default function ReferralPage({ onBack, showNotice, initialData, initialCommunity, initialLoading, initialError, initialCommunityError, onRefresh }: { onBack: () => void; showNotice: (message: string) => void; initialData: ReferralData|null; initialCommunity: CommunityData|null; initialLoading: boolean; initialError: string; initialCommunityError: string; onRefresh: () => Promise<void> }) {
  const [data,setData]=useState<ReferralData|null>(initialData);
  const [community,setCommunity]=useState<CommunityData|null>(initialCommunity);
  const [loading,setLoading]=useState(initialLoading);
  const [error,setError]=useState(initialError);
  const [communityError,setCommunityError]=useState(initialCommunityError);
  const [view,setView]=useState<"progress"|"community"|"activity">("progress");
  const [showAll,setShowAll]=useState(false);

  useEffect(()=>{setData(initialData);setCommunity(initialCommunity);setLoading(initialLoading);setError(initialError);setCommunityError(initialCommunityError);},[initialData,initialCommunity,initialLoading,initialError,initialCommunityError]);

  const copyLink=async()=>{
    if(!data?.invite_link){showNotice("Your referral link is not available.");return;}
    try{await navigator.clipboard.writeText(data.invite_link);showNotice("Invite link copied.");}
    catch{showNotice("The referral link could not be copied on this device.");}
  };
  const shareLink=()=>{
    if(!data?.invite_link){showNotice("Your referral link is not available.");return;}
    const url="https://t.me/share/url?url="+encodeURIComponent(data.invite_link)+"&text="+encodeURIComponent("Join me on SETHIS Football Games. Let's see who really knows football.");
    if(window.Telegram?.WebApp?.openTelegramLink)window.Telegram.WebApp.openTelegramLink(url);
    else window.open(url,"_blank","noopener,noreferrer");
  };

  const next=data?.next_milestone||null;
  const communityTarget=community?.next_target||community?.progress_target||community?.targets?.[0]?.threshold||1000;
  const communityPercent=community?clampPercent(community.progress_percent):0;
  const remaining=next&&data?Math.max(0,next.threshold-data.qualified):0;

  return <div className="referral-page rfx-page">
    <div className="rfx-topline">
      <button type="button" className="rfx-back" onClick={onBack} aria-label="Back to games"><span aria-hidden="true">←</span> BACK</button>
      <span className="rfx-brand-label">SETHIS <i/> REFERRALS</span>
    </div>

    <header className="rfx-hero">
      <div className="rfx-hero-copy">
        <span className="rfx-kicker">GROW THE SETHIS COMMUNITY</span>
        <h1>Your people.<br/><em>Your impact.</em></h1>
        <p>Invite football fans. Track your progress. Unlock referral rewards.</p>
      </div>
      <div className="rfx-hero-art" aria-hidden="true">
        <span className="rfx-orbit rfx-orbit-one"/><span className="rfx-orbit rfx-orbit-two"/>
        <span className="rfx-person rfx-person-main"><i/></span>
        <span className="rfx-person rfx-person-left"><i/></span>
        <span className="rfx-person rfx-person-right"><i/></span>
        <span className="rfx-hero-ball">✦</span>
      </div>
    </header>

    {loading?<div className="rfx-state">Loading referral progress…</div>:error?<div className="rfx-state rfx-error"><b>Referrals unavailable</b><p>{error}</p><button type="button" onClick={()=>void refresh()}>TRY AGAIN</button></div>:data&&<>
      <section className="rfx-invite">
        <div className="rfx-invite-top">
          <div><span className="rfx-kicker">YOUR PERSONAL INVITE</span><h2>Bring your crew in.</h2></div>
          <span className="rfx-invite-mark"><UserPlus width={23} height={23}/></span>
        </div>
        <div className="rfx-link-box">
          <span>{data.invite_link||"Invite link unavailable"}</span>
          <span className="rfx-link-code">{data.code}</span>
        </div>
        <div className="rfx-actions">
          <button type="button" className="rfx-copy" onClick={()=>void copyLink()} disabled={!data.invite_link}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg> COPY LINK
          </button>
          <button type="button" className="rfx-share" onClick={shareLink} disabled={!data.invite_link}>
            <ShareAndroid width={18} height={18}/> SHARE INVITE
          </button>
        </div>
      </section>

      <nav className="rfx-tabs" role="tablist" aria-label="Referral sections">
        <button type="button" role="tab" aria-selected={view==="progress"} className={view==="progress"?"active":""} onClick={()=>setView("progress")}>MY PROGRESS</button>
        <button type="button" role="tab" aria-selected={view==="community"} className={view==="community"?"active":""} onClick={()=>setView("community")}>COMMUNITY</button>
        <button type="button" role="tab" aria-selected={view==="activity"} className={view==="activity"?"active":""} onClick={()=>setView("activity")}>ACTIVITY</button>
      </nav>

      {view==="progress"&&<div className="rfx-panel">
        <section className="rfx-stats">
          <div className="rfx-stat-primary"><span className="rfx-kicker">QUALIFIED FANS</span><strong>{number(data.qualified)}</strong><small>of {number(data.total)} invited</small></div>
          <div className="rfx-stat-pair">
            <article><b>{number(data.total)}</b><span>INVITED</span></article>
            <article><b>{number(data.pending??Math.max(0,data.total-data.qualified))}</b><span>PENDING</span></article>
          </div>
        </section>

        <section className="rfx-milestones">
          <div className="rfx-section-head">
            <div><span className="rfx-kicker">YOUR REFERRAL JOURNEY</span><h2>Milestone challenges</h2><p>Each milestone brings a new SETHIS reward.</p></div>
            <button type="button" className="rfx-refresh" onClick={()=>void onRefresh()} aria-label="Refresh referral progress">↻</button>
          </div>
          {next&&<article className="rfx-feature-challenge">
            <div className="rfx-feature-top"><span className="rfx-live-tag"><i/> NEXT UNLOCK</span><span className="rfx-reward-pill"><Trophy width={14} height={14}/>{number(next.reward)} SETHIS</span></div>
            <h3>{challengeTitle(next.threshold)}</h3>
            <div className="rfx-feature-bottom"><b>{number(data.qualified)} <small>/ {number(next.threshold)} qualified</small></b><strong>{Math.min(100,Math.round(data.qualified/next.threshold*100))}%</strong></div>
            <div className="rfx-progress-track"><i style={{width:Math.min(100,data.qualified/next.threshold*100)+"%"}}/></div>
            <span className="rfx-remaining">{remaining?number(remaining)+" more qualified "+(remaining===1?"fan":"fans")+" to unlock": "Milestone ready to unlock"}</span>
          </article>}
          <div className="rfx-ladder-head"><span>THE MILESTONE LADDER</span><button type="button" onClick={()=>setShowAll(v=>!v)}>{showAll?"SHOW LESS":"VIEW ALL"} <span>{showAll?"−":"+"}</span></button></div>
          <div className="rfx-ladder">
            {(showAll?data.milestones.filter(m=>m.earned||m.milestone!==next?.milestone):data.milestones.filter(m=>m.earned||(m.milestone!==next?.milestone&&m.milestone<=(next?.milestone??0)+2))).map(item=>{
              const earned=item.earned;
              const state=earned?"earned":"locked";
              return <article key={item.milestone} className={"rfx-milestone "+state}>
                <span className="rfx-milestone-icon">{earned?<Check width={18} height={18}/>:<Lock width={16} height={16}/>}</span>
                <div className="rfx-milestone-main">
                  <div className="rfx-milestone-title"><b>{challengeTitle(item.threshold)}</b><span>{earned?"COMPLETED":"LOCKED"}</span></div>
                  {earned?<><div className="rfx-milestone-meta"><span>{number(item.threshold)} qualified fans</span><b>100%</b></div><div className="rfx-mini-track"><i style={{width:"100%"}}/></div></>:<small className="rfx-locked-copy">Unlocks after your current challenge</small>}
                </div>
                <div className="rfx-milestone-reward"><strong>{number(item.reward)}</strong><small>SETHIS</small></div>
              </article>;
            })}
          </div>
        </section>
      </div>}

      {view==="community"&&<div className="rfx-panel">
        <section className="rfx-community">
          {communityError?<div className="rfx-state rfx-error">{communityError}</div>:community?<><div className="rfx-community-heading">
            <div><span className="rfx-kicker">ONE GOAL. EVERY MEMBER.</span><h2>The community challenge</h2></div>
            <span className="rfx-community-icon"><Group width={25} height={25}/></span>
          </div>
          <div className="rfx-shared-goal">
            <div className="rfx-shared-count"><span>SHARED QUALIFIED REFERRALS</span><strong>{number(community.qualified)}<small> / {number(communityTarget)}</small></strong></div>
            <b className="rfx-shared-percent">{communityPercent}%</b>
          </div>
          <div className="rfx-community-track"><i style={{width:communityPercent+"%"}}/></div>
          <div className="rfx-community-remaining">{community.next_target===null?"All current community targets reached":number(Math.max(0,communityTarget-community.qualified))+" more qualified referrals to reach this target"}</div>

          <div className="rfx-contribution-card">
            <div className="rfx-contribution-icon"><UserPlus width={21} height={21}/></div>
            <div className="rfx-contribution-copy"><span>YOUR CONTRIBUTION</span><strong>{number(community.member_qualified)}</strong><small>qualified referrals added by you</small></div>
            <span className={"rfx-contribution-status "+(community.eligibility?"eligible":"waiting")}>{community.eligibility?"CONTRIBUTING":"NOT YET"}</span>
          </div>

          {community.leadership&&<section className="rfx-leadership-card">
            <div className="rfx-leadership-head"><div><span className="rfx-kicker">COMMUNITY LEADERSHIP PROGRAMME</span><h3>BUILD YOUR SQUAD. EARN AS IT PLAYS.</h3></div><span className={"rfx-leadership-status "+community.leadership.status}>{community.leadership.status.replaceAll("_"," ").toUpperCase()}</span></div>
            <p>Grow a genuine, active network. Qualifying leaders can earn recurring commissions when eligible members in their network receive SETHIS rewards.</p>
            <div className="rfx-leadership-rates"><span><b>{community.commission_rates?.direct_percent??10}%</b><small>DIRECT LEADER</small></span><span><b>{community.commission_rates?.upline_percent??2}%</b><small>QUALIFYING UPLINE</small></span><span><b>{community.commission_rates?.maximum_combined_percent??12}%</b><small>COMBINED MAXIMUM</small></span></div>
            <div className="rfx-leadership-stats"><article><small>YOUR DIRECT REFERRALS</small><b>{number(community.leadership.personal_qualified)} / {number(community.leadership.personal_threshold)}</b></article><article><small>YOUR FULL NETWORK</small><b>{number(community.leadership.branch_qualified)} / {number(community.leadership.branch_threshold)}</b></article><article><small>ACTIVE MEMBERS</small><b>{number(community.leadership.active_members)} · {community.leadership.active_ratio}%</b></article><article><small>COMMISSIONS PAID</small><b>{number(community.leadership.commission_paid)} SETHIS</b></article><article><small>PENDING COMMISSIONS</small><b>{number(community.leadership.commission_pending)} SETHIS</b></article></div>
            <div className="rfx-leadership-progress"><span>LEADER QUALIFICATION</span><div><i style={{width:Math.min(100,Math.round(community.leadership.personal_qualified/community.leadership.personal_threshold*100))+"%"}}/></div><small>Original leader: {number(community.leadership.personal_threshold)} personal qualified referrals. Network leader: at least {number(community.leadership.hybrid_personal_threshold)} personal referrals and {number(community.leadership.branch_threshold)} qualified members across your branch.</small></div>
            {community.leadership.active_ratio<(community.activity_rule?.warning_below_percent??20)&&<div className="rfx-leadership-warning">URGENT ACTIVITY WARNING · Only {community.leadership.active_ratio}% of your qualified network is active. Your target is {community.leadership.active_threshold}%.</div>}
            <div className="rfx-leadership-rule"><b>KEEP YOUR NETWORK ACTIVE</b><span>At least {community.leadership.active_threshold}% of your qualified branch must complete a verified game or approved task within a rolling {community.activity_rule?.window_days??30}-day period. Below {community.activity_rule?.warning_below_percent??20}% is an urgent warning. {community.leadership.status==="recovering"?"Your recovery window has "+community.leadership.recovery_days_remaining+" day(s) remaining before commissions are suspended.":community.leadership.status==="suspended"?"Commissions are currently suspended. Restore the active-member ratio to at least 35% to regain eligibility.":community.leadership.status==="active"?"Your leadership commission eligibility is active while you maintain the required activity ratio.":"Meet one of the leadership referral thresholds to unlock commission eligibility."}</span></div>{community.leadership.branch_leaders.length>0&&<div className="rfx-leadership-branches"><b>LEADERS IN YOUR NETWORK</b>{community.leadership.branch_leaders.map(leader=><div key={leader.user_id}><span>{leader.name}</span><small>{leader.status.toUpperCase()} · {number(leader.branch_qualified)} IN BRANCH · {leader.active_ratio}% ACTIVE</small></div>)}</div>}
          </section>}
          <div className="rfx-how-it-works">
            <div className="rfx-how-title"><span className="rfx-kicker">HOW IT WORKS</span><b>Everyone moves the same counter.</b></div>
            <div className="rfx-how-step"><span>01</span><p>Invite friends. When your invite completes onboarding and claims the welcome gift, it adds <b>one</b> to the shared total.</p></div>
            <div className="rfx-how-step"><span>02</span><p>Your contribution is the number of qualified people <b>you</b> have invited.</p></div>
            <div className="rfx-how-step"><span>03</span><p>To count as a contributor, you need at least <b>one genuine qualified referral</b>.</p></div>
          </div>

          <div className="rfx-community-metrics">
            <article><strong>{number(community.contributors)}</strong><span>ACTIVE CONTRIBUTORS</span></article>
            <article><strong>{number(community.invited)}</strong><span>ALL INVITES</span></article>
          </div>

          <div className="rfx-community-reward">
            <span className="rfx-kicker">COMMUNITY REWARD</span>
            <div><b>{community.reward_status==="not_announced"?"REWARD TERMS NOT ANNOUNCED":"COMMUNITY REWARD"}</b><span>{community.reward_status==="not_announced"?"The target tracks shared growth. Reward and eligibility terms will be published before any reward is activated.":community.targets.find(t=>t.threshold===community.next_target)?.reward_description}</span></div>
            <span className="rfx-reward-status">PENDING</span>
          </div>

          <div className="rfx-target-section">
            <div className="rfx-section-head"><div><span className="rfx-kicker">THE BIGGER PICTURE</span><h3>Community targets</h3></div></div>
            <div className="rfx-target-grid">{community.targets.map(target=>{
              const active=!target.achieved&&community.next_target===target.threshold;
              return <article key={target.number} className={target.achieved?"achieved":active?"active":"locked"}>
                <span>{target.achieved?<Check width={16} height={16}/>:active?<Trophy width={16} height={16}/>:<Lock width={14} height={14}/>}</span>
                <b>{number(target.threshold)}</b><small>{target.achieved?"REACHED":active?"CURRENT GOAL":"LOCKED"}</small>
              </article>;
            })}</div>
          </div>

          <div className="rfx-leaderboard">
            <div className="rfx-section-head"><div><span className="rfx-kicker">COMMUNITY MOMENTUM</span><h3>Top contributors</h3></div><span className="rfx-leader-count">{number(community.leaderboard?.length||0)}</span></div>
            {community.leaderboard?.length?community.leaderboard.slice(0,5).map(person=><article key={person.rank} className={person.is_you?"you":""}>
              <span className="rfx-rank">{person.rank===1?<Trophy width={15} height={15}/>:person.rank}</span>
              <b>{person.name}{person.is_you?" · YOU":""}</b><strong>{number(person.qualified)} <small>QUALIFIED</small></strong>
            </article>):<div className="rfx-empty">No qualified contributors yet.</div>}
          </div>
          </>:<div className="rfx-state">Loading shared community progress…</div>}
        </section>
      </div>}

      {view==="activity"&&<div className="rfx-panel">
        <section className="rfx-activity-section">
          <div className="rfx-section-head"><div><span className="rfx-kicker">YOUR INVITE TRACKER</span><h2>Invitations</h2></div><strong className="rfx-count-pill">{number(data.referrals.length)}</strong></div>
          <div className="rfx-activity-summary"><article><b>{number(data.total)}</b><span>INVITED</span></article><article><b>{number(data.qualified)}</b><span>QUALIFIED</span></article><article><b>{number(data.pending??Math.max(0,data.total-data.qualified))}</b><span>PENDING</span></article></div><p className="rfx-qualification-note">A referral qualifies when the person you invited completes onboarding and claims their welcome gift.</p>
          {data.referrals.length===0?<div className="rfx-empty"><UserPlus width={22} height={22}/><b>Your first invite starts here.</b><span>Share your link and your invitations will appear here.</span></div>:<div className="rfx-member-list">{data.referrals.map((person,index)=><article key={person.attributed_at+":"+index}>
            <span className="rfx-avatar">{(person.first_name||person.username||"F").slice(0,1).toUpperCase()}</span>
            <div><b>{person.username?"@"+person.username:person.first_name||"SETHIS member"}</b><small>{date(person.attributed_at)}</small></div>
            <span className={"rfx-member-status "+(person.qualified_at?"qualified":"pending")}>{person.qualified_at?"QUALIFIED":"PENDING"}</span>
          </article>)}</div>}
        </section>
        <section className="rfx-activity-section">
          <div className="rfx-section-head"><div><span className="rfx-kicker">YOUR EARNINGS</span><h2>Reward history</h2></div><strong className="rfx-count-pill">{number(data.rewards.length)}</strong></div>
          {data.rewards.length===0?<div className="rfx-empty"><Trophy width={22} height={22}/><b>No referral rewards yet.</b><span>Rewards appear here when milestones are earned.</span></div>:<div className="rfx-reward-list">{data.rewards.map(reward=><article key={reward.milestone}>
            <span className="rfx-reward-check"><Check width={16} height={16}/></span><div><b>{number(reward.milestone)} qualified referrals</b><small>{date(reward.created_at)}</small></div><strong>+{number(reward.amount)} <small>SETHIS</small></strong>
          </article>)}</div>}
        </section>
      </div>}
    </>}
  </div>;
}
