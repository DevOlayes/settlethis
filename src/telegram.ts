export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}
interface TelegramWebApp {
  initData: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  isExpanded?: boolean;
  ready(): void;
  expand(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  disableVerticalSwipes?(): void;
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
  webApp.setHeaderColor?.("#0B1220");
  webApp.setBackgroundColor?.("#0B1220");
  webApp.disableVerticalSwipes?.();
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
  const payload = await response.json() as { user?: TelegramUser; error?: string };
  if (!response.ok || !payload.user) throw new Error(payload.error || "Telegram authentication failed.");
  return payload.user;
}
