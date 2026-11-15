import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
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

  for (const invitedUser of [
    { id: 700004, first_name: "Liverpool", username: "liverpool_fan" },
    { id: 700005, first_name: "City", username: "city_fan" }
  ]) {
    const invitedInit = signedInitData(invitedUser, { start_param: "ref_" + referralCode.data.code });
    const invitedSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: invitedInit })
    }), env);
    assert.equal(invitedSignIn.status, 200);
    for (let step = 1; step <= 7; step++) {
      const saved = await api(env, "/api/onboarding/progress", invitedInit, "POST", { step });
      assert.equal(saved.response.status, 200);
    }
    assert.equal((await api(env, "/api/onboarding/complete", invitedInit, "POST", {})).response.status, 200);
    const invitedGift = await api(env, "/api/welcome-gift/claim", invitedInit, "POST", {});
    assert.equal(invitedGift.response.status, 200);
    assert.equal(invitedGift.data.wallet.ct_balance, 3500);
  }

  const firstReferralSummary = await api(env, "/api/referrals", firstInit);
  assert.equal(firstReferralSummary.data.total, 3);
  assert.equal(firstReferralSummary.data.qualified, 3);
  assert.equal(firstReferralSummary.data.reward, 500);
  const inviterWallet = await api(env, "/api/wallet", firstInit);
  assert.equal(inviterWallet.data.wallet.sethis_balance, 500);

  const firstProfileAfterSecondSignIn = await api(env, "/api/profile", firstInit);
  assert.equal(firstProfileAfterSecondSignIn.data.profile.club, "Chelsea");

  const thirdUser = { id: 700003, first_name: "Guest", username: "guest_fan" };
  const thirdInit = signedInitData(thirdUser);
  const thirdSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: thirdInit })
  }), env);
  assert.equal(thirdSignIn.status, 200);

  const courtId = "court-community-integration";
  env.DB.prepare("INSERT INTO courts (id,title,category,incident_context,side_a_label,side_a_argument,side_b_label,side_b_argument,status,closes_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(courtId, "Community integration test", "match_debate", "Synthetic test Court.", "Side A", "Case for A.", "Side B", "Case for B.", "open", new Date(Date.now() + 3600000).toISOString())
    .run();

  const outsiderArgument = await api(env, "/api/courts/" + courtId + "/arguments", thirdInit, "POST", { body: "I have not joined this Court." });
  assert.equal(outsiderArgument.response.status, 403);

  const firstJoin = await api(env, "/api/courts/" + courtId + "/join", firstInit, "POST", { side: "A" });
  assert.equal(firstJoin.response.status, 200);
  assert.equal(firstJoin.data.participant.side, "A");
  assert.equal(firstJoin.data.wallet.ct_balance, 3000);

  const secondJoin = await api(env, "/api/courts/" + courtId + "/join", secondInit, "POST", { side: "B" });
  assert.equal(secondJoin.response.status, 200);
  assert.equal(secondJoin.data.participant.side, "B");
  assert.equal(secondJoin.data.wallet.ct_balance, 3000);

  const duplicateJoin = await api(env, "/api/courts/" + courtId + "/join", firstInit, "POST", { side: "B" });
  assert.equal(duplicateJoin.response.status, 409);

  const argument = await api(env, "/api/courts/" + courtId + "/arguments", firstInit, "POST", {
    body: "The evidence supports Side A because the decision was consistent with the published rules."
  });
  assert.equal(argument.response.status, 201);
  const argumentId = argument.data.argument_id;

  const duplicateArgument = await api(env, "/api/courts/" + courtId + "/arguments", firstInit, "POST", {
    body: "The evidence supports Side A because the decision was consistent with the published rules."
  });
  assert.equal(duplicateArgument.response.status, 409);

  const reply = await api(env, "/api/arguments/" + argumentId + "/replies", secondInit, "POST", {
    body: "I disagree: the same evidence can be interpreted differently."
  });
  assert.equal(reply.response.status, 201);

  const replyReaction = await api(env, "/api/reactions", firstInit, "POST", {
    target_type: "reply", target_id: reply.data.reply_id, reaction: "insightful"
  });
  assert.equal(replyReaction.response.status, 200);
  const replyReactionCount = env.DB.prepare("SELECT COUNT(*) AS count FROM court_reactions WHERE target_type='reply' AND target_id=? AND telegram_user_id=?")
    .bind(reply.data.reply_id, String(firstUser.id)).first();
  assert.equal(Number(replyReactionCount.count), 1);

  const reaction = await api(env, "/api/reactions", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reaction: "agree"
  });
  assert.equal(reaction.response.status, 200);
  const repeatedReaction = await api(env, "/api/reactions", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reaction: "agree"
  });
  assert.equal(repeatedReaction.response.status, 200);
  const reactionCount = env.DB.prepare("SELECT COUNT(*) AS count FROM court_reactions WHERE target_type='argument' AND target_id=? AND telegram_user_id=?")
    .bind(argumentId, String(secondUser.id)).first();
  assert.equal(Number(reactionCount.count), 1);

  const report = await api(env, "/api/reports", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reason: "Misleading content", details: "This is a synthetic integration report."
  });
  assert.equal(report.response.status, 201);
  const duplicateReport = await api(env, "/api/reports", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reason: "Misleading content", details: "Duplicate synthetic report."
  });
  assert.equal(duplicateReport.response.status, 409);

  const immediateFirstNotifications = await api(env, "/api/notifications", firstInit);
  assert.ok(immediateFirstNotifications.data.notifications.some(item => item.type === "reaction" && item.reference_id === argumentId));
  const immediateSecondNotifications = await api(env, "/api/notifications", secondInit);
  assert.ok(immediateSecondNotifications.data.notifications.some(item => item.type === "new_argument" && item.reference_id === courtId));

  const additionalArgumentIds = [];
  for (let number = 2; number <= 20; number++) {
    const created = await api(env, "/api/courts/" + courtId + "/arguments", firstInit, "POST", {
      body: "Distinct integration argument number " + number + " supporting Side A with its own evidence reference."
    });
    assert.equal(created.response.status, 201);
    additionalArgumentIds.push(created.data.argument_id);
  }
  const argumentLimit = await api(env, "/api/courts/" + courtId + "/arguments", firstInit, "POST", {
    body: "The twenty-first argument must be rate limited for this member."
  });
  assert.equal(argumentLimit.response.status, 429);

  for (let number = 2; number <= 60; number++) {
    const createdReply = await api(env, "/api/arguments/" + argumentId + "/replies", secondInit, "POST", {
      body: "Distinct integration reply number " + number + " with a separate contribution."
    });
    assert.equal(createdReply.response.status, 201);
  }
  const replyLimit = await api(env, "/api/arguments/" + argumentId + "/replies", secondInit, "POST", {
    body: "The sixty-first reply must be rate limited."
  });
  assert.equal(replyLimit.response.status, 429);

  for (let number = 0; number < 9; number++) {
    const createdReport = await api(env, "/api/reports", secondInit, "POST", {
      target_type: "argument", target_id: additionalArgumentIds[number], reason: "Independent review", details: "Synthetic rate-limit coverage."
    });
    assert.equal(createdReport.response.status, 201);
  }
  const reportLimit = await api(env, "/api/reports", secondInit, "POST", {
    target_type: "court", target_id: courtId, reason: "Independent review", details: "The eleventh report must be rate limited."
  });
  assert.equal(reportLimit.response.status, 429);

  const firstNotifications = await api(env, "/api/notifications", firstInit);
  assert.ok(firstNotifications.data.notifications.some(item => item.type === "new_reply" && item.reference_id === argumentId));
  const secondNotifications = await api(env, "/api/notifications", secondInit);

  env.DB.prepare("INSERT INTO admin_setup_authorizations (id,expires_at) VALUES (1,datetime('now','+10 minutes'))").run();
  env.DB.prepare("INSERT INTO admin_users (id,email,password_salt,password_hash,password_iterations) VALUES (1,?,?,?,?)")
    .bind("admin@settlethis.test", "0123456789abcdef0123456789abcdef", "test-hash", 100000)
    .run();
  env.DB.prepare("INSERT INTO user_restrictions (user_id,status,reason,updated_by) VALUES (?,?,?,?)")
    .bind(String(secondUser.id), "restricted", "Repeated abusive posting in this integration test.", 1)
    .run();

  const blockedReply = await api(env, "/api/arguments/" + argumentId + "/replies", secondInit, "POST", {
    body: "This reply must be blocked while the account is restricted."
  });
  assert.equal(blockedReply.response.status, 403);
  const blockedReaction = await api(env, "/api/reactions", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reaction: "fire"
  });
  assert.equal(blockedReaction.response.status, 403);

  env.DB.prepare("UPDATE court_arguments SET moderation_status='hidden' WHERE id=?").bind(argumentId).run();
  const hiddenReplies = await api(env, "/api/arguments/" + argumentId + "/replies", firstInit);
  assert.equal(hiddenReplies.response.status, 200);
  assert.equal(hiddenReplies.data.replies.length, 0);
  const hiddenReaction = await api(env, "/api/reactions", firstInit, "POST", {
    target_type: "argument", target_id: argumentId, reaction: "insightful"
  });
  assert.equal(hiddenReaction.response.status, 404);
  const hiddenReport = await api(env, "/api/reports", secondInit, "POST", {
    target_type: "argument", target_id: argumentId, reason: "Hidden content", details: "A hidden argument should no longer accept a new report."
  });
  assert.equal(hiddenReport.response.status, 404);
});
