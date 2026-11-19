import type { CSSProperties } from "react";

const palettes:Record<string,[string,string,string]> = {
  messi:["#55b8ff","#173e73","#d7e8ff"], ronaldo:["#e85a58","#7b202c","#f6d4b6"],
  neymar:["#f4c542","#277d53","#f2d5bf"], salah:["#e34f4f","#7c2028","#e8b88e"],
  mbappe:["#4d8df2","#172f70","#d8b18e"], haaland:["#9bceff","#254a75","#e8c5a4"],
  debruyne:["#e46c5c","#6e2630","#e7c5a8"], modric:["#f1f1f1","#4b4b4b","#e5c3a4"],
  drogba:["#e7d4b0","#8b6a3d","#8e5b3e"], henry:["#d9574c","#7d1e28","#98664c"],
  ronaldinho:["#3b9a63","#154d39","#8e624a"], zidane:["#ffffff","#5a5a5a","#d8b99d"],
  rooney:["#e0d2ba","#6d4d35","#d4ad8f"], ramos:["#f0f0f0","#4a5360","#e4c5ad"],
  iniesta:["#e6e6e6","#6d6d6d","#e4c3a4"], mane:["#e8c64e","#23613b","#8c5b42"],
  pirlo:["#e9ecef","#2e4b70","#dfbda0"], eto:["#e9d8ba","#d94a3d","#81543c"],
  kaka:["#d9e8f8","#a72c37","#d4b292"], vanpersie:["#f28a37","#7d2b22","#e1b99a"], weah:["#f1f1f1","#1d5a37","#81543c"], okocha:["#f1f1f1","#277c42","#81543c"], yayatoure:["#f1d04e","#1c5b39","#81543c"], mahrez:["#3e8d55","#16452c","#8c6047"], kane:["#ffffff","#1b3d75","#d9b99d"], son:["#e6e6e6","#244f8e","#d6aa8c"], suarez:["#f1f1f1","#285b3e","#d5b08f"], benzema:["#f4f4f4","#263b67","#c79c7d"], totti:["#f4e6c8","#8d6b3e","#d7b294"], kompany:["#5ba2df","#1c3e68","#6e4c39"]
};
export default function MysteryAvatar({avatarKey="messi",revealed=false,size="large"}:{avatarKey?:string;revealed?:boolean;size?:"large"|"small"}) {
 const [shirt,trim,skin]=palettes[avatarKey]||["#27D7F2","#16445b","#bd8d6b"];
 const style={"--avatar-shirt":shirt,"--avatar-trim":trim,"--avatar-skin":skin} as CSSProperties;
 return <div className={"mystery-avatar "+(revealed?"is-revealed ":"")+(size==="small"?"avatar-small":"")} style={style} aria-label={revealed?"Mystery footballer revealed":"Hidden mystery footballer"}>
  <div className="avatar-stadium-glow"/><div className="avatar-frame-lines"/>
  <svg viewBox="0 0 240 260" role="img" aria-hidden="true">
   <defs><linearGradient id="avatarShirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--avatar-shirt)"/><stop offset="1" stopColor="var(--avatar-trim)"/></linearGradient><linearGradient id="avatarFace" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--avatar-skin)"/><stop offset="1" stopColor="#4b3028"/></linearGradient></defs>
   <path d="M76 82 42 106 14 183l36 14 24-42 3 91h86l3-91 24 42 36-14-28-77-34-24-24-8h-36z" fill="url(#avatarShirt)" stroke="#ffffff55" strokeWidth="3"/>
   <path d="M93 81q27 20 54 0l10 22-37 32-37-32z" fill="var(--avatar-trim)" opacity=".9"/>
   <path d="M88 43q2-34 33-35 36 0 37 39l-5 48q-14 24-31 24-20 0-32-26z" fill="url(#avatarFace)"/>
   <path d="M84 55q-4-44 37-47 42 0 43 47l-8 12q-9-20-35-23-20 5-33 24z" fill="#101925"/>
   <path d="M85 59q35-19 79-2l-2 27q-38-14-76 1z" fill="#07111f" opacity=".92"/>
   <path d="M104 85h9m16 0h9" stroke="#18202a" strokeWidth="4" strokeLinecap="round"/>
   <path d="M111 105q9 7 18 0" stroke="#51372f" strokeWidth="3" fill="none" opacity=".5"/>
   <path d="M120 142v88" stroke="#ffffff44" strokeWidth="3"/><path d="M89 159h62" stroke="#ffffff33" strokeWidth="3"/>
   <circle cx="120" cy="182" r="22" fill="#07111f" opacity=".76"/><text x="120" y="190" textAnchor="middle" fill="#f8fafc" fontSize="26" fontWeight="900">?</text>
  </svg>
  {!revealed&&<span className="avatar-mystery-mask">WHO IS IT?</span>}
 </div>;
}
