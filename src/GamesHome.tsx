import { ArrowRight } from "iconoir-react";
import MysteryAvatar from "./MysteryAvatar";
import "./GamesHome.css";

type GameId="mystery"|"runner";

function PlayMark(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.2 5.3a1 1 0 0 1 0 1.7l-9.2 5.3c-.7.4-1.6-.1-1.6-.9V5.8Z" fill="currentColor"/></svg>}

function MysteryArtwork(){return <div className="gamelib-art gamelib-mystery" role="img" aria-label="Mystery Footballer: identify the hidden football star">
  <div className="gamelib-stadium-glow"/><div className="gamelib-stadium-lights"><i/><i/><i/><i/></div>
  <div className="gamelib-mystery-pitch"><i/><i/><i/></div>
  <div className="gamelib-mystery-copy"><span className="gamelib-art-kicker">FOOTBALL KNOWLEDGE</span><strong>WHO'S<br/>THE PLAYER?</strong><small>3 CLUES. 1 LEGEND.</small><span className="gamelib-clue-row"><i>01</i><i>02</i><i>03</i></span></div>
  <div className="gamelib-mystery-player"><MysteryAvatar avatarKey="runner-green" size="large"/></div>
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
      <path d="M-42 120q-24 9-35 37l-24 42 23 13 39-48 21-31Z" fill="#d99b78"/>
      <path d="M33 117q28 4 41 28l21 43-22 14-34-42-25-24Z" fill="#d99b78"/>
      <path d="M-40 112q40-22 79 0l18 94q-45 23-113 0Z" fill="url(#runnerKit)" stroke="#c2fff4" strokeOpacity=".7" strokeWidth="3"/>
      <path d="M-13 125v75m26-75v75" stroke="#e7fffa" strokeOpacity=".35" strokeWidth="4"/>
      <path d="M-24 203q-7 43-44 79l-42 25 15 22q70-13 109-77l16-43Z" fill="#182331"/>
      <path d="M22 203q21 42 4 81l-2 44-29 4q-15-63-33-98l-2-28Z" fill="#182331"/>
      <path d="M-111 305q-8 9-4 19l34 4 23-15-10-13Z" fill="#f4f6f4"/>
      <path d="M-4 327q-2 12 7 16l36-1 13-13-16-12Z" fill="#f4f6f4"/>
      <path d="M-28 14q9-28 39-24 31 3 34 37l-9 34q-12 19-30 17-25-4-34-28Z" fill="#c98e6e"/>
      <path d="M-30 22q-4-32 31-39 39-7 48 28l-9 9q-17-17-39-14-16 4-31 16Z" fill="#111a23"/>
      <path d="M-13 44h9m17-1h8" stroke="#18212b" strokeWidth="4" strokeLinecap="round"/>
      <path d="M-4 61q12 8 24-1" stroke="#7e4e3c" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M-17 84q16 16 34 0" stroke="#d99b78" strokeWidth="13" strokeLinecap="round"/>
    </g>
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
  {id:"mystery",name:"Mystery Footballer",kind:"FOOTBALL KNOWLEDGE",tag:"GUESS THE PLAYER"},
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
