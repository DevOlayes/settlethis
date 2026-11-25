import { ArrowRight } from "iconoir-react";
import MysteryAvatar from "./MysteryAvatar";
import "./GamesHome.css";

type GameId="mystery"|"runner";

function PlayMark(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.2 5.3a1 1 0 0 1 0 1.7l-9.2 5.3c-.7.4-1.6-.1-1.6-.9V5.8Z" fill="currentColor"/></svg>}

function MysteryArtwork(){return <div className="gamelib-art gamelib-photo-art gamelib-mystery-photo">
  <img src="/images/mystery-footballer.webp" alt="Mystery Footballer game artwork" loading="lazy" decoding="async"/>
  <div className="gamelib-photo-copy gamelib-mystery-overlay">
    <span className="gamelib-photo-kicker">FOOTBALL KNOWLEDGE</span>
    <strong>MYSTERY<br/>FOOTBALLER</strong>
    <span className="gamelib-photo-subtitle">FIVE-QUESTION QUIZ</span>
    <span className="gamelib-photo-clues"><i>01</i><i>02</i><i>03</i></span>
    <span className="gamelib-photo-foot">WHO’S THE PLAYER? · 3 CLUES. 1 LEGEND.</span>
  </div>
</div>}

function RunnerArtwork(){return <div className="gamelib-art gamelib-photo-art gamelib-runner-photo">
  <img src="/images/football-runner.webp" alt="Football Runner game artwork" loading="lazy" decoding="async"/>
  <div className="gamelib-photo-copy gamelib-runner-overlay">
    <span className="gamelib-photo-kicker">3D ENDLESS RUNNER</span>
    <strong>FOOTBALL<br/>RUNNER</strong>
    <span className="gamelib-photo-subtitle">RUN THE PITCH</span>
    <span className="gamelib-photo-foot">OWN THE PITCH · JUMP · SLIDE · COLLECT</span>
  </div>
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
