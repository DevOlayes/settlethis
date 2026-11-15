import React,{useEffect,useState} from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPortal from "./Admin";
import {authenticateTelegram,initializeTelegramApp,type TelegramUser} from "./telegram";
import "./index.css";
function Root(){const [telegramUser,setTelegramUser]=useState<TelegramUser|null>(null);useEffect(()=>{const webApp=initializeTelegramApp();if(!webApp?.initData)return;let active=true;authenticateTelegram(webApp.initData).then(user=>{if(active)setTelegramUser(user);}).catch(()=>{if(active)setTelegramUser(null);});return()=>{active=false;};},[]);return window.location.pathname==="/admin"||window.location.pathname.startsWith("/admin/")?<AdminPortal/>:<App telegramUser={telegramUser}/>;}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);
