import { ArrowRight, Gamepad, Running, SoccerBall } from "iconoir-react";
import MysteryAvatar from "./MysteryAvatar";
import "./GamesHome.css";

type GameId="mystery"|"runner";

function GameArtwork({game}:{game:GameId}) {
  if(game==="mystery") return <div className="game-library-art game-artwork game-artwork-mystery" aria-label="Mystery Footballer avatar artwork">
    <div className="game-art-pitch-lines" aria-hidden="true"/>
    <div className="game-mystery-avatar"><MysteryAvatar avatarKey="football-knowledge" size="large"/></div>
    <div className="game-art-mystery-copy"><span>THREE CLUES</span><strong>WHO'S THE PLAYER?</strong><i>?</i></div>
    <span className="game-art-corner-label">IDENTIFY THE LEGEND</span>
  </div>;
  return <div className="game-library-art game-artwork game-artwork-runner" aria-label="Football Runner running player and football artwork">
    <div className="runner-art-pitch" aria-hidden="true"><span/><span/><span/></div>
    <div className="runner-art-speed speed-one"/>
    <div className="runner-art-speed speed-two"/>
    <div className="runner-art-runner"><Running width={116} height={116} strokeWidth={1.45}/></div>
    <div className="runner-art-ball"><SoccerBall width={54} height={54} strokeWidth={1.7}/></div>
    <span className="runner-art-label">RUN · DODGE · COLLECT</span>
    <span className="game-art-corner-label">3D ENDLESS RUN</span>
  </div>;
}

export default function GamesHome({onSelect}:{onSelect:(game:GameId)=>void}){
 const games:[{id:GameId;name:string;kind:string;status:string},...{id:GameId;name:string;kind:string;status:string}[]]=[
  {id:"mystery",name:"Mystery Footballer",kind:"FOOTBALL KNOWLEDGE",status:"PLAY NOW"},
  {id:"runner",name:"Football Runner",kind:"3D ENDLESS RUN",status:"PLAY NOW"}
 ];
 return <section className="games-library">
  <header className="games-library-head"><div><span className="eyebrow">SETHIS · FOOTBALL GAMES</span><h1>CHOOSE YOUR GAME</h1></div><span className="games-library-count">02 GAMES</span></header>
  <div className="games-library-grid">{games.map(game=><article className="game-library-card" key={game.id}>
   <GameArtwork game={game.id}/>
   <div className="game-library-body"><div className="game-library-title"><h2>{game.name}</h2><span>{game.kind}</span></div><button className="game-library-play" type="button" onClick={()=>onSelect(game.id)}><Gamepad/><span>PLAY</span><ArrowRight/></button></div>
  </article>)}</div>
 </section>;
}
