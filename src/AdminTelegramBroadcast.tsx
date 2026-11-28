import {useEffect,useState} from "react";

type BroadcastStatus={subscribers:number;opted_out:number;started:number;bot_username:string|null;webhook_configured:boolean};
async function request(path:string,init?:RequestInit){
 const response=await fetch(path,{...init,credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json",...(init?.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||"The request could not be completed.");
 return data;
}
export default function AdminTelegramBroadcast(){
 const [status,setStatus]=useState<BroadcastStatus|null>(null);
 const [message,setMessage]=useState("⚽ WELCOME TO SETHIS!\n\nThink you know football? Prove it. Play Mystery Footballer and Football Runner, build your game record and earn eligible SETHIS rewards.\n\n🎯 START WITH MYSTERY FOOTBALLER\nChoose Easy, Medium or Hard and answer five multiple-choice football questions. Get all five right to earn the full difficulty reward.\n\nReady to play? Open the SETHIS Mini App and join the game. 👇\nhttps://sethis.online/");
 const [loading,setLoading]=useState(true);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [progress,setProgress]=useState({sent:0,failed:0,removed:0});
 const refresh=async()=>{
  setLoading(true);setError("");
  try{setStatus(await request("/api/admin/telegram-broadcast"));}
  catch(e){setError(e instanceof Error?e.message:"Telegram broadcast status is unavailable.");}
  finally{setLoading(false);}
 };
 useEffect(()=>{void refresh();},[]);
 const send=async()=>{
  if(!status?.subscribers||message.trim().length<2||sending)return;
  if(!window.confirm("Send this message to all "+status.subscribers.toLocaleString()+" members who have started the SETHIS bot and have not opted out? This cannot be recalled."))return;
  setSending(true);setError("");setNotice("");setProgress({sent:0,failed:0,removed:0});
  let cursor="",done=false,sent=0,failed=0,removed=0;
  try{
   while(!done){
    const result=await request("/api/admin/telegram-broadcast",{method:"POST",body:JSON.stringify({message:message.trim(),after_id:cursor})});
    sent+=Number(result.sent)||0;failed+=Number(result.failed)||0;removed+=Number(result.removed)||0;
    setProgress({sent,failed,removed});
    cursor=typeof result.next_cursor==="string"?result.next_cursor:"";
    done=Boolean(result.done);
    if(!done&&!cursor)throw new Error("Broadcast paused because the next batch cursor was missing. Refresh status before continuing.");
   }
   setNotice("Broadcast completed. "+sent.toLocaleString()+" messages delivered"+(failed?", "+failed.toLocaleString()+" failed":"")+".");
   setMessage("");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"The broadcast stopped before all batches were processed.");}
  finally{setSending(false);}
 };
 return <section className="admin-telegram-broadcast">
  <div className="admin-detail-head"><div><small>MEMBER COMMUNICATIONS · TELEGRAM</small><h2>Telegram broadcast</h2><p>Send updates to members who have started the SETHIS bot and remain opted in. Members can send /stop at any time.</p></div><button className="admin-refresh" onClick={()=>void refresh()} disabled={loading||sending}>↻ REFRESH</button></div>
  <div className="admin-telegram-stats">
   <article><small>OPTED-IN MEMBERS</small><strong>{loading?"—":(status?.subscribers||0).toLocaleString()}</strong></article>
   <article><small>HAVE STARTED THE BOT</small><strong>{loading?"—":(status?.started||0).toLocaleString()}</strong></article>
   <article><small>OPTED OUT</small><strong>{loading?"—":(status?.opted_out||0).toLocaleString()}</strong></article>
  </div>
  <div className="admin-telegram-status"><span className={status?.webhook_configured?"connected":"pending"}>{status?.webhook_configured?"BOT WEBHOOK CONFIGURED":"BOT SETUP PENDING"}</span><span>{status?.bot_username?"@"+status.bot_username:"Bot username will appear after setup"}</span></div>
  <label className="admin-telegram-message">BROADCAST MESSAGE<textarea rows={7} maxLength={3500} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write a SETHIS update for your Telegram members…"/></label>
  <div className="admin-telegram-compose-foot"><span>{message.length.toLocaleString()} / 3,500 characters</span><button className="admin-primary" disabled={sending||loading||!status?.subscribers||message.trim().length<2} onClick={()=>void send()}>{sending?"SENDING BATCHES…":"SEND TO OPTED-IN MEMBERS"}</button></div>
  {sending&&<div className="admin-telegram-progress">Delivered: <b>{progress.sent.toLocaleString()}</b> · Failed: <b>{progress.failed.toLocaleString()}</b> · Opt-outs removed: <b>{progress.removed.toLocaleString()}</b></div>}
  {notice&&<div className="admin-notice">{notice}</div>}
  {error&&<div className="admin-error">{error}</div>}
  <p className="admin-rule">Only people who pressed Start in the SETHIS bot are included. A direct Mini App visit alone does not subscribe someone. The system sends in small batches, excludes members who opted out and removes accounts that Telegram reports as blocked.</p>
 </section>;
}
