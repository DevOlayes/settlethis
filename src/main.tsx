import React,{useEffect,useState} from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPortal from "./Admin";
import {authenticateTelegram,initializeTelegramApp,type TelegramUser} from "./telegram";
import "./index.css";

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
      setAuthStatus("checking");
      setAuthError("");
      authenticateTelegram(webApp.initData).then(user=>{
        if(active){setTelegramUser(user);setAuthStatus("ready");}
      }).catch(error=>{
        if(active){
          setTelegramUser(null);
          setAuthError(error instanceof Error?error.message:"Telegram sign-in could not be completed.");
          setAuthStatus("failed");
        }
      });
    }catch(error){
      if(active){
        setAuthError(error instanceof Error?error.message:"Telegram Mini App could not be initialized.");
        setAuthStatus("failed");
      }
    }
    return()=>{active=false;};
  },[retry,isAdmin]);

  if(isAdmin)return <AdminPortal/>;
  if(authStatus==="checking")return <main style={{minHeight:"100dvh",display:"grid",placeItems:"center",padding:24,background:"#0B1220",color:"#F8FAFC",textAlign:"center"}}><div><div style={{fontSize:12,fontWeight:900,letterSpacing:".16em",color:"#27D7F2"}}>SETTLE THIS!</div><h1 style={{fontSize:22,margin:"12px 0 6px"}}>Opening the football courtroom</h1><p style={{fontSize:13,color:"#c4d0dc"}}>Verifying your Telegram account…</p></div></main>;
  if(authStatus==="failed")return <main style={{minHeight:"100dvh",display:"grid",placeItems:"center",padding:24,background:"#0B1220",color:"#F8FAFC",textAlign:"center"}}><div style={{width:"100%",maxWidth:360}}><div style={{fontSize:12,fontWeight:900,letterSpacing:".16em",color:"#27D7F2"}}>SETTLE THIS!</div><h1 style={{fontSize:23,margin:"12px 0 8px"}}>Telegram sign-in needs attention</h1><p style={{fontSize:13,lineHeight:1.6,color:"#c4d0dc"}}>{authError}</p><button onClick={()=>setRetry(value=>value+1)} style={{width:"100%",padding:13,border:0,borderRadius:8,background:"#27D7F2",color:"#06131B",fontWeight:900}}>TRY AGAIN</button></div></main>;
  return <App telegramUser={authStatus==="ready"?telegramUser:null}/>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);
