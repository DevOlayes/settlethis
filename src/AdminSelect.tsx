import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import "./AdminSelect.css";
type OptionProps={value?:string;disabled?:boolean;children?:ReactNode};
type Props={value?:string;defaultValue?:string;onChange?:(event:{target:{value:string}})=>void;disabled?:boolean;required?:boolean;className?:string;children:ReactNode;"aria-label"?:string};
export default function AdminSelect({value,defaultValue="",onChange,disabled=false,required=false,className="",children,...rest}:Props){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null);
 const options=Children.toArray(children).filter((child):child is React.ReactElement<OptionProps>=>isValidElement<OptionProps>(child)).map(child=>({value:String(child.props.value??""),label:child.props.children,disabled:Boolean(child.props.disabled)}));
 const selected=value??defaultValue,active=options.find(option=>option.value===selected),label=active?.label??options.find(option=>option.value==="")?.label??"Choose an option";
 useEffect(()=>{const close=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false);};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close);},[]);
 return <div className={"admin-select "+className} ref={root}><button type="button" className="admin-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={rest["aria-label"]} disabled={disabled} onClick={()=>setOpen(v=>!v)}><span>{label}</span><i className={open?"up":""}/></button>{open&&<div className="admin-select-menu" role="listbox" aria-label={rest["aria-label"]}>{options.map((option,index)=><button type="button" role="option" aria-selected={selected===option.value} key={option.value+"-"+index} disabled={option.disabled} className={selected===option.value?"selected":""} onClick={()=>{onChange?.({target:{value:option.value}});setOpen(false);}}>{option.label}{selected===option.value&&<b>✓</b>}</button>)}</div>}{required&&<input className="admin-select-validation" tabIndex={-1} aria-hidden="true" required value={selected} readOnly/>}</div>;
}
