import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyTelegramInitData } from "../src/telegram-auth.ts";

const token = "123456:unit-test-token";
const now = 1_800_000_000;

function signedInitData(fields) {
  const params = new URLSearchParams(fields);
  const check = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key + "=" + value)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

const validFields = () => ({
  auth_date: String(now),
  query_id: "AAE-test-query",
  user: JSON.stringify({ id: 123456789, first_name: "Fan", username: "fan_one" })
});

test("accepts a valid Telegram-signed Mini App initData payload", async () => {
  const user = await verifyTelegramInitData(signedInitData(validFields()), token, now);
  assert.equal(user?.id, 123456789);
  assert.equal(user?.first_name, "Fan");
});

test("rejects tampered fields and signatures", async () => {
  const data = new URLSearchParams(signedInitData(validFields()));
  data.set("user", JSON.stringify({ id: 987654321, first_name: "Attacker" }));
  assert.equal(await verifyTelegramInitData(data.toString(), token, now), null);
});

test("rejects expired and implausibly future-dated initData", async () => {
  const expired = signedInitData({ ...validFields(), auth_date: String(now - 86401) });
  const future = signedInitData({ ...validFields(), auth_date: String(now + 61) });
  assert.equal(await verifyTelegramInitData(expired, token, now), null);
  assert.equal(await verifyTelegramInitData(future, token, now), null);
});

test("rejects missing fields, malformed hashes and invalid user identities", async () => {
  assert.equal(await verifyTelegramInitData("", token, now), null);
  assert.equal(await verifyTelegramInitData("auth_date=" + now, token, now), null);
  const badHash = new URLSearchParams(validFields());
  badHash.set("hash", "not-a-hash");
  assert.equal(await verifyTelegramInitData(badHash.toString(), token, now), null);
  const badUser = signedInitData({ ...validFields(), user: JSON.stringify({ id: 0, first_name: " " }) });
  assert.equal(await verifyTelegramInitData(badUser, token, now), null);
});

test("rejects missing bot token and oversized initData before cryptographic work", async () => {
  assert.equal(await verifyTelegramInitData(signedInitData(validFields()), "", now), null);
  assert.equal(await verifyTelegramInitData("x".repeat(8193), token, now), null);
});

test("accepts the exact 24-hour boundary and rejects one second beyond it", async () => {
  const boundary = signedInitData({ ...validFields(), auth_date: String(now - 86400) });
  const expired = signedInitData({ ...validFields(), auth_date: String(now - 86401) });
  assert.equal((await verifyTelegramInitData(boundary, token, now))?.id, 123456789);
  assert.equal(await verifyTelegramInitData(expired, token, now), null);
});
