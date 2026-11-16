import { useEffect,useState } from "react";

type AffiliateItem={id:string;title:string;category:string;description:string;image_url?:string|null;destination_url:string;disclosure_text:string};
type AffiliatePlacement="home_feed"|"court_detail"|"match_centre"|"competition_hub";
let fallbackSession:string|null=null;
function sessionKey(){try{let key=sessionStorage.getItem("st_affiliate_session");if(!key){const bytes=crypto.getRandomValues(new Uint8Array(16));key=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");sessionStorage.setItem("st_affiliate_session",key);}return key;}catch{if(!fallbackSession){const bytes=crypto.getRandomValues(new Uint8Array(16));fallbackSession=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}return fallbackSession;}}
function recordClick(id:string,placement:AffiliatePlacement){void fetch("/api/affiliates/click",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({affiliate_id:id,placement,session_key:sessionKey()}),keepalive:true}).catch(()=>{});}
export default function AffiliateSlot({placement}:{placement:AffiliatePlacement}){
 const [items,setItems]=useState<AffiliateItem[]>([]);
 useEffect(()=>{let active=true;fetch("/api/affiliates?placement="+encodeURIComponent(placement),{cache:"no-store"}).then(async response=>response.ok?response.json():{items:[]}).then(data=>{if(active)setItems(Array.isArray(data?.items)?data.items:[]);}).catch(()=>{if(active)setItems([]);});return()=>{active=false;};},[placement]);
 if(!items.length)return null;
 return <aside className="affiliate-slot" aria-label="Affiliate recommendations"><div className="affiliate-slot-heading"><span>FOOTBALL PICKS</span><small>CURATED RECOMMENDATIONS</small></div>{items.map(item=><article className="affiliate-slot-card" key={item.id}><div className="affiliate-slot-content">{item.image_url&&<img src={item.image_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>}<div><span className="affiliate-slot-category">{item.category.replaceAll("_"," ")}</span><h3>{item.title}</h3><p>{item.description}</p></div></div><p className="affiliate-slot-disclosure">{item.disclosure_text}</p><a href={item.destination_url} target="_blank" rel="sponsored nofollow noopener noreferrer" referrerPolicy="no-referrer" onClick={()=>recordClick(item.id,placement)}>VIEW PRODUCT / SERVICE ↗</a></article>)}</aside>;
}
