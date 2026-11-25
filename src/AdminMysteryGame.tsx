import {useCallback,useEffect,useState,type FormEvent} from "react";
import AdminSelect from "./AdminSelect";
import "./AdminSelect.css";type Difficulty="easy"|"medium"|"hard";
type Settings={entry_easy_ct:number;entry_medium_ct:number;entry_hard_ct:number;reward_easy_sethis:number;reward_medium_sethis:number;reward_hard_sethis:number;question_count:number};
type Question={id:string;difficulty:Difficulty;category:string;question_text:string;option_a:string;option_b:string;option_c:string;option_d:string;correct_option:"a"|"b"|"c"|"d";explanation:string;source_label:string;source_url:string;active:number;usage_count:number};
const blank={difficulty:"easy" as Difficulty,category:"Players",question_text:"",option_a:"",option_b:"",option_c:"",option_d:"",correct_option:"a" as "a"|"b"|"c"|"d",explanation:"",source_label:"",source_url:""};
const defaults:Settings={entry_easy_ct:300,entry_medium_ct:300,entry_hard_ct:300,reward_easy_sethis:130,reward_medium_sethis:200,reward_hard_sethis:500,question_count:5};
async function request(path:string,init?:RequestInit){const r=await fetch(path,{...init,credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json",...(init?.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"The request could not be completed.");return d;}
export default function AdminMysteryGame(){
 const [questions,setQuestions]=useState<Question[]>([]),[settings,setSettings]=useState<Settings>(defaults),[form,setForm]=useState(blank),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{try{const d=await request("/api/admin/mystery-questions");setQuestions(d.questions||[]);setSettings({...defaults,...d.settings});setError("");}catch(e){setError(e instanceof Error?e.message:"Mystery question bank could not be loaded.");}},[]);
 useEffect(()=>{void load();},[load]);
 const create=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");setNotice("");try{await request("/api/admin/mystery-questions",{method:"POST",body:JSON.stringify(form)});setForm(blank);setNotice("Sourced question added to the Mystery Footballer bank.");await load();}catch(e){setError(e instanceof Error?e.message:"Question could not be saved.");}finally{setBusy(false);}};
 const toggle=async(q:Question)=>{setBusy(true);setError("");try{await request("/api/admin/mystery-questions/"+encodeURIComponent(q.id),{method:"PATCH",body:JSON.stringify({active:!q.active})});setNotice(q.active?"Question removed from future rotations.":"Question returned to the question bank.");await load();}catch(e){setError(e instanceof Error?e.message:"Question status could not be changed.");}finally{setBusy(false);}};
 const saveSettings=async()=>{setBusy(true);setError("");setNotice("");try{await request("/api/admin/mystery-game-settings",{method:"PATCH",body:JSON.stringify(settings)});setNotice("Difficulty entry costs and rewards saved. The five-question format is fixed.");await load();}catch(e){setError(e instanceof Error?e.message:"Game settings could not be saved.");}finally{setBusy(false);}};
 const activeCount=(level:Difficulty)=>questions.filter(q=>q.difficulty===level&&q.active).length;
 return <section className="admin-mystery-game">
  <div className="admin-detail-head"><div><small>SETHIS · GAME CONTENT</small><h2>Mystery Footballer question bank</h2><p>Build the daily Easy, Medium and Hard question sets. Every question must have four unique options, one correct answer, an explanation and a credible HTTPS source.</p></div><button className="admin-refresh" onClick={()=>void load()}>↻ REFRESH</button></div>
  {error&&<div className="admin-error">{error}</div>}{notice&&<div className="admin-success">{notice}</div>}
  <div className="admin-mystery-stats">{(["easy","medium","hard"] as const).map(level=><article key={level}><small>{level.toUpperCase()} · ACTIVE QUESTIONS</small><b>{activeCount(level)}</b></article>)}</div>
  <section className="admin-mystery-settings"><div><span className="eyebrow">CHALLENGE ECONOMY</span><h3>Entry costs & perfect-set rewards</h3><p>Players pay GT (Game Token) to enter. SETHIS is awarded only when every question in the selected daily set is answered correctly. A wrong answer ends the attempt with zero SETHIS.</p></div>
   <div className="admin-form-grid">
    <label>EASY ENTRY COST (GT)<input type="number" min="0" max="100000" value={settings.entry_easy_ct} onChange={e=>setSettings(v=>({...v,entry_easy_ct:Number(e.target.value)}))}/></label>
    <label>EASY PERFECT REWARD (SETHIS)<input type="number" min="0" max="100000" value={settings.reward_easy_sethis} onChange={e=>setSettings(v=>({...v,reward_easy_sethis:Number(e.target.value)}))}/></label>
    <label>MEDIUM ENTRY COST (GT)<input type="number" min="0" max="100000" value={settings.entry_medium_ct} onChange={e=>setSettings(v=>({...v,entry_medium_ct:Number(e.target.value)}))}/></label>
    <label>MEDIUM PERFECT REWARD (SETHIS)<input type="number" min="0" max="100000" value={settings.reward_medium_sethis} onChange={e=>setSettings(v=>({...v,reward_medium_sethis:Number(e.target.value)}))}/></label>
    <label>HARD ENTRY COST (GT)<input type="number" min="0" max="100000" value={settings.entry_hard_ct} onChange={e=>setSettings(v=>({...v,entry_hard_ct:Number(e.target.value)}))}/></label>
    <label>HARD PERFECT REWARD (SETHIS)<input type="number" min="0" max="100000" value={settings.reward_hard_sethis} onChange={e=>setSettings(v=>({...v,reward_hard_sethis:Number(e.target.value)}))}/></label>
    <div className="admin-fixed-setting"><span>QUESTIONS PER DAILY SET</span><strong>5</strong><small>Every difficulty uses five questions.</small></div>
   </div><button className="admin-primary" disabled={busy||Object.values(settings).some(v=>!Number.isInteger(v)||v<0)||settings.question_count!==5} onClick={()=>void saveSettings()}>SAVE CHALLENGE SETTINGS</button>
  </section>
  <form className="admin-mystery-create" onSubmit={create}><div><span className="eyebrow">QUESTION LIBRARY</span><h3>Add a sourced football question</h3><p>Use a verifiable fact. Questions are rotated into the daily set by difficulty and usage history.</p></div>
   <div className="admin-form-grid">
    <label>DIFFICULTY<AdminSelect value={form.difficulty} onChange={e=>setForm(v=>({...v,difficulty:e.target.value as Difficulty}))}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></AdminSelect></label>
    <label>CATEGORY<input required maxLength={60} value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))} placeholder="Players, clubs, World Cup…"/></label>
    <label className="admin-mystery-wide">QUESTION<input required minLength={10} maxLength={500} value={form.question_text} onChange={e=>setForm(v=>({...v,question_text:e.target.value}))} placeholder="Write a clear question with one unambiguous answer."/></label>
    {(["a","b","c","d"] as const).map(k=>{const field=("option_"+k) as "option_a"|"option_b"|"option_c"|"option_d";return <label key={k}>OPTION {k.toUpperCase()}<input required maxLength={160} value={form[field]} onChange={e=>setForm(v=>({...v,[field]:e.target.value}))}/></label>;})}
    <label>CORRECT OPTION<AdminSelect value={form.correct_option} onChange={e=>setForm(v=>({...v,correct_option:e.target.value as typeof blank.correct_option}))}><option value="a">Option A</option><option value="b">Option B</option><option value="c">Option C</option><option value="d">Option D</option></AdminSelect></label>
    <label className="admin-mystery-wide">EXPLANATION<textarea maxLength={800} value={form.explanation} onChange={e=>setForm(v=>({...v,explanation:e.target.value}))} placeholder="Explain the correct answer briefly."/></label>
    <label>SOURCE NAME<input required maxLength={120} value={form.source_label} onChange={e=>setForm(v=>({...v,source_label:e.target.value}))} placeholder="FIFA, UEFA, PremierLeague.com…"/></label>
    <label>SOURCE URL<input required type="url" maxLength={500} value={form.source_url} onChange={e=>setForm(v=>({...v,source_url:e.target.value}))} placeholder="https://…"/></label>
   </div>
   <button className="admin-primary" disabled={busy}>{busy?"SAVING QUESTION…":"ADD QUESTION TO BANK"}</button>
  </form>
  <div className="admin-section-title">QUESTION ROTATION <span>{questions.length} TOTAL QUESTIONS</span></div>
  <div className="admin-mystery-list">{questions.map(q=><article key={q.id}><div className="admin-mystery-avatar">{q.difficulty.slice(0,1).toUpperCase()}</div><div className="admin-mystery-player-copy"><b>{q.question_text}</b><small>{q.difficulty.toUpperCase()} · {q.category} · USED {q.usage_count} TIMES</small><small>A. {q.option_a} · B. {q.option_b} · C. {q.option_c} · D. {q.option_d}</small><small>Correct: {q.correct_option.toUpperCase()} · {q.source_label} · <a href={q.source_url} target="_blank" rel="noreferrer">SOURCE</a></small></div><button disabled={busy} className={q.active?"admin-mystery-toggle active":"admin-mystery-toggle"} onClick={()=>void toggle(q)}>{q.active?"IN ROTATION":"INACTIVE"}</button></article>)}</div>
 </section>;
}
