export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
  pool_invite?: { pool_id:string; side:"A"|"B"; invite_code:string } | null;
}
interface TelegramWebApp {
  initData: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  isActive?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: {top:number;right:number;bottom:number;left:number};
  contentSafeAreaInset?: {top:number;right:number;bottom:number;left:number};
  ready(): void;
  expand(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  requestFullscreen?(): void;
  exitFullscreen?(): void;
  setBottomBarColor?(color:string): void;
  onEvent?(eventType:string, callback:(event?:unknown)=>void): void;
  offEvent?(eventType:string, callback:(event?:unknown)=>void): void;
  requestSafeArea?(): void;
  requestContentSafeArea?(): void;
  openTelegramLink?(url: string): void;
  BackButton?: { show(): void; hide(): void; onClick(callback: () => void): void; offClick(callback: () => void): void };
}
declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp }; }
}
export function initializeTelegramApp(): TelegramWebApp | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor?.("#171522");
  webApp.setBackgroundColor?.("#171522");
  webApp.setBottomBarColor?.("#171522");
  const params = webApp.themeParams ?? {};
  if (params.bg_color) document.documentElement.style.setProperty("--tg-theme-bg-color", params.bg_color);
  if (params.text_color) document.documentElement.style.setProperty("--tg-theme-text-color", params.text_color);
  if (params.button_color) document.documentElement.style.setProperty("--tg-theme-button-color", params.button_color);
  return webApp;
}
export async function authenticateTelegram(initData: string): Promise<TelegramUser> {
  const response = await fetch("/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  const payload = await response.json() as { user?: TelegramUser; pool_invite?: TelegramUser["pool_invite"]; error?: string };
  if (!response.ok || !payload.user) throw new Error(payload.error || "Telegram authentication failed.");
  return { ...payload.user, pool_invite: payload.pool_invite ?? null };
}

export function bindTelegramViewport(webApp:TelegramWebApp):()=>void {
  const root=document.documentElement;
  const applyInsets=()=>{
    const safe=webApp.safeAreaInset;
    const content=webApp.contentSafeAreaInset;
    root.style.setProperty("--tma-safe-top",(safe?.top||0)+"px");
    root.style.setProperty("--tma-safe-right",(safe?.right||0)+"px");
    root.style.setProperty("--tma-safe-bottom",(safe?.bottom||0)+"px");
    root.style.setProperty("--tma-safe-left",(safe?.left||0)+"px");
    root.style.setProperty("--tma-content-safe-top",(content?.top||0)+"px");
    root.style.setProperty("--tma-content-safe-right",(content?.right||0)+"px");
    root.style.setProperty("--tma-content-safe-bottom",(content?.bottom||0)+"px");
    root.style.setProperty("--tma-content-safe-left",(content?.left||0)+"px");
  };
  const applyStableHeight=()=>{
    const height=webApp.viewportStableHeight||webApp.viewportHeight;
    if(height&&Number.isFinite(height))root.style.setProperty("--tma-viewport-height",height+"px");
  };
  const onViewport=(event?:unknown)=>{
    if((event as {isStateStable?:boolean}|undefined)?.isStateStable!==false)applyStableHeight();
  };
  webApp.requestSafeArea?.();
  webApp.requestContentSafeArea?.();
  applyInsets();
  applyStableHeight();
  webApp.onEvent?.("safeAreaChanged",applyInsets);
  webApp.onEvent?.("contentSafeAreaChanged",applyInsets);
  webApp.onEvent?.("viewportChanged",onViewport);
  webApp.onEvent?.("fullscreenChanged",applyStableHeight);
  return()=>{
    webApp.offEvent?.("safeAreaChanged",applyInsets);
    webApp.offEvent?.("contentSafeAreaChanged",applyInsets);
    webApp.offEvent?.("viewportChanged",onViewport);
    webApp.offEvent?.("fullscreenChanged",applyStableHeight);
  };
}
