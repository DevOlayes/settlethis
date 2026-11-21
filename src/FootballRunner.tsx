import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./FootballRunner.css";

type RunSummary={distance:number;points:number;balls:number;sethis:number};
type Props={onBack:()=>void};
const CORAL=0xe98272;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export default function FootballRunner({onBack}:Props){
 const mountRef=useRef<HTMLDivElement>(null);
 const [phase,setPhase]=useState<"ready"|"running"|"paused"|"over">("ready");
 const [summary,setSummary]=useState<RunSummary|null>(null);
 const [hud,setHud]=useState({distance:0,points:0,balls:0,speed:1});
 const gameRef=useRef<{start:()=>void;pause:()=>void;resume:()=>void;restart:()=>void}|null>(null);
 useEffect(()=>{
  const host=mountRef.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x171522);scene.fog=new THREE.Fog(0x171522,34,115);
  const camera=new THREE.PerspectiveCamera(58,host.clientWidth/Math.max(1,host.clientHeight),.1,180);camera.position.set(0,5.1,10.5);camera.lookAt(0,1,-7);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xcfc8e8,0x302438,2.0));
  const key=new THREE.DirectionalLight(0xffdfd1,2.3);key.position.set(-5,10,7);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(CORAL,1.4,24);fill.position.set(0,3,-10);scene.add(fill);
  const world=new THREE.Group();scene.add(world);
  const floorMat=new THREE.MeshStandardMaterial({color:0x263a32,roughness:.95});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(24,180),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.12,-48);floor.receiveShadow=true;world.add(floor);
  const laneMat=new THREE.MeshBasicMaterial({color:0xe9e2d7,transparent:true,opacity:.26});
  for(const x of [-1.45,1.45]){const line=new THREE.Mesh(new THREE.PlaneGeometry(.035,180),laneMat);line.rotation.x=-Math.PI/2;line.position.set(x,-.1,-48);world.add(line);}
  const sideMat=new THREE.MeshStandardMaterial({color:0x3b2948,roughness:.9});
  for(const side of [-1,1]){const stand=new THREE.Mesh(new THREE.BoxGeometry(7,5,180),sideMat);stand.position.set(side*13,2.2,-48);world.add(stand);
   for(let i=0;i<12;i++){const row=new THREE.Mesh(new THREE.BoxGeometry(6.8,.12,180),new THREE.MeshStandardMaterial({color:i%2?0x46304e:0x34243e}));row.position.set(side*13, .3+i*.36,-48);world.add(row);}
  }
  // Stadium floodlight towers and a distant goal give the route a recognisable football setting.
  for(const x of [-8.5,8.5]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,10,8),new THREE.MeshStandardMaterial({color:0x8d8795,metalness:.55,roughness:.45}));pole.position.set(x,5,-34);world.add(pole);const lamp=new THREE.Mesh(new THREE.BoxGeometry(2.2,.3,.45),new THREE.MeshStandardMaterial({color:0xf7e5bd,emissive:0x9b7746,emissiveIntensity:1.1}));lamp.position.set(x,10,-34);world.add(lamp);}
  const goal=new THREE.Group();const postMat=new THREE.MeshStandardMaterial({color:0xf4f0e9,metalness:.35,roughness:.4});
  for(const [x,y,z,w,h,d] of [[-2.1,1.1,-67,.12,2.2,.12],[2.1,1.1,-67,.12,2.2,.12],[0,2.2,-67,4.3,.12,.12]] as number[][]){const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),postMat);p.position.set(x,y,z);goal.add(p);}
  scene.add(goal);
  // A clean, stylised footballer assembled from simple low-poly forms; no placeholder emoji or copied character art.
  const player=new THREE.Group();scene.add(player);player.position.set(0,0,2.3);
  const skin=new THREE.MeshStandardMaterial({color:0x9c6549,roughness:.85}),shirt=new THREE.MeshStandardMaterial({color:0xe98272,roughness:.72}),shorts=new THREE.MeshStandardMaterial({color:0x242337,roughness:.8}),socks=new THREE.MeshStandardMaterial({color:0xf4f1ec}),boots=new THREE.MeshStandardMaterial({color:0x18151f,roughness:.55});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,4,8),shirt);torso.position.y=1.35;torso.castShadow=true;player.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),skin);head.position.y=2.12;head.castShadow=true;player.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.245,12,8,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x211b20}));hair.position.y=2.2;player.add(hair);
  const legs:THREE.Group[]=[];
  for(const x of [-.16,.16]){const leg=new THREE.Group();leg.position.set(x,.82,0);const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.48,3,7),shorts);thigh.position.y=-.1;leg.add(thigh);const shin=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.47,3,7),socks);shin.position.y=-.53;leg.add(shin);const boot=new THREE.Mesh(new THREE.BoxGeometry(.17,.11,.34),boots);boot.position.set(0,-.81,-.08);leg.add(boot);player.add(leg);legs.push(leg);}
  for(const x of [-.42,.42]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.48,3,7),shirt);arm.position.set(x,1.42,0);arm.rotation.z=x>0?-.22:.22;player.add(arm);}
  const ballGeo=new THREE.SphereGeometry(.24,16,12);const ballMat=new THREE.MeshStandardMaterial({color:0xf6eee6,roughness:.58});
  const blackPatch=new THREE.MeshStandardMaterial({color:0x282332,roughness:.7});
  const makeBall=(x:number,z:number)=>{const g=new THREE.Group();const core=new THREE.Mesh(ballGeo,ballMat);g.add(core);for(let i=0;i<5;i++){const patch=new THREE.Mesh(new THREE.CircleGeometry(.07,5),blackPatch);patch.position.set(Math.cos(i*1.256)*.17,Math.sin(i*1.256)*.17,.19);g.add(patch);}const glow=new THREE.PointLight(CORAL,1.5,3.2);glow.position.set(0,.25,0);g.add(glow);g.position.set(x,.48,z);g.userData.kind="ball";return g;};
  const coneMat=new THREE.MeshStandardMaterial({color:0xe98272,roughness:.8}),barMat=new THREE.MeshStandardMaterial({color:0xd7d1db,roughness:.8});
  const makeObstacle=(lane:number,z:number,index:number)=>{const g=new THREE.Group();if(index%3===0){const cone=new THREE.Mesh(new THREE.ConeGeometry(.38,.8,8),coneMat);cone.position.y=.4;g.add(cone);const base=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.1,8),shorts);base.position.y=.05;g.add(base);}else if(index%3===1){const a=new THREE.Mesh(new THREE.BoxGeometry(1.15,.12,.16),barMat);a.position.y=.65;g.add(a);for(const x of [-.48,.48]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.65,.14),coneMat);leg.position.set(x,.32,0);g.add(leg);}}else{const body=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.9,3,7),new THREE.MeshStandardMaterial({color:0x81778c}));body.position.y=1.05;g.add(body);const head2=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),new THREE.MeshStandardMaterial({color:0x9a91a1}));head2.position.y=1.68;g.add(head2);}g.position.set(lane*2.9,0,z);g.userData.kind="obstacle";return g;};
  const objects:THREE.Group[]=[];let lane=0,targetLane=0,jump=0,slide=0,elapsed=0,distance=0,points=0,balls=0,lastSpawn=0,over=false,paused=true,runTime=0,uiTime=0;let last=performance.now();let obstacleIndex=0;
  const addObject=(obj:THREE.Group)=>{objects.push(obj);scene.add(obj);};
  const reset=()=>{objects.forEach(o=>scene.remove(o));objects.length=0;lane=0;targetLane=0;jump=0;slide=0;elapsed=0;distance=0;points=0;balls=0;lastSpawn=0;over=false;paused=false;runTime=0;uiTime=0;player.position.x=0;player.position.y=0;legs.forEach((l,i)=>l.rotation.x=i?0:0);for(let i=0;i<8;i++){const z=-13-i*13;addObject(i%2===0?makeBall((i%3-1)*2.9,z):makeObstacle((i%3)-1,z,obstacleIndex++));}setHud({distance:0,points:0,balls:0,speed:1});setSummary(null);setPhase("running");};
  const finish=()=>{if(over)return;over=true;paused=true;const sethis=Math.min(1500,Math.round(balls*5+Math.max(0,Math.floor(distance/500))*4+ (points>=10000?8:points>=5000?4:0)));setSummary({distance:Math.floor(distance),points,balls,sethis});setPhase("over");};
  const move=(dir:number)=>{if(paused||over)return;targetLane=clamp(targetLane+dir,-1,1);};
  const jumpUp=()=>{if(!paused&&!over&&jump<=0)jump=1.02;};
  const slideDown=()=>{if(!paused&&!over)slide=.65;};
  const keydown=(e:KeyboardEvent)=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","a","d","w","s"].includes(e.key))e.preventDefault();if(e.key==="ArrowLeft"||e.key==="a")move(-1);if(e.key==="ArrowRight"||e.key==="d")move(1);if(e.key==="ArrowUp"||e.key==="w"||e.key===" ")jumpUp();if(e.key==="ArrowDown"||e.key==="s")slideDown();};
  let touchX=0,touchY=0;const touchStart=(e:TouchEvent)=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;};const touchEnd=(e:TouchEvent)=>{const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1);else if(dy<0)jumpUp();else slideDown();};
  window.addEventListener("keydown",keydown);renderer.domElement.addEventListener("touchstart",touchStart,{passive:true});renderer.domElement.addEventListener("touchend",touchEnd,{passive:true});
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h);};const observer=new ResizeObserver(resize);observer.observe(host);
  gameRef.current={start:reset,pause:()=>{paused=true;setPhase("paused");},resume:()=>{if(!over){paused=false;setPhase("running");}},restart:reset};
  const animate=(now:number)=>{const dt=Math.min(.04,(now-last)/1000);last=now;if(!paused&&!over){elapsed+=dt;const speed=9+Math.min(11,elapsed*.085);distance+=speed*dt;points+=Math.floor(speed*dt*12);runTime+=dt;lastSpawn+=dt;world.position.z=(world.position.z+speed*dt)%15;const desiredX=targetLane*2.9;player.position.x+=(desiredX-player.position.x)*Math.min(1,dt*13);lane=targetLane;
    if(jump>0){jump=Math.max(0,jump-dt*1.65);player.position.y=Math.sin((1.02-jump)*Math.PI/1.02)*1.5;}else player.position.y=0;if(slide>0)slide=Math.max(0,slide-dt);legs[0].rotation.x=Math.sin(elapsed*speed*.65)*.7;legs[1].rotation.x=-legs[0].rotation.x;player.rotation.z+=(targetLane-lane)*dt*2;
    if(lastSpawn>Math.max(.72,1.45-elapsed*.006)){lastSpawn=0;const l=Math.floor(Math.random()*3)-1;const z=-105;addObject(Math.random()<.62?makeBall(l*2.9,z):makeObstacle(l,z,obstacleIndex++));}
    for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.position.z+=speed*dt;if(o.userData.kind==="ball")o.rotation.y+=dt*2.4;if(o.position.z>3.2){scene.remove(o);objects.splice(i,1);continue;}const dz=Math.abs(o.position.z-player.position.z);const dx=Math.abs(o.position.x-player.position.x);if(dz<.85&&dx<1.05){if(o.userData.kind==="ball"){balls++;points+=100;o.position.y=1.4;o.scale.setScalar(.01);scene.remove(o);objects.splice(i,1);}else if(!(jump>.25&&o.children.length<2)&&slide<=0){finish();break;}}}
    if(runTime-uiTime>.18){uiTime=runTime;setHud({distance:Math.floor(distance),points,balls,speed:Math.round(speed/9*10)/10});}
   }
   if(!paused&&!over){camera.position.x+=(player.position.x*.28-camera.position.x)*dt*2;camera.lookAt(player.position.x*.12,1.15,-8);}
   renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  };
  let frame=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("keydown",keydown);renderer.domElement.removeEventListener("touchstart",touchStart);renderer.domElement.removeEventListener("touchend",touchEnd);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});renderer.dispose();host.removeChild(renderer.domElement);gameRef.current=null;};
 },[]);
 const start=()=>gameRef.current?.start();
 const pause=()=>gameRef.current?.pause();
 const resume=()=>gameRef.current?.resume();
 return <main className="football-runner-page">
  <header className="runner-topbar"><button onClick={onBack} aria-label="Back to SETHIS introduction">←</button><div><b>SETHIS</b><span>FOOTBALL RUNNER</span></div><span className="runner-prototype-tag">WEB PROTOTYPE</span></header>
  <section className="runner-stage-wrap">
   <div className="runner-hud"><div><small>DISTANCE</small><b>{hud.distance.toLocaleString()} m</b></div><div><small>POINTS</small><b>{hud.points.toLocaleString()}</b></div><div><small>FOOTBALLS</small><b>{hud.balls}</b></div><div><small>SPEED</small><b>{hud.speed.toFixed(1)}×</b></div></div>
   <div className="runner-stage" ref={mountRef}>
    {phase!=="running"&&<div className="runner-overlay">
     {phase==="ready"&&<><span className="runner-overline">THREE LANES. ONE ENDLESS RUN.</span><h1>Own the pitch.</h1><p>Dodge the training obstacles, kick glowing footballs and see how far you can go.</p><button onClick={start}>START RUN <span>→</span></button><small>SWIPE TO MOVE · UP TO JUMP · DOWN TO SLIDE</small></>}
     {phase==="paused"&&<><span className="runner-overline">TAKE A BREATHER</span><h1>Run paused</h1><p>Your distance and collected footballs are safe.</p><button onClick={resume}>RESUME RUN <span>→</span></button><button className="runner-secondary" onClick={start}>RESTART RUN</button></>}
     {phase==="over"&&summary&&<><span className="runner-overline">FULL TIME</span><h1>Run complete.</h1><div className="runner-result-grid"><div><small>DISTANCE</small><b>{summary.distance.toLocaleString()} m</b></div><div><small>POINTS</small><b>{summary.points.toLocaleString()}</b></div><div><small>FOOTBALLS</small><b>{summary.balls}</b></div><div><small>SIMULATED SETHIS</small><b>{summary.sethis.toLocaleString()}</b></div></div><p>Prototype rewards only. No real CT is charged and no SETHIS is credited.</p><button onClick={start}>RUN AGAIN <span>→</span></button><button className="runner-secondary" onClick={onBack}>BACK TO SETHIS</button></>}
    </div>}
   </div>
   {phase==="running"&&<button className="runner-pause" onClick={pause}>Ⅱ PAUSE</button>}
  </section>
  <footer className="runner-controls"><span>← → MOVE</span><span>↑ JUMP</span><span>↓ SLIDE</span><span>COLLECT BY KICKING</span></footer>
 </main>;
}
