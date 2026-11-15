import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "../src/worker.ts";

const botToken = "123456:integration-test-token";

class TestD1Statement {
  params = [];
  constructor(db, sql) { this.db = db; this.sql = sql; }
  bind(...params) { this.params = params; return this; }
  first() { return this.db.prepare(this.sql).get(...this.params) ?? null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.params) }; }
  run() {
    const result = this.db.prepare(this.sql).run(...this.params);
    return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) || 0 } };
  }
}

function createEnvironment() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const migrationDir = join(process.cwd(), "migrations");
  for (const file of readdirSync(migrationDir).filter(name => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(join(migrationDir, file), "utf8"));
  }
  const DB = {
    prepare(sql) { return new TestD1Statement(sqlite, sql); },
    batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map(statement => statement.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    }
  };
  return {
    DB,
    TELEGRAM_BOT_TOKEN: botToken,
    TELEGRAM_BOT_USERNAME: "SettleThisTestBot",
    ASSETS: { fetch: async () => new Response("asset") }
  };
}

function signedInitData(user, extra = {}) {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "AAE-integration-test",
    user: JSON.stringify(user),
    ...extra
  });
  const check = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key + "=" + value)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  params.set("hash", createHmac("sha256", secret).update(check).digest("hex"));
  return params.toString();
}

async function api(env, path, initData, method = "GET", body) {
  const headers = { "x-telegram-init-data": initData };
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await worker.fetch(new Request("https://settlethis.test" + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  }), env);
  return { response, data: await response.json() };
}

test("Telegram accounts persist independently through onboarding, profile, check-in, welcome gift and referral qualification", async () => {
  const env = createEnvironment();
  const firstUser = { id: 700001, first_name: "Chelsea", username: "chelsea_fan" };
  const firstInit = signedInitData(firstUser);

  const signedIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: firstInit })
  }), env);
  assert.equal(signedIn.status, 200);
  assert.equal((await signedIn.json()).user.id, firstUser.id);

  const initialProfile = await api(env, "/api/profile", firstInit);
  assert.equal(initialProfile.response.status, 200);
  assert.equal(initialProfile.data.profile.telegram_user_id, String(firstUser.id));

  const savedProfile = await api(env, "/api/profile", firstInit, "PUT", {
    club: "Chelsea", country: "Nigeria", bio: "Blue is the colour."
  });
  assert.equal(savedProfile.response.status, 200);
  const profile = await api(env, "/api/profile", firstInit);
  assert.equal(profile.data.profile.club, "Chelsea");
  assert.equal(profile.data.profile.country, "Nigeria");
  assert.equal(profile.data.profile.bio, "Blue is the colour.");

  const invalidClub = await api(env, "/api/profile", firstInit, "PUT", { club: "General Football" });
  assert.equal(invalidClub.response.status, 400);

  const outOfOrder = await api(env, "/api/onboarding/progress", firstInit, "POST", { step: 2 });
  assert.equal(outOfOrder.response.status, 409);
  for (let step = 1; step <= 7; step++) {
    const saved = await api(env, "/api/onboarding/progress", firstInit, "POST", { step });
    assert.equal(saved.response.status, 200);
    assert.equal(saved.data.step, step);
  }
  const completed = await api(env, "/api/onboarding/complete", firstInit, "POST", {});
  assert.equal(completed.response.status, 200);
  const gift = await api(env, "/api/welcome-gift/claim", firstInit, "POST", {});
  assert.equal(gift.response.status, 200);
  assert.equal(gift.data.wallet.ct_balance, 3500);
  const replayedGift = await api(env, "/api/welcome-gift/claim", firstInit, "POST", {});
  assert.equal(replayedGift.response.status, 200);
  assert.equal(replayedGift.data.already_claimed, true);
  assert.equal(replayedGift.data.wallet.ct_balance, 3500);

  const checkin = await api(env, "/api/checkin", firstInit, "POST");
  assert.equal(checkin.response.status, 200);
  assert.equal(checkin.data.checked_in_today, true);
  const duplicateCheckin = await api(env, "/api/checkin", firstInit, "POST");
  assert.equal(duplicateCheckin.response.status, 200);
  assert.equal(duplicateCheckin.data.total_checkins, 1);

  const notifications = await api(env, "/api/notifications", firstInit);
  assert.equal(notifications.response.status, 200);
  assert.ok(notifications.data.notifications.some(item => item.type === "wallet_credit"));
  const giftNotification = notifications.data.notifications.find(item => item.type === "wallet_credit");
  const markedRead = await api(env, "/api/notifications/" + giftNotification.id + "/read", firstInit, "POST", {});
  assert.equal(markedRead.response.status, 200);
  const notificationsAfterRead = await api(env, "/api/notifications", firstInit);
  assert.equal(notificationsAfterRead.data.notifications.find(item => item.id === giftNotification.id).read_at !== null, true);

  const referralCode = await api(env, "/api/referrals", firstInit);
  assert.equal(referralCode.response.status, 200);
  assert.ok(referralCode.data.code);
  assert.ok(referralCode.data.invite_link.includes("startapp=ref_"));

  const secondUser = { id: 700002, first_name: "Arsenal", username: "arsenal_fan" };
  const secondInit = signedInitData(secondUser, { start_param: "ref_" + referralCode.data.code });
  const secondSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: secondInit })
  }), env);
  assert.equal(secondSignIn.status, 200);

  const secondProfile = await api(env, "/api/profile", secondInit);
  assert.equal(secondProfile.data.profile.telegram_user_id, String(secondUser.id));
  assert.equal(secondProfile.data.profile.club, null);

  for (let step = 1; step <= 7; step++) {
    const saved = await api(env, "/api/onboarding/progress", secondInit, "POST", { step });
    assert.equal(saved.response.status, 200);
  }
  assert.equal((await api(env, "/api/onboarding/complete", secondInit, "POST", {})).response.status, 200);
  const secondGift = await api(env, "/api/welcome-gift/claim", secondInit, "POST", {});
  assert.equal(secondGift.response.status, 200);
  assert.equal(secondGift.data.wallet.ct_balance, 3500);

  const firstReferralSummary = await api(env, "/api/referrals", firstInit);
  assert.equal(firstReferralSummary.data.total, 1);
  assert.equal(firstReferralSummary.data.qualified, 1);

  const firstProfileAfterSecondSignIn = await api(env, "/api/profile", firstInit);
  assert.equal(firstProfileAfterSecondSignIn.data.profile.club, "Chelsea");
});
