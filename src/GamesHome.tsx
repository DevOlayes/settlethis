import {ArrowRight,Gamepad} from "iconoir-react";
import "./GamesHome.css";

type GameId="mystery"|"runner";
export default function GamesHome({onSelect}:{onSelect:(game:GameId)=>void}){
 const games:[{id:GameId;name:string;kind:string;image:string;status:string},...{id:GameId;name:string;kind:string;image:string;status:string}[]]=[
  {id:"mystery",name:"Mystery Footballer",kind:"FOOTBALL KNOWLEDGE",image:"/mystery-footballer-cover.svg",status:"PLAY NOW"},
  {id:"runner",name:"Football Runner",kind:"3D ENDLESS RUN",image:"/football-runner-cover.svg",status:"PLAY NOW"}
 ];
 return <section className="games-library">
  <header className="games-library-head"><div><span className="eyebrow">SETHIS · FOOTBALL GAMES</span><h1>CHOOSE YOUR GAME</h1></div><span className="games-library-count">02 GAMES</span></header>
  <div className="games-library-grid">{games.map((game,index)=><article className="game-library-card" key={game.id}>
   <div className="game-library-art"><img src={game.image} alt={game.name+" game artwork"} loading={index===0?"eager":"lazy"}/><span className="game-library-status">{game.status}</span></div>
   <div className="game-library-body"><div className="game-library-title"><h2>{game.name}</h2><span>{game.kind}</span></div><button className="game-library-play" type="button" onClick={()=>onSelect(game.id)}><Gamepad/><span>PLAY</span><ArrowRight/></button></div>
  </article>)}</div>
 </section>;
}
