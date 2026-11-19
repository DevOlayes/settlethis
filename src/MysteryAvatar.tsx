import type { CSSProperties } from "react";

function generatedPalette(key:string):[string,string,string]{let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;const hue=hash%360;return [`hsl(${hue} 72% 58%)`,`hsl(${(hue+38)%360} 58% 28%)`,"#bd8d6b"];}
export default function MysteryAvatar({avatarKey="kit-01",revealed=false,size="large"}:{avatarKey?:string;revealed?:boolean;size?:"large"|"small"}) {
 const [shirt,trim,skin]=generatedPalette(avatarKey);
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
