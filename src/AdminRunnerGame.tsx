import {useEffect,useState} from "react";
import "./AdminRunnerGame.css";
type Settings={entry_cost:number;ball_reward:number;distance_step:number;distance_reward:number;points_threshold_one:number;points_reward_one:number;points_threshold_two:number;points_reward_two:number;per_run_cap:number;daily_cap:number;active_player_run_threshold:number};
const defaults:Settings={entry_cost:500,ball_reward:2,distance_step:500,distance_reward:5,points_threshold_one:600,points_reward_one:10,points_threshold_two:1200,points_reward_two:20,per_run_cap:100,daily_cap:300,active_player_run_threshold:10};
const fields:Array<{key:keyof Settings;label:string;min:number;max:number;hint:string}>=[
 {key:"entry_cost",label:"Daily access price (GT)",min:1,max:100000,hint:"Charged once for daily access; repeat runs remain available during the access period."},
 {key:"ball_reward",label:"SETHIS per football collected",min:0,max:100,hint:"Reward for each validated football collected during a run."},
 {key:"distance_step",label:"Distance milestone (metres)",min:1,max:100000,hint:"Distance interval used to calculate distance rewards."},
 {key:"distance_reward",label:"SETHIS per distance milestone",min:0,max:1000,hint:"SETHIS awarded for each eligible distance step."},
 {key:"points_threshold_one",label:"First score milestone",min:1,max:100000000,hint:"Minimum validated score for the first milestone reward."},
 {key:"points_reward_one",label:"First milestone reward (SETHIS)",min:0,max:1000,hint:"Reward credited at the first score milestone."},
 {key:"points_threshold_two",label:"Second score milestone",min:1,max:100000000,hint:"Minimum validated score for the second milestone."},
 {key:"points_reward_two",label:"Second milestone reward (SETHIS)",min:0,max:1000,hint:"Reward credited at the second score milestone."},
 {key:"per_run_cap",label:"Maximum SETHIS per run",min:0,max:10000,hint:"Game-specific reward ceiling for one validated run."},
 {key:"daily_cap",label:"Maximum SETHIS per member per day",min:0,max:100000,hint:"Football Runner daily reward ceiling only; this is not a platform-wide task reward cap."},
 {key:"active_player_run_threshold",label:"Active-player qualification runs",min:1,max:1000,hint:"Completed runs in the rolling seven-day window used to qualify for the active-player reward policy."}
];
export default function AdminRunnerGame(){
 const [settings,setSettings]=useState<Settings>(defaults),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await fetch("/api/admin/runner-game-settings",{cache:"no-store",credentials:"same-origin"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Football Runner settings could not be loaded.");setSettings({...defaults,...d.settings});}catch(e){setError(e instanceof Error?e.message:"Football Runner settings are unavailable.");}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const save=async()=>{setBusy(true);setError("");setNotice("");try{const r=await fetch("/api/admin/runner-game-settings",{method:"PATCH",cache:"no-store",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(settings)}),d=await r.json();if(!r.ok)throw new Error(d.error||"Settings could not be saved.");setNotice("Football Runner settings saved successfully.");await load();}catch(e){setError(e instanceof Error?e.message:"Football Runner settings could not be saved.");}finally{setBusy(false);}};
 const valid=fields.every(f=>Number.isSafeInteger(settings[f.key])&&settings[f.key]>=f.min&&settings[f.key]<=f.max)&&settings.points_threshold_two>settings.points_threshold_one;
 return <section className="admin-runner-game"><div className="admin-detail-head"><div><small>SETHIS · GAME OPERATIONS</small><h2>Football Runner settings</h2><p>Control daily access, validated score rewards and the existing game-specific reward limits.</p></div><button className="admin-refresh" onClick={()=>void load()} disabled={loading}>↻ REFRESH</button></div>
 {error&&<div className="admin-error">{error}</div>}{notice&&<div className="admin-notice">{notice}</div>}
 <div className="runner-settings-intro"><span>⚽</span><div><b>Daily access · repeat runs</b><p>Members pay the configured GT price once to unlock Football Runner for the day. They can play repeatedly while access remains active. All rewards are validated by the Worker.</p></div></div>
 <div className="runner-settings-grid">{fields.map(field=><label className="runner-setting" key={field.key}><span>{field.label}</span><input type="number" min={field.min} max={field.max} step="1" value={settings[field.key]} disabled={loading} onChange={e=>setSettings(v=>({...v,[field.key]:e.target.value===""?0:Number(e.target.value)}))}/><small>{field.hint}</small></label>)}</div>
 {settings.points_threshold_two<=settings.points_threshold_one&&<div className="admin-error">The second score milestone must be higher than the first milestone.</div>}
 <div className="runner-settings-foot"><p>Changes affect future validated runs. Existing wallet transactions and completed game results are not rewritten.</p><button className="admin-primary" disabled={loading||busy||!valid} onClick={()=>void save()}>{busy?"SAVING SETTINGS…":"SAVE FOOTBALL RUNNER SETTINGS"}</button></div>
 </section>;
}
