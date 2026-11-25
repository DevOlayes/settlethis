import { ArrowRight } from "iconoir-react";
import MysteryAvatar from "./MysteryAvatar";
import "./GamesHome.css";

type GameId="mystery"|"runner";

function PlayMark(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.2 5.3a1 1 0 0 1 0 1.7l-9.2 5.3c-.7.4-1.6-.1-1.6-.9V5.8Z" fill="currentColor"/></svg>}

function MysteryArtwork(){return <div className="gamelib-art gamelib-mystery" role="img" aria-label="Mystery Footballer: answer five daily football questions">
  <div className="gamelib-stadium-glow"/><div className="gamelib-stadium-lights"><i/><i/><i/><i/></div>
  <div className="gamelib-mystery-pitch"><i/><i/><i/></div>
  <div className="gamelib-mystery-copy"><span className="gamelib-art-kicker">FOOTBALL KNOWLEDGE</span><strong>WHO'S<br/>THE PLAYER?</strong><small>3 CLUES. 1 LEGEND.</small><span className="gamelib-clue-row"><i>01</i><i>02</i><i>03</i></span></div>
  <div className="gamelib-mystery-player"><svg className="gamelib-footballer-portrait" viewBox="0 0 240 310" aria-hidden="true"><defs>
 <linearGradient id="mysteryJersey" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#55f1ff"/><stop offset=".48" stopColor="#1a9dbb"/><stop offset="1" stopColor="#073d68"/></linearGradient>
 <linearGradient id="mysterySkin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f1c29f"/><stop offset=".55" stopColor="#bd805f"/><stop offset="1" stopColor="#75432f"/></linearGradient>
 <linearGradient id="mysteryHair" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#35404a"/><stop offset=".5" stopColor="#111923"/><stop offset="1" stopColor="#050a12"/></linearGradient>
 <linearGradient id="mysteryLight" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fff" stopOpacity=".55"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
 <filter id="mysteryShadow"><feGaussianBlur stdDeviation="8"/></filter>
 </defs>
 <ellipse cx="121" cy="296" rx="86" ry="13" fill="#020710" opacity=".7" filter="url(#mysteryShadow)"/>
 <path d="M25 310q5-75 37-100 21-17 58-22 38 5 59 22 32 25 36 100Z" fill="url(#mysteryJersey)" stroke="#a8f7ff" strokeWidth="2.5"/>
 <path d="M55 221q28-22 65-23 38 1 65 23l-9 89H64Z" fill="#0b6688" opacity=".35"/>
 <path d="M78 194 120 226l42-32-9-22H87Z" fill="#f7fbff"/>
 <path d="m103 215 17 19 17-19-17-13Z" fill="#0a2940"/>
 <path d="M45 248q34 11 75 9 43 3 76-10" fill="none" stroke="#b9f8ff" strokeOpacity=".4" strokeWidth="3"/>
 <path d="M76 225 61 293m103-68 15 68" stroke="#064866" strokeWidth="7" opacity=".45"/>
 <path d="M87 251h66" stroke="#e5fdff" strokeOpacity=".72" strokeWidth="3"/>
 <path d="M104 263h32" stroke="#e5fdff" strokeOpacity=".55" strokeWidth="2"/>
 <path d="M105 228 120 246l15-18" fill="none" stroke="#d7fbff" strokeWidth="2" opacity=".7"/>
 <path d="M95 117q-8-35 1-61 10-31 44-31 39 0 47 37 6 28-1 70l-9 28q-17 30-46 30-29-2-43-32Z" fill="url(#mysterySkin)"/>
 <path d="M83 105q-14-69 34-88 46-18 72 19 14 20 5 63l-10 22q-8-32-27-43-25 13-51 4-12 5-23 29Z" fill="url(#mysteryHair)"/>
 <path d="M91 61q11-34 41-37m-25 10q28-20 54-4m-43-3q27-11 48 5m-61 12q-7 8-10 19m77-26q14 13 17 31" fill="none" stroke="#65717a" strokeWidth="4" strokeLinecap="round" opacity=".55"/>
 <path d="M95 111q12-9 25-2m20 0q13-7 25 2" fill="none" stroke="#4b2c24" strokeWidth="5" strokeLinecap="round"/>
 <path d="M99 121q9-4 17 1m29-1q9-5 17 0" fill="none" stroke="#171c22" strokeWidth="3" strokeLinecap="round"/>
 <ellipse cx="108" cy="122" rx="3" ry="2.4" fill="#101820"/><ellipse cx="153" cy="122" rx="3" ry="2.4" fill="#101820"/>
 <path d="M131 124q-5 17-2 23l7 2" fill="none" stroke="#8c5a42" strokeWidth="3" strokeLinecap="round"/>
 <path d="M114 160q16 11 32-1" fill="none" stroke="#6b352d" strokeWidth="4" strokeLinecap="round"/>
 <path d="M111 165q18 14 39-1" fill="none" stroke="#f2c4a5" strokeWidth="2" opacity=".6"/>
 <path d="M91 139q5 28 23 37m51-39q-6 27-22 39" fill="none" stroke="#f7d2b5" strokeWidth="3" opacity=".45"/>
 <path d="M78 202q-8 5-17 16m101-16q10 4 18 15" fill="none" stroke="#d9fbff" strokeWidth="3" opacity=".45"/>
 <path d="M42 275q24-10 36-4m84 0q16-6 34 4" fill="none" stroke="#d7fbff" strokeOpacity=".3" strokeWidth="3"/>
 <path d="M120 244v46" stroke="#d7fbff" strokeOpacity=".35" strokeWidth="2"/>
 <path d="M42 310q3-31 8-51" stroke="url(#mysteryLight)" strokeWidth="7" opacity=".35"/>
 <path d="M198 310q-3-31-8-51" stroke="#fff" strokeOpacity=".16" strokeWidth="7"/>
 <path d="M120 252h0" stroke="#fff" strokeWidth="1"/>
 </svg></div>
  <div className="gamelib-question-orb">?</div><div className="gamelib-art-foot">CAN YOU NAME THE LEGEND?</div>
</div>}

function RunnerArtwork(){return <div className="gamelib-art gamelib-runner" role="img" aria-label="Football Runner: a footballer sprinting through a 3D pitch">
  <svg className="gamelib-runner-scene" viewBox="0 0 720 405" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="runnerSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#142c3d"/><stop offset=".58" stopColor="#183e38"/><stop offset="1" stopColor="#10251f"/></linearGradient>
      <linearGradient id="runnerGround" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#267d54"/><stop offset="1" stopColor="#0b382b"/></linearGradient>
      <linearGradient id="runnerKit" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#42d7d0"/><stop offset="1" stopColor="#177d93"/></linearGradient>
      <radialGradient id="runnerFlood"><stop stopColor="#d7fff0" stopOpacity=".8"/><stop offset="1" stopColor="#8ef7d2" stopOpacity="0"/></radialGradient>
      <filter id="runnerShadow"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <rect width="720" height="405" fill="url(#runnerSky)"/>
    <ellipse cx="360" cy="122" rx="330" ry="115" fill="url(#runnerFlood)" opacity=".28"/>
    <g fill="#eafff8" opacity=".8"><circle cx="85" cy="53" r="4"/><circle cx="128" cy="42" r="3"/><circle cx="592" cy="47" r="4"/><circle cx="637" cy="64" r="3"/></g>
    <g stroke="#b5f8df" strokeOpacity=".26" fill="none"><path d="M0 150h720M0 175h720M95 122v52m530-52v52"/></g>
    <path d="M0 195 720 195 720 405 0 405Z" fill="url(#runnerGround)"/>
    <path d="M360 196 720 405H0Z" fill="none" stroke="#d7fff0" strokeOpacity=".2" strokeWidth="2"/>
    <path d="M360 196 360 405M0 302h720M0 365h720" stroke="#d7fff0" strokeOpacity=".14" strokeWidth="2"/>
    <path d="M160 405 322 196M560 405 398 196" stroke="#d7fff0" strokeOpacity=".13" strokeWidth="2"/>
    <ellipse cx="360" cy="348" rx="126" ry="19" fill="#001a14" opacity=".55" filter="url(#runnerShadow)"/>
    <g transform="translate(350 48)">
      <path d="M-42 120q-24 9-35 37l-24 42 23 13 39-48 21-31Z" fill="#d99b78"/><path d="m-91 198 20 12 12-12" fill="none" stroke="#f3c5a2" strokeWidth="4" strokeLinecap="round"/>
      <path d="M33 117q28 4 41 28l21 43-22 14-34-42-25-24Z" fill="#d99b78"/><path d="m82 183 13 6 10-9" fill="none" stroke="#f3c5a2" strokeWidth="4" strokeLinecap="round"/>
      <path d="M-40 112q40-22 79 0l18 94q-45 23-113 0Z" fill="url(#runnerKit)" stroke="#c2fff4" strokeOpacity=".7" strokeWidth="3"/><path d="M-34 128q35 12 68 0M-30 186q29 12 60 0" stroke="#e5fff9" strokeOpacity=".45" strokeWidth="3" fill="none"/><path d="m-13 142 12 5 12-5" stroke="#effffb" strokeOpacity=".7" strokeWidth="3" fill="none"/><path d="M-5 158h13" stroke="#effffb" strokeOpacity=".5" strokeWidth="3"/>
      <path d="M-13 125v75m26-75v75" stroke="#e7fffa" strokeOpacity=".35" strokeWidth="4"/>
      <path d="M-24 203q-7 43-44 79l-42 25 15 22q70-13 109-77l16-43Z" fill="#182331"/>
      <path d="M22 203q21 42 4 81l-2 44-29 4q-15-63-33-98l-2-28Z" fill="#182331"/>
      <path d="M-111 305q-8 9-4 19l34 4 23-15-10-13Z" fill="#f4f6f4"/>
      <path d="M-4 327q-2 12 7 16l36-1 13-13-16-12Z" fill="#f4f6f4"/>
      <path d="M-28 14q9-28 39-24 31 3 34 37l-9 34q-12 19-30 17-25-4-34-28Z" fill="#c98e6e"/>
      <path d="M-30 22q-4-32 31-39 39-7 48 28l-9 9q-17-17-39-14-16 4-31 16Z" fill="#111a23"/><path d="M-25 7q16-25 43-18" stroke="#53616e" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M-12 44h9m17-1h8" stroke="#18212b" strokeWidth="4" strokeLinecap="round"/>
      <path d="M-13 44h9m17-1h8" stroke="#18212b" strokeWidth="4" strokeLinecap="round"/>
      <path d="M-4 61q12 8 24-1" stroke="#7e4e3c" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M-17 84q16 16 34 0" stroke="#d99b78" strokeWidth="13" strokeLinecap="round"/>
    </g>
    <g transform="translate(350 48)" fill="none" strokeLinecap="round" strokeLinejoin="round">
 <path d="M-21 18q7-22 29-25 22 1 30 21" stroke="#53616e" strokeWidth="5" opacity=".75"/>
 <path d="M-19 40q9-6 17-2m18 0q9-5 16 1" stroke="#412d27" strokeWidth="3"/>
 <circle cx="-9" cy="42" r="2.3" fill="#101820" stroke="none"/><circle cx="20" cy="42" r="2.3" fill="#101820" stroke="none"/>
 <path d="M-4 55q11 6 21-1" stroke="#744633" strokeWidth="3"/>
 <path d="M-27 132q26 13 55 0" stroke="#c5fff4" strokeWidth="3" opacity=".7"/>
 <path d="M-25 177q25 10 52 0" stroke="#c5fff4" strokeWidth="2" opacity=".45"/>
 <path d="M-4 143v30" stroke="#eafffa" strokeWidth="2" opacity=".4"/>
 <path d="M-22 150h10l5 8-10 7-8-7Z" fill="#f5fffb" stroke="#d8fff2" strokeWidth="1.5"/>
 <path d="M-12 150h4v10h-4Z" fill="#123d50" stroke="none"/>
 <path d="M-91 203q-14 28-32 50m-8 4 27-13m73-35q18 22 16 49" stroke="#647586" strokeWidth="4" opacity=".5"/>
 <path d="M-109 309q14 7 28 0m78 17q16 7 30 0" stroke="#d7e4e8" strokeWidth="3"/>
 </g>
 <g stroke="#b8f4e2" strokeWidth="3" strokeLinecap="round" opacity=".65"><path d="m211 262 48-8m-35 25 35-6m-312-16 34-8"/></g>
 <g transform="translate(565 291)">
      <circle r="39" fill="#d9fff4" fillOpacity=".13"/><circle r="28" fill="#f5f8f4" stroke="#d4fff2" strokeWidth="3"/>
      <path d="m0-13 12 9-5 14h-14l-5-14zM-25-8l12-4m27 0 12 4M-20 20l8-10m24 0 8 10" fill="#18252a" stroke="#18252a" strokeWidth="5" strokeLinejoin="round"/>
    </g>
    <g transform="translate(120 270)" stroke="#e5b34e" strokeWidth="8" fill="none" strokeLinecap="round"><path d="M0 0v62m66-62v62M-9 0h84"/><path d="M-9 62h84" strokeWidth="5"/></g>
    <g fill="#d9fff4" opacity=".8"><path d="m60 212 64-10m-78 30 46-7m438-65 67-8m-54 27 46-6" stroke="#d9fff4" strokeWidth="3"/></g>
  </svg>
  <div className="gamelib-runner-title"><span className="gamelib-art-kicker">3D ENDLESS RUNNER</span><strong>OWN THE<br/>PITCH.</strong><small>JUMP · SLIDE · COLLECT</small></div>
  <span className="gamelib-runner-chip">ENDLESS MODE</span>
</div>}

function GameArtwork({game}:{game:GameId}){return game==="mystery"?<MysteryArtwork/>:<RunnerArtwork/>}

export default function GamesHome({onSelect}:{onSelect:(game:GameId)=>void}){
 const games:[{id:GameId;name:string;kind:string;tag:string},...{id:GameId;name:string;kind:string;tag:string}[]]=[
  {id:"mystery",name:"Mystery Footballer",kind:"FOOTBALL KNOWLEDGE",tag:"FIVE-QUESTION QUIZ"},
  {id:"runner",name:"Football Runner",kind:"3D ENDLESS RUNNER",tag:"RUN THE PITCH"}
 ];
 return <section className="gamelib">
  <header className="gamelib-header"><div><span className="gamelib-kicker">SETHIS · FOOTBALL GAMES</span><h1>CHOOSE YOUR GAME</h1><p>Pick a challenge and get straight into the action.</p></div><span className="gamelib-count">02 GAMES</span></header>
  <div className="gamelib-grid">{games.map(game=><article className="gamelib-card" key={game.id}>
    <GameArtwork game={game.id}/>
    <div className="gamelib-card-body"><div className="gamelib-card-copy"><span>{game.kind}</span><h2>{game.name}</h2><small>{game.tag}</small></div>
      <button className="gamelib-play" type="button" onClick={()=>onSelect(game.id)}><span className="gamelib-play-mark"><PlayMark/></span><span>PLAY NOW</span><ArrowRight width={18} height={18}/></button>
    </div>
  </article>)}</div>
 </section>;
}
