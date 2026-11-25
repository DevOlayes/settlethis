import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createServer } from "vite";

let worker;
let vite;
test.before(async () => {
  vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: "custom" });
  worker = (await vite.ssrLoadModule("/src/worker.ts")).default;
});
test.after(async () => { await vite?.close(); });

const botToken = "123456:integration-test-token";

class TestD1Statement {
  params = [];
  constructor(db, sql) { this.db = db; this.sql = sql; }
  bind(...params) { this.params = params; return this; }
  async first() { return this.db.prepare(this.sql).get(...this.params) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.params) }; }
  async run() {
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
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
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
    testDb: sqlite,
    TELEGRAM_BOT_TOKEN: botToken,
    TELEGRAM_BOT_USERNAME: "SettleThisTestBot",
    MONETAG_POSTBACK_SECRET: "integration-only-postback-secret",
    MONETAG_ZONE_ID: "12269852",
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

async function adminApi(env, path, token, method = "GET", body) {
  const headers = { cookie: "st_admin=" + token, origin: "https://settlethis.test" };
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await worker.fetch(new Request("https://settlethis.test" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
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
  for (let step = 1; step <= 4; step++) {
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

  const gameUser = { id: 700010, first_name: "Runner", username: "runner_tester" };
  const gameInit = signedInitData(gameUser);
  const gameSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: gameInit })
  }), env);
  assert.equal(gameSignIn.status, 200);
  for (let step = 1; step <= 4; step++) {
    assert.equal((await api(env, "/api/onboarding/progress", gameInit, "POST", { step })).response.status, 200);
  }
  assert.equal((await api(env, "/api/onboarding/complete", gameInit, "POST", {})).response.status, 200);
  const gameGift = await api(env, "/api/welcome-gift/claim", gameInit, "POST", {});
  assert.equal(gameGift.data.wallet.ct_balance, 3500);

  const runnerConfig = await api(env, "/api/runner/config", gameInit);
  assert.equal(runnerConfig.response.status, 200);
  assert.equal(runnerConfig.data.access_mode, "daily_access");
  assert.equal(runnerConfig.data.entry_ct, 500);
  assert.equal(runnerConfig.data.rewards_enabled, true);

  const runnerBefore = await api(env, "/api/runner/records", gameInit);
  assert.equal(runnerBefore.response.status, 200);
  assert.equal(runnerBefore.data.records.totalRuns, 0);

  const runnerStart = await api(env, "/api/runner/start", gameInit, "POST", {});
  assert.equal(runnerStart.response.status, 201);
  assert.ok(runnerStart.data.run_id);
  env.testDb.prepare("UPDATE runner_game_runs SET started_at=datetime('now','-10 seconds') WHERE id=?")
    .run(runnerStart.data.run_id);
  const runnerFinish = await api(env, "/api/runner/finish", gameInit, "POST", {
    run_id: runnerStart.data.run_id, distance: 100, points: 1200, footballs: 0
  });
  assert.equal(runnerFinish.response.status, 200);
  assert.equal(runnerFinish.data.saved, true);
  assert.equal(runnerFinish.data.records.bestDistance, 100);
  assert.equal(runnerFinish.data.rewards_enabled, true);
  assert.equal(runnerFinish.data.sethis_reward, 0);
  const duplicateRunnerFinish = await api(env, "/api/runner/finish", gameInit, "POST", {
    run_id: runnerStart.data.run_id, distance: 100, points: 1200, footballs: 0
  });
  assert.equal(duplicateRunnerFinish.response.status, 409);
  const runnerWallet = await api(env, "/api/wallet", gameInit);
  assert.equal(runnerWallet.data.wallet.ct_balance, 3000);
  assert.equal(runnerWallet.data.wallet.sethis_balance, 0);
  const repeatRunnerStart = await api(env, "/api/runner/start", gameInit, "POST", {});
  assert.equal(repeatRunnerStart.response.status, 201);
  assert.equal(repeatRunnerStart.data.daily_access_unlocked, true);
  env.testDb.prepare("UPDATE runner_game_runs SET started_at=datetime('now','-10 seconds') WHERE id=?").run(repeatRunnerStart.data.run_id);
  const repeatRunnerFinish = await api(env, "/api/runner/finish", gameInit, "POST", { run_id: repeatRunnerStart.data.run_id, distance: 100, points: 1200, footballs: 0 });
  assert.equal(repeatRunnerFinish.response.status, 200);
  const walletAfterRepeatRun = await api(env, "/api/wallet", gameInit);
  assert.equal(walletAfterRepeatRun.data.wallet.ct_balance, 3000, "repeat runs must not charge another daily access fee");

  env.testDb.prepare("UPDATE mystery_questions SET active=0").run();
  for (const difficulty of ["easy", "medium"]) {
    for (let position = 1; position <= 5; position++) {
      env.testDb.prepare("INSERT INTO mystery_questions(id,difficulty,category,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,source_label,source_url,active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1)")
        .run(
          "integration-" + difficulty + "-" + position,
          difficulty,
          "Integration",
          "Which answer is correct for " + difficulty + " test question " + position + "?",
          "Correct answer " + position,
          "Wrong answer B " + position,
          "Wrong answer C " + position,
          "Wrong answer D " + position,
          "a",
          "Option A is the correct integration-test answer.",
          "Integration Test",
          "https://example.com/integration/" + difficulty + "/" + position
        );
    }
  }
  const mysteryState = await api(env, "/api/mystery-challenge", gameInit);
  assert.equal(mysteryState.response.status, 200);
  const easyLevel = mysteryState.data.levels.find(level => level.difficulty === "easy");
  assert.equal(easyLevel.ready, true);
  assert.equal(Object.hasOwn(easyLevel, "question_count"), false, "question-bank set size is internal and must not be exposed to players");
  assert.equal(easyLevel.entry_ct, 300);
  assert.equal(easyLevel.reward_sethis, 130);

  const easyStart = await api(env, "/api/mystery-challenge/start", gameInit, "POST", { difficulty: "easy" });
  assert.equal(easyStart.response.status, 200);
  assert.equal(easyStart.data.attempt.status, "active");
  assert.ok(easyStart.data.attempt.id);
  let currentQuestion = easyStart.data.question;
  for (let position = 1; position <= 5; position++) {
    const answer = await api(env, "/api/mystery-challenge/" + easyStart.data.attempt.id + "/answer", gameInit, "POST", {
      question_id: currentQuestion.id,
      option: "a"
    });
    assert.equal(answer.response.status, 200);
    assert.equal(answer.data.correct, true);
    if (position < 5) {
      assert.equal(answer.data.status, "active");
      currentQuestion = answer.data.next_question;
      assert.ok(currentQuestion);
    } else {
      assert.equal(answer.data.status, "won");
      assert.equal(answer.data.correct_answers, 5);
      assert.equal(answer.data.sethis_reward, 130);
    }
  }
  const walletAfterMysteryWin = await api(env, "/api/wallet", gameInit);
  assert.equal(walletAfterMysteryWin.data.wallet.ct_balance, 2700);
  assert.equal(walletAfterMysteryWin.data.wallet.sethis_balance, 130);

  const secondDifficulty = await api(env, "/api/mystery-challenge/start", gameInit, "POST", { difficulty: "medium" });
  assert.equal(secondDifficulty.response.status, 409);
  assert.match(secondDifficulty.data.error, /already completed|one Mystery Footballer difficulty/i);
});


