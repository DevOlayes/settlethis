import {useEffect,useState} from "react";
import {Coins,Play,ArrowRight,ShieldCheck,LightBulb,Search,Book,SoccerBall} from "iconoir-react";
import MysteryAvatar from "./MysteryAvatar";
import type {TelegramUser} from "./telegram";
import "./MysteryGame.css";

type Round={id:string;difficulty:"easy"|"medium"|"hard";clue_index:number;guess_count:number;expires_at:string;avatar_key:string;clue:string;status?:string};
type GameState={entry_ct:number;online_count:number;wallet:{ct_balance:number;sethis_balance:number};active_round:Round|null;total_players:number};
function GameIcon({name}:{name:string}) {
 const p={width:20,height:20,strokeWidth:1.8,"aria-hidden":true as const};
 if(name==="coins")return <Coins {...p}/>;
 if(name==="play")return <Play {...p}/>;
 if(name==="arrow")return <ArrowRight {...p}/>;
 if(name==="shield")return <ShieldCheck {...p}/>;
 if(name==="bulb")return <LightBulb {...p}/>;
 if(name==="target")return <Search {...p}/>;
 if(name==="book")return <Book {...p}/>;
 return <SoccerBall {...p}/>;
}
function GameEmblem({small=false}:{small?:boolean}){return <span className={"game-emblem"+(small?" game-emblem-small":"")} aria-hidden="true"><SoccerBall width={small?34:48} height={small?34:48} strokeWidth={1.55}/><b>?</b></span>}
export default function MysteryGame({telegramUser,onWalletChange,showNotice,onBack}:{telegramUser:TelegramUser|null;onWalletChange:(wallet:{ct:number;sethis:number})=>void;showNotice:(message:string)=>void;onBack:()=>void}) {
 const [state,setState]=useState<GameState|null>(null),[loading,setLoading]=useState(true),[difficulty,setDifficulty]=useState<"easy"|"medium"|"hard">("easy"),[guess,setGuess]=useState(""),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(""),[revealedAnswer,setRevealedAnswer]=useState<string|null>(null),[revealedAvatarKey,setRevealedAvatarKey]=useState("kit-01");
 const initData=window.Telegram?.WebApp?.initData||"";
 useEffect(()=>{if(!telegramUser||!initData){setState(null);return;}let live=true;fetch("/api/mystery-game",{headers:{"x-telegram-init-data":initData},cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"The game could not be loaded.");if(!live)return;setState(d);if(d.wallet)onWalletChange({ct:Number(d.wallet.ct_balance)||0,sethis:Number(d.wallet.sethis_balance)||0});}).catch(e=>{if(live)showNotice(e instanceof Error?e.message:"The game could not be loaded.");}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[telegramUser,initData]);
 useEffect(()=>{if(!telegramUser||!initData)return;const ping=()=>fetch("/api/mystery-game/presence",{method:"POST",headers:{"x-telegram-init-data":initData}}).then(r=>r.ok?r.json():null).then(d=>{if(d)setState(v=>v?{...v,online_count:Number(d.online_count)||0,total_players:Number(d.total_players)||v.total_players}:v);}).catch(()=>{});void ping();const timer=window.setInterval(ping,45000);return()=>window.clearInterval(timer);},[telegramUser,initData]);
 const start=async()=>{if(!telegramUser||!initData)return;setBusy(true);setFeedback("");setRevealedAnswer(null);setRevealedAvatarKey("kit-01");try{const r=await fetch("/api/mystery-game/start",{method:"POST",headers:{"content-type":"application/json","x-telegram-init-data":initData},body:JSON.stringify({difficulty})});const d=await r.json();if(!r.ok)throw new Error(d.error||"A new game could not be started.");setState(v=>v?{...v,active_round:d.round,wallet:d.wallet}:v);onWalletChange({ct:Number(d.wallet?.ct_balance)||0,sethis:Number(d.wallet?.sethis_balance)||0});setGuess("");showNotice("Your mystery player is ready. You have three clues.");}catch(e){showNotice(e instanceof Error?e.message:"A new game could not be started.");}finally{setBusy(false);}};
 const nextClue=async()=>{const round=state?.active_round;if(!round||busy)return;setBusy(true);try{const r=await fetch("/api/mystery-game/"+encodeURIComponent(round.id)+"/clue",{method:"POST",headers:{"x-telegram-init-data":initData}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Another clue is not available.");setState(v=>v?{...v,active_round:d.round}:v);setFeedback("Clue "+d.round.clue_index+" unlocked. Take another look.");}catch(e){showNotice(e instanceof Error?e.message:"Another clue is not available.");}finally{setBusy(false);}};
 const submitGuess=async()=>{const round=state?.active_round;if(!round||busy||!guess.trim())return;setBusy(true);try{const r=await fetch("/api/mystery-game/"+encodeURIComponent(round.id)+"/guess",{method:"POST",headers:{"content-type":"application/json","x-telegram-init-data":initData},body:JSON.stringify({guess:guess.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Your guess could not be checked.");setGuess("");setFeedback(d.correct?"Brilliant! You identified the player and earned "+d.points+" points.":d.status==="missed"?"That is all three guesses. The answer is revealed.":"Not quite. You have "+d.guesses_remaining+" guess(es) left.");if(d.status!=="active"){setRevealedAnswer(d.answer||null);setRevealedAvatarKey(d.avatar_key||"kit-01");setState(v=>v?{...v,active_round:null,online_count:v.online_count,wallet:d.wallet||v.wallet}:v);if(d.wallet)onWalletChange({ct:Number(d.wallet.ct_balance)||0,sethis:Number(d.wallet.sethis_balance)||0});}else setState(v=>v?{...v,active_round:d.round||v.active_round}:v);}catch(e){showNotice(e instanceof Error?e.message:"Your guess could not be checked.");}finally{setBusy(false);}};

 const round=state?.active_round;
 if(!telegramUser||!initData)return <section className="game-member-gate"><div className="game-gate-brand"><GameEmblem/><span className="eyebrow">WELCOME TO SETHIS</span></div><h1>Think you know football?<br/><em>Prove it.</em></h1><p>Open SETHIS in Telegram to play.</p></section>;
 return <section className="game-home mystery-play-screen">
  <button type="button" className="game-back-link" onClick={onBack}>← ALL GAMES</button>
  {loading&&<div className="game-loading">Loading game…</div>}
  <article className="mystery-game-card">
   <div className="mystery-game-top"><span>MYSTERY FOOTBALLER</span><span className="mystery-difficulty">{round?round.difficulty.toUpperCase():difficulty.toUpperCase()}</span></div>
   <div className="mystery-game-hero"><div className="mystery-game-copy"><span className="game-kicker"><GameEmblem small/><span className="eyebrow">WHO'S THAT?</span></span><h2>WHO'S THAT<br/><em>BALLER?</em></h2><p>Three clues. Three guesses.</p></div><div className="mystery-avatar-wrap"><MysteryAvatar avatarKey={round?.avatar_key||"kit-01"}/><span className="mystery-avatar-tag">IDENTITY LOCKED</span></div></div>
   {round?<div className="mystery-round-panel"><div className="mystery-round-meta"><span><GameIcon name="bulb"/> CLUE {round.clue_index} <i>/ 3</i></span><span><GameIcon name="target"/> {3-round.guess_count} LEFT</span></div><div className="mystery-clue"><span><GameIcon name="book"/> CLUE</span><p>{round.clue}</p></div><div className="mystery-guess-box"><label htmlFor="mystery-guess">YOUR GUESS</label><input id="mystery-guess" value={guess} maxLength={80} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void submitGuess();}} placeholder="Footballer's name…"/><button onClick={()=>void submitGuess()} disabled={busy||!guess.trim()}>{busy?"CHECKING…":"SUBMIT GUESS ↗"}</button></div><div className="mystery-round-actions"><button onClick={()=>void nextClue()} disabled={busy||round.clue_index>=3}>NEXT CLUE</button></div></div>:<div className="mystery-start-panel"><div className="mystery-start-copy"><b>CHOOSE YOUR LEVEL</b><p>Each round costs {Number(state?.entry_ct||100).toLocaleString()} CT.</p></div><div className="mystery-difficulty-picker">{(["easy","medium","hard"] as const).map(level=><button key={level} className={difficulty===level?"active":""} onClick={()=>setDifficulty(level)}><b>{level.toUpperCase()}</b><small>{level==="easy"?"Global icons":level==="medium"?"Career clues":"Deep knowledge"}</small></button>)}</div><button className="game-primary" onClick={()=>void start()} disabled={busy}>{busy?"PREPARING…":"START GAME · "+Number(state?.entry_ct||100).toLocaleString()+" CT"}</button></div>}
   {feedback&&<p className="mystery-feedback">{feedback}</p>}
   {revealedAnswer&&<div className="mystery-answer-reveal"><MysteryAvatar avatarKey={revealedAvatarKey} revealed size="small"/><div><span>{round?.status==="won"?"CORRECT ANSWER":"THE PLAYER WAS"}</span><b>{revealedAnswer}</b></div></div>}
  </article>
 </section>;
}
