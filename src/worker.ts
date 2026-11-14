interface D1Statement { bind(...values: unknown[]): D1Statement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; run(): Promise<unknown>; }
interface Env { ASSETS: { fetch(request: Request): Promise<Response> }; DB: { prepare(query: string): D1Statement }; TELEGRAM_BOT_TOKEN?: string; }
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
async function hmac(keyBytes:Uint8Array<ArrayBuffer>,message:string):Promise<ArrayBuffer>{const key=await crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return crypto.subtle.sign("HMAC",key,encoder.encode(message));}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function verify(initData:string,token:string):Promise<Record<string,unknown>|null>{
 if(!initData||initData.length>8192)return null;
 const p=new URLSearchParams(initData),hash=p.get("hash"),authDate=Number(p.get("auth_date")),raw=p.get("user");
 if(!hash||! /^[a-f0-9]{64}$/i.test(hash)||!Number.isFinite(authDate)||!raw)return null;
 const now=Math.floor(Date.now()/1000);if(authDate>now+60||now-authDate>86400)return null;
 const check=[...p.entries()].filter(([k])=>k!=="hash").sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
 const secret=await hmac(encoder.encode("WebAppData"),token),actual=hex(await hmac(new Uint8Array(secret),check));
 if(!safeEqual(actual,hash.toLowerCase()))return null;
 try{const u=JSON.parse(raw) as Record<string,unknown>;return Number.isSafeInteger(u.id)&&typeof u.first_name==="string"&&u.first_name.trim()?u:null;}catch{return null;}
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);
 if(url.pathname==="/api/health"&&request.method==="GET")return json({ok:true,service:"settlethis",database:"connected"});
 if(url.pathname==="/api/pool-court"&&request.method==="GET"){try{const pool=await env.DB.prepare("SELECT id,title,prize_amount,minimum_stake_ct,duration_days,status,opens_at,closes_at FROM pool_courts WHERE id = ?").bind("pool-court-001").first();if(!pool)return json({error:"Pool Court has not been configured."},404);const totals=await env.DB.prepare("SELECT side,COALESCE(SUM(stake_ct),0) AS total_stake_ct,COUNT(*) AS participant_count FROM pool_positions WHERE pool_id = ? AND status = 'active' GROUP BY side").bind("pool-court-001").all();return json({pool,sides:totals.results});}catch{return json({error:"Pool Court data is temporarily unavailable."},503);}}
 if(url.pathname==="/api/telegram/auth"){if(request.method!=="POST")return json({error:"Method not allowed."},405);if(!env.TELEGRAM_BOT_TOKEN)return json({error:"Telegram authentication is not configured on the server yet."},503);try{const body=await request.json() as {initData?:unknown};if(typeof body.initData!=="string")return json({error:"Telegram launch data is required."},400);const user=await verify(body.initData,env.TELEGRAM_BOT_TOKEN);if(!user)return json({error:"Telegram launch data is invalid or expired."},401);const id=String(user.id),username=typeof user.username==="string"?user.username:null,first=String(user.first_name),last=typeof user.last_name==="string"?user.last_name:null,photo=typeof user.photo_url==="string"?user.photo_url:null,language=typeof user.language_code==="string"?user.language_code:null,premium=user.is_premium===true?1:0;await env.DB.prepare("INSERT INTO telegram_users (telegram_user_id,username,first_name,last_name,photo_url,language_code,is_premium,last_seen_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(telegram_user_id) DO UPDATE SET username=excluded.username,first_name=excluded.first_name,last_name=excluded.last_name,photo_url=excluded.photo_url,language_code=excluded.language_code,is_premium=excluded.is_premium,last_seen_at=CURRENT_TIMESTAMP").bind(id,username,first,last,photo,language,premium).run();return json({authenticated:true,user:{id:Number(id),username,first_name:first,last_name:last,photo_url:photo,language_code:language,is_premium:Boolean(premium)}});}catch{return json({error:"Telegram sign-in could not be completed."},400);}}
 if(url.pathname.startsWith("/api/")&&request.method!=="GET")return json({error:"A verified account session and wallet authorization are required before any token transaction can be accepted."},401);
 if(url.pathname.startsWith("/api/"))return json({error:"Not found"},404);
 return env.ASSETS.fetch(request);
}};
