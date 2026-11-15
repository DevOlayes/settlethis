export type TelegramIdentity = {
  id: number;
  first_name: string;
  [key: string]: unknown;
};

const encoder = new TextEncoder();

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");

async function hmac(keyBytes: Uint8Array<ArrayBuffer>, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(message));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/** Verify Telegram Mini App initData using Telegram's documented WebAppData HMAC scheme. */
export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<TelegramIdentity | null> {
  if (!initData || initData.length > 8192 || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  const rawUser = params.get("user");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !Number.isFinite(authDate) || !rawUser) return null;
  if (authDate > nowSeconds + 60 || nowSeconds - authDate > 86400) return null;

  const checkString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key + "=" + value)
    .join("\n");

  const secret = await hmac(encoder.encode("WebAppData"), botToken);
  const actual = hex(await hmac(new Uint8Array(secret), checkString));
  if (!safeEqual(actual, hash.toLowerCase())) return null;

  try {
    const user = JSON.parse(rawUser) as TelegramIdentity;
    return Number.isSafeInteger(user.id) &&
      typeof user.first_name === "string" &&
      user.first_name.trim()
      ? user
      : null;
  } catch {
    return null;
  }
}