async function monetagPostback(env, fields, secret = env.MONETAG_POSTBACK_SECRET) {
  const query = new URLSearchParams({ ...fields, secret });
  const response = await worker.fetch(new Request("https://settlethis.test/api/ads/monetag/postback?" + query.toString()), env);
  return { response, data: await response.json() };
}

test("Monetag postbacks enforce secret, valued-event, user, placement, shared cooldown, daily cap and exactly-once wallet notifications", async () => {
  const env = createEnvironment();
  const user = { id: 710001, first_name: "AdTest", username: "ad_test_member" };
  const initData = signedInitData(user);
  const signIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData })
  }), env);
  assert.equal(signIn.status, 200);

  const status = await api(env, "/api/ads/status", initData);
  assert.equal(status.response.status, 200);
  assert.equal(status.data.configured, true);
  assert.equal(status.data.daily_limit, 30);
  assert.equal(status.data.home_ct_reward, 100);
  assert.equal(status.data.tasks_sethis_reward, 150);

  const payload = {
    ymid: "integration-home-event-1",
    reward_event_type: "valued",
    telegram_id: String(user.id),
    zone_id: "12269852",
    request_var: "home_ct"
  };
  const noSecret = await monetagPostback(env, payload, "wrong-secret");
  assert.equal(noSecret.response.status, 401);
  assert.equal(noSecret.data.accepted, undefined);

  const nonValued = await monetagPostback(env, { ...payload, ymid: "integration-non-valued", reward_event_type: "non_valued" });
  assert.equal(nonValued.response.status, 200);
  assert.equal(nonValued.data.accepted, false);

  const wrongZone = await monetagPostback(env, { ...payload, ymid: "integration-wrong-zone", zone_id: "999999" });
  assert.equal(wrongZone.data.accepted, false);
  const wrongPlacement = await monetagPostback(env, { ...payload, ymid: "integration-wrong-placement", request_var: "other" });
  assert.equal(wrongPlacement.data.accepted, false);
  const unknownUser = await monetagPostback(env, { ...payload, ymid: "integration-unknown-user", telegram_id: "710099" });
  assert.equal(unknownUser.data.accepted, false);

  const creditedHome = await monetagPostback(env, payload);
  assert.equal(creditedHome.response.status, 200);
  assert.deepEqual(creditedHome.data.reward, { token: "CT", amount: 100 });
  const duplicateHome = await monetagPostback(env, payload);
  assert.equal(duplicateHome.data.accepted, true);
  assert.equal(duplicateHome.data.duplicate, true);

  const blockedTasksDuringSharedCooldown = await monetagPostback(env, {
    ...payload,
    ymid: "integration-tasks-during-cooldown",
    request_var: "tasks_sethis"
  });
  assert.equal(blockedTasksDuringSharedCooldown.data.accepted, false);

  const walletAfterHome = await api(env, "/api/wallet", initData);
  assert.equal(walletAfterHome.data.wallet.ct_balance, 100);
  assert.equal(walletAfterHome.data.wallet.sethis_balance, 0);
  assert.equal(Number(env.testDb.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE user_id=? AND transaction_type='ad_reward'").get(String(user.id)).n), 1);
  assert.equal(Number(env.testDb.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND event_key='monetag:integration-home-event-1'").get(String(user.id)).n), 1);

  env.testDb.prepare("UPDATE ad_reward_events SET created_at=datetime('now','-21 minutes') WHERE provider_event_id=?").run("integration-home-event-1");
  for (let index = 0; index < 29; index++) {
    env.testDb.prepare("INSERT INTO ad_reward_events(id,provider,provider_event_id,telegram_user_id,placement,reward_token,reward_amount,event_type,zone_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,datetime('now','-21 minutes'))")
      .run("seed-ad-" + index, "monetag", "seed-ad-event-" + index, String(user.id), "home_ct", "CT", 100, "valued", "12269852");
  }
  const statusAt29 = await api(env, "/api/ads/status", initData);
  // During the first 21 minutes after Lagos midnight, the 21-minute-old fixtures
  // correctly belong to yesterday, so the daily counter has already reset.
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000);
  const justAfterMidnight = lagosNow.getUTCHours() === 0 && lagosNow.getUTCMinutes() < 21;
  assert.equal(statusAt29.data.ads_today, justAfterMidnight ? 0 : 30);
  assert.equal(statusAt29.data.remaining_today, justAfterMidnight ? 30 : 0);
  if (justAfterMidnight) return;

  // Use a fresh member for an exact 29 -> 30 -> 31 daily-cap boundary.
  const capUser = { id: 710002, first_name: "CapTest", username: "cap_test_member" };
  const capInit = signedInitData(capUser);
  const capSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: capInit })
  }), env);
  assert.equal(capSignIn.status, 200);
  for (let index = 0; index < 29; index++) {
    env.testDb.prepare("INSERT INTO ad_reward_events(id,provider,provider_event_id,telegram_user_id,placement,reward_token,reward_amount,event_type,zone_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,datetime('now','-21 minutes'))")
      .run("cap-seed-" + index, "monetag", "cap-seed-event-" + index, String(capUser.id), "home_ct", "CT", 100, "valued", "12269852");
  }
  const thirtieth = await monetagPostback(env, {
    ymid: "cap-thirtieth-event",
    reward_event_type: "valued",
    telegram_id: String(capUser.id),
    zone_id: "12269852",
    request_var: "tasks_sethis"
  });
  assert.equal(thirtieth.data.accepted, true);
  assert.deepEqual(thirtieth.data.reward, { token: "SETHIS", amount: 150 });
  env.testDb.prepare("UPDATE ad_reward_events SET created_at=datetime('now','-21 minutes') WHERE provider_event_id=?").run("cap-thirtieth-event");
  const thirtyFirst = await monetagPostback(env, {
    ymid: "cap-thirty-first-event",
    reward_event_type: "valued",
    telegram_id: String(capUser.id),
    zone_id: "12269852",
    request_var: "home_ct"
  });
  assert.equal(thirtyFirst.data.accepted, false);
  assert.match(thirtyFirst.data.reason, /limit|Cooldown/i);
  const capWallet = await api(env, "/api/wallet", capInit);
  assert.equal(capWallet.data.wallet.sethis_balance, 150);
  assert.equal(capWallet.data.wallet.ct_balance, 0);
  assert.equal(Number(env.testDb.prepare("SELECT COUNT(*) AS n FROM ad_reward_events WHERE telegram_user_id=?").get(String(capUser.id)).n), 30);
  assert.equal(Number(env.testDb.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND type='wallet_credit'").get(String(capUser.id)).n), 1);
});
