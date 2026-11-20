import React,{useEffect,useState} from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import BrandMark from "./BrandMark";
import AdminPortal from "./Admin";
import {authenticateTelegram,initializeTelegramApp,type TelegramUser} from "./telegram";
import "./index.css";

const BOT_CONFIG_URL="/api/telegram/config";
const APP_ORIGIN="https://settlethis.bk9ice.workers.dev";

function TelegramLanding(){
 const [botUrl,setBotUrl]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let live=true;
  fetch(BOT_CONFIG_URL,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
   if(!live)return;
   if(typeof data?.bot_url==="string")setBotUrl(data.bot_url);
  }).catch(()=>{}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[]);
 return <main className="telegram-landing">
  <div className="telegram-landing-glow" aria-hidden="true"/>
  <section className="telegram-landing-content">
   <div className="telegram-landing-brand"><BrandMark className="telegram-landing-logo"/><span className="telegram-landing-wordmark"><b>SETTLE</b><i>THIS!</i><small>SETHIS FOOTBALL GAMES</small></span></div>
   <div className="telegram-landing-kicker">THE FOOTBALL REWARD ARENA</div>
   <h1>Think you know football? <em>Prove it.</em></h1>
   <p className="telegram-landing-intro">Take on football challenges, complete eligible tasks and invite your crew. Build your record and earn SETHIS rewards along the way.</p>
   <div className="telegram-landing-rule"><span>MORE THAN JUST A GAME</span><i/></div>
   <div className="telegram-earning-points"><div><b>01</b><span><strong>PLAY THE CHALLENGES</strong><small>Take on Guess Who? and earn game points for your football knowledge.</small></span></div><div><b>02</b><span><strong>EARN SETHIS REWARDS</strong><small>Complete eligible community tasks and referral milestones to earn SETHIS.</small></span></div><div><b>03</b><span><strong>GET CT. GET IN THE GAME.</strong><small>Earn CT through available rewarded ads and use it to enter eligible games.</small></span></div></div>
   <p className="telegram-landing-disclaimer">SETHIS rewards are subject to each published task or referral rule. CT is the separate in-app participation currency — it is not SETHIS.</p>
   {botUrl?<a className="telegram-landing-button" href={botUrl}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 3.5 18.3 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.7 13.6.8 12c-1.1-.3-1.1-1.1.2-1.6L20 3c.9-.3 1.7.2 1.5.5Z"/></svg><span>OPEN TELEGRAM & START EARNING</span><b>↗</b></a>:<button className="telegram-landing-button" disabled><span>{loading?"CONNECTING TO TELEGRAM…":"TELEGRAM LINK UNAVAILABLE"}</span></button>}
   <p className="telegram-landing-foot">Register in Telegram to unlock games, tasks, rewards and your SETHIS wallet.</p>
  </section>
 </main>;
}

function Root(){
 const [telegramUser,setTelegramUser]=useState<TelegramUser|null>(null);
 const [authStatus,setAuthStatus]=useState<"checking"|"ready"|"outside"|"failed">("checking");
 const [authError,setAuthError]=useState("");
 const [retry,setRetry]=useState(0);
 const isSupportDesk=window.location.pathname==="/support-desk";
 const isAdmin=window.location.pathname==="/admin"||window.location.pathname.startsWith("/admin/")||isSupportDesk;
 useEffect(()=>{if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{});}},[]);
 useEffect(()=>{
  if(isAdmin)return;
  let active=true;
  try{
   const webApp=initializeTelegramApp();
   if(!webApp?.initData){setTelegramUser(null);setAuthStatus("outside");return;}
   setAuthStatus("checking");setAuthError("");
   authenticateTelegram(webApp.initData).then(user=>{if(active){setTelegramUser(user);setAuthStatus("ready");}}).catch(error=>{
    if(active){setTelegramUser(null);setAuthError(error instanceof Error?error.message:"Telegram sign-in could not be completed.");setAuthStatus("failed");}
   });
  }catch(error){
   if(active){setAuthError(error instanceof Error?error.message:"Telegram Mini App could not be initialized.");setAuthStatus("failed");}
  }
  return()=>{active=false;};
 },[retry,isAdmin]);
 if(isAdmin)return <AdminPortal/>;
 if(authStatus==="outside")return <TelegramLanding/>;
 if(authStatus==="checking")return <main className="telegram-app-loading"><div><div className="telegram-app-mark">SETHIS</div><h1>Getting your game ready</h1><p>Verifying your Telegram account…</p></div></main>;
 if(authStatus==="failed")return <main className="telegram-app-loading"><div className="telegram-app-error"><div className="telegram-app-mark">SETHIS</div><h1>Telegram sign-in needs attention</h1><p>{authError}</p><button onClick={()=>setRetry(value=>value+1)}>TRY AGAIN</button><a href={APP_ORIGIN+"/"}>Return to the SETHIS introduction</a></div></main>;
 return <App telegramUser={authStatus==="ready"?telegramUser:null}/>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);
