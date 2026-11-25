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

  const runnerConfig = await api(env, "/api/runner/config", firstInit);
  assert.equal(runnerConfig.response.status, 200);
  assert.equal(runnerConfig.data.access_mode, "daily_access");
  assert.equal(runnerConfig.data.entry_ct, 500);
  assert.equal(runnerConfig.data.rewards_enabled, true);

  const runnerBefore = await api(env, "/api/runner/records", firstInit);
  assert.equal(runnerBefore.response.status, 200);
  assert.equal(runnerBefore.data.records.totalRuns, 0);

  const runnerStart = await api(env, "/api/runner/start", firstInit, "POST", {});
  assert.equal(runnerStart.response.status, 201);
  assert.ok(runnerStart.data.run_id);
  env.testDb.prepare("UPDATE runner_game_runs SET started_at=datetime('now','-10 seconds') WHERE id=?")
    .run(runnerStart.data.run_id);
  const runnerFinish = await api(env, "/api/runner/finish", firstInit, "POST", {
    run_id: runnerStart.data.run_id, distance: 100, points: 1200, footballs: 0
  });
  assert.equal(runnerFinish.response.status, 200);
  assert.equal(runnerFinish.data.saved, true);
  assert.equal(runnerFinish.data.records.bestDistance, 100);
  assert.equal(runnerFinish.data.rewards_enabled, true);
  assert.equal(runnerFinish.data.sethis_reward, 0);
  const duplicateRunnerFinish = await api(env, "/api/runner/finish", firstInit, "POST", {
    run_id: runnerStart.data.run_id, distance: 100, points: 1200, footballs: 0
  });
  assert.equal(duplicateRunnerFinish.response.status, 409);
  const runnerWallet = await api(env, "/api/wallet", firstInit);
  assert.equal(runnerWallet.data.wallet.ct_balance, 3000);
  assert.equal(runnerWallet.data.wallet.sethis_balance, 0);
  const repeatRunnerStart = await api(env, "/api/runner/start", firstInit, "POST", {});
  assert.equal(repeatRunnerStart.response.status, 201);
  assert.equal(repeatRunnerStart.data.daily_access_unlocked, true);
  env.testDb.prepare("UPDATE runner_game_runs SET started_at=datetime('now','-10 seconds') WHERE id=?").run(repeatRunnerStart.data.run_id);
  const repeatRunnerFinish = await api(env, "/api/runner/finish", firstInit, "POST", { run_id: repeatRunnerStart.data.run_id, distance: 100, points: 1200, footballs: 0 });
  assert.equal(repeatRunnerFinish.response.status, 200);
  const walletAfterRepeatRun = await api(env, "/api/wallet", firstInit);
  assert.equal(walletAfterRepeatRun.data.wallet.ct_balance, 3000, "repeat runs must not charge another daily access fee");
  const unauthenticatedRunnerRecords = await worker.fetch(new Request("https://settlethis.test/api/runner/records"), env);
  assert.equal(unauthenticatedRunnerRecords.status, 401);

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
  assert.ok(referralCode.data.invite_link.includes("?start=ref_"));

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

  for (let step = 1; step <= 4; step++) {
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
    for (let step = 1; step <= 4; step++) {
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
  assert.equal(firstReferralSummary.data.reward, 750); // next milestone reward after the 500 SETHIS first tier
  assert.equal(firstReferralSummary.data.rewards[0].amount, 500);
  const inviterWallet = await api(env, "/api/wallet", firstInit);
  assert.equal(inviterWallet.data.wallet.sethis_balance, 500);

  const firstProfileAfterSecondSignIn = await api(env, "/api/profile", firstInit);
  assert.equal(firstProfileAfterSecondSignIn.data.profile.club, "Chelsea");

  const secondProfileSaved = await api(env, "/api/profile", secondInit, "PUT", {
    club: "Arsenal", country: "Ghana", bio: "North London."
  });
  assert.equal(secondProfileSaved.response.status, 200);
  const firstProfileStillIsolated = await api(env, "/api/profile", firstInit);
  assert.equal(firstProfileStillIsolated.data.profile.club, "Chelsea");
  assert.equal(firstProfileStillIsolated.data.profile.country, "Nigeria");

  const longBioSave = await api(env, "/api/profile", firstInit, "PUT", {
    club: "Chelsea", country: "Nigeria", bio: "A".repeat(200)
  });
  assert.equal(longBioSave.response.status, 200);
  const boundedBio = await api(env, "/api/profile", firstInit);
  assert.equal(boundedBio.data.profile.bio.length, 160);

  const unauthenticatedProfile = await worker.fetch(new Request("https://settlethis.test/api/profile"), env);
  assert.equal(unauthenticatedProfile.status, 401);

  const thirdUser = { id: 700003, first_name: "Guest", username: "guest_fan" };
  const thirdInit = signedInitData(thirdUser);
  const thirdSignIn = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ initData: thirdInit })
  }), env);
  assert.equal(thirdSignIn.status, 200);

  const courtId = "court-community-integration";
  await env.DB.prepare("INSERT INTO courts (id,title,category,incident_context,side_a_label,side_a_argument,side_b_label,side_b_argument,status,closes_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
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

  const memberProfile = await api(env, "/api/profile", firstInit);
  assert.equal(memberProfile.response.status, 200);
  assert.equal(memberProfile.data.activity.games_played, 0);
  assert.equal(memberProfile.data.activity.sethis_earned, 500);
  assert.equal(memberProfile.data.rank, null);
  assert.equal(memberProfile.data.achievements.find(item => item.key === "first_mystery").earned, false);
  assert.equal(memberProfile.data.achievements.find(item => item.key === "game_regular").earned, false);

  const secondMemberProfile = await api(env, "/api/profile", secondInit);
  assert.equal(secondMemberProfile.data.activity.games_played, 0);
  assert.equal(secondMemberProfile.data.activity.sethis_earned, 0);

  const replyReaction = await api(env, "/api/reactions", firstInit, "POST", {
    target_type: "reply", target_id: reply.data.reply_id, reaction: "insightful"
  });
  assert.equal(replyReaction.response.status, 200);
  const replyReactionCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM court_reactions WHERE target_type='reply' AND target_id=? AND telegram_user_id=?")
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
  const reactionCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM court_reactions WHERE target_type='argument' AND target_id=? AND telegram_user_id=?")
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
  const replyReport = await api(env, "/api/reports", firstInit, "POST", { target_type: "reply", target_id: reply.data.reply_id, reason: "Abusive reply" });
  assert.equal(replyReport.response.status, 201);
  const courtReport = await api(env, "/api/reports", firstInit, "POST", { target_type: "court", target_id: courtId, reason: "Misleading Court context" });
  assert.equal(courtReport.response.status, 201);

  const immediateFirstNotifications = await api(env, "/api/notifications", firstInit);
  assert.equal(immediateFirstNotifications.data.notifications.some(item => item.type === "reaction" && item.reference_id === argumentId), false);
  const immediateSecondNotifications = await api(env, "/api/notifications", secondInit);
  assert.equal(immediateSecondNotifications.data.notifications.some(item => item.type === "new_argument" && item.reference_id === courtId), false);

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
  assert.equal(firstNotifications.data.notifications.some(item => item.type === "new_reply" && item.reference_id === argumentId), false);
  const secondNotifications = await api(env, "/api/notifications", secondInit);
  const secondUserNotification = secondNotifications.data.notifications.find(item => item.type === "wallet_credit");
  assert.ok(secondUserNotification);
  const crossAccountRead = await api(env, "/api/notifications/" + secondUserNotification.id + "/read", firstInit, "POST", {});
  assert.equal(crossAccountRead.response.status, 200);
  const secondNotificationsAfterCrossAccountRead = await api(env, "/api/notifications", secondInit);
  assert.equal(secondNotificationsAfterCrossAccountRead.data.notifications.find(item => item.id === secondUserNotification.id).read_at, null);

  await env.DB.prepare("INSERT INTO admin_setup_authorizations (id,expires_at) VALUES (1,datetime('now','+10 minutes'))").run();
  await env.DB.prepare("INSERT INTO admin_users (id,email,password_salt,password_hash,password_iterations) VALUES (1,?,?,?,?)")
    .bind("admin@settlethis.test", "0123456789abcdef0123456789abcdef", "test-hash", 100000)
    .run();
  const adminToken = "a".repeat(64);
  const adminTokenHash = createHash("sha256").update(adminToken).digest("hex");
  env.testDb.prepare("INSERT INTO admin_sessions (token_hash,admin_id,expires_at) VALUES (?,1,datetime('now','+10 minutes'))").run(adminTokenHash);
  await env.DB.prepare("INSERT INTO user_restrictions (user_id,status,reason,updated_by) VALUES (?,?,?,?)")
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

  await env.DB.prepare("UPDATE court_arguments SET moderation_status='hidden' WHERE id=?").bind(argumentId).run();
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

  const contentModerated = await adminApi(env, "/api/admin/moderation/" + report.data.report_id + "/content", adminToken, "POST", { action: "hidden" });
  assert.equal(contentModerated.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT status FROM moderation_reports WHERE id=?").get(report.data.report_id).status, "actioned");
  const reopenedContentReport = await adminApi(env, "/api/admin/moderation/" + report.data.report_id + "/review", adminToken, "POST", { status: "dismissed", note: "This report must remain closed." });
  assert.equal(reopenedContentReport.response.status, 409);
  const restoredContent = await adminApi(env, "/api/admin/moderation/" + report.data.report_id + "/content", adminToken, "POST", { action: "visible" });
  assert.equal(restoredContent.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT moderation_status FROM court_arguments WHERE id=?").get(argumentId).moderation_status, "visible");

  const userReport = await api(env, "/api/reports", firstInit, "POST", {
    target_type: "user", target_id: "@arsenal_fan", reason: "Abusive conduct", details: "A report against this member for moderator review."
  });
  assert.equal(userReport.response.status, 201);
  const suspendedMember = await adminApi(env, "/api/admin/users/" + secondUser.id + "/restriction", adminToken, "POST", {
    status: "suspended", reason: "Repeated abusive conduct reviewed by an administrator.", report_id: userReport.data.report_id
  });
  assert.equal(suspendedMember.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT status FROM moderation_reports WHERE id=?").get(userReport.data.report_id).status, "actioned");
  const reopenedUserReport = await adminApi(env, "/api/admin/moderation/" + userReport.data.report_id + "/review", adminToken, "POST", { status: "reviewing", note: "Should not reopen." });
  assert.equal(reopenedUserReport.response.status, 409);
  const restoredMember = await adminApi(env, "/api/admin/users/" + secondUser.id + "/restriction", adminToken, "POST", {
    status: "active", reason: "Restoring member after moderator review.", report_id: userReport.data.report_id
  });
  assert.equal(restoredMember.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT status FROM user_restrictions WHERE user_id=?").get(String(secondUser.id)).status, "active");

  const healthResponse = await worker.fetch(new Request("https://settlethis.test/api/health"), env);
  assert.equal(healthResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(healthResponse.headers.get("x-frame-options"), "DENY");
  assert.equal(healthResponse.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(healthResponse.headers.get("strict-transport-security"), /max-age=31536000/);
  const assetResponse = await worker.fetch(new Request("https://settlethis.test/"), env);
  assert.equal(assetResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(assetResponse.headers.get("x-frame-options"), "DENY");
  assert.match(assetResponse.headers.get("content-security-policy-report-only"), /script-src 'self'.*https:\/\/yoszi\.com/);

  const walletAudit = await adminApi(env, "/api/admin/wallet-audit", adminToken);
  assert.equal(walletAudit.response.status, 200);
  assert.equal(walletAudit.data.checks.length, 37);
  assert.equal(walletAudit.data.healthy, true, JSON.stringify(walletAudit.data.checks.filter(item => item.issues > 0)));

  const unauthenticatedDestinations = await adminApi(env, "/api/admin/task-destinations", "b".repeat(64));
  assert.equal(unauthenticatedDestinations.response.status, 401);
  const initialDestinations = await adminApi(env, "/api/admin/task-destinations", adminToken);
  assert.equal(initialDestinations.response.status, 200);
  assert.equal(initialDestinations.data.destinations.length, 3);
  const wrongPlatform = await adminApi(env, "/api/admin/task-destinations", adminToken, "POST", {
    destinations: { telegram_channel: "https://www.facebook.com/not-a-telegram-link" }
  });
  assert.equal(wrongPlatform.response.status, 400);
  env.testDb.prepare("UPDATE task_catalog SET destination_url=? WHERE task_key='telegram_channel'").run("https://www.facebook.com/not-telegram");
  const mismatchedStoredDestination = await api(env, "/api/tasks/telegram_channel/claim", firstInit, "POST", { evidence: "https://example.com/proof" });
  assert.equal(mismatchedStoredDestination.response.status, 409);
  const savedDestinations = await adminApi(env, "/api/admin/task-destinations", adminToken, "POST", {
    destinations: {
      telegram_channel: "https://t.me/settlethis_test",
      facebook_follow: "https://www.facebook.com/settlethis_test",
      whatsapp_community: "https://chat.whatsapp.com/AbCdEf123456"
    }
  });
  assert.equal(savedDestinations.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT destination_url FROM task_catalog WHERE task_key='telegram_channel'").get().destination_url, "https://t.me/settlethis_test");
  const officialTaskClaim = await api(env, "/api/tasks/telegram_channel/claim", firstInit, "POST", { evidence: "https://example.com/telegram-follow-proof" });
  assert.equal(officialTaskClaim.response.status, 200);
  const clearedDestinations = await adminApi(env, "/api/admin/task-destinations", adminToken, "POST", {
    destinations: { telegram_channel: "", facebook_follow: "", whatsapp_community: "" }
  });
  assert.equal(clearedDestinations.response.status, 200);
  assert.equal(env.testDb.prepare("SELECT COUNT(*) AS n FROM task_catalog WHERE task_key IN ('telegram_channel','facebook_follow','whatsapp_community') AND destination_url IS NOT NULL").get().n, 0);

  const crossOriginAdminWrite = await worker.fetch(new Request("https://settlethis.test/api/admin/task-destinations", {
    method: "POST", headers: { cookie: "st_admin=" + adminToken, origin: "https://attacker.test", "content-type": "application/json" },
    body: JSON.stringify({ destinations: { telegram_channel: "https://t.me/attacker" } })
  }), env);
  assert.equal(crossOriginAdminWrite.status, 403);
  for (let attempt = 0; attempt < 5; attempt++) {
    const failedLogin = await adminApi(env, "/api/admin/login", adminToken, "POST", { email: "unknown@example.invalid", password: "incorrect" });
    assert.equal(failedLogin.response.status, 401);
  }
  const throttledLogin = await adminApi(env, "/api/admin/login", adminToken, "POST", { email: "unknown@example.invalid", password: "incorrect" });
  assert.equal(throttledLogin.response.status, 429);

  env.testDb.prepare("INSERT INTO pool_courts(id,title,prize_amount,minimum_stake_ct,duration_days,status,opens_at,closes_at,reserve_status) VALUES(?,?,?,?,?,'open',datetime('now','-1 minute'),datetime('now','+1 day'),'secured')").run("pool-invite-rate-test","Invite rate test",10000,500,7);
  env.testDb.prepare("INSERT INTO pool_positions(id,pool_id,user_id,side,stake_ct,status) VALUES(?,?,?,?,?,'active')").run("pool-invite-position","pool-invite-rate-test",String(firstUser.id),"A",500);
  for (let invite = 0; invite < 5; invite++) {
    const createdInvite = await api(env, "/api/pool-court/pool-invite-rate-test/invites", firstInit, "POST", { side: "A" });
    assert.equal(createdInvite.response.status, 200);
  }
  const sixthInvite = await api(env, "/api/pool-court/pool-invite-rate-test/invites", firstInit, "POST", { side: "A" });
  assert.equal(sixthInvite.response.status, 429);
  assert.equal(env.testDb.prepare("SELECT COUNT(*) AS n FROM pool_invites WHERE pool_id=? AND inviter_user_id=?").get("pool-invite-rate-test", String(firstUser.id)).n, 5);

  const poolInviteCode = env.testDb.prepare("SELECT invite_code FROM pool_invites WHERE pool_id=? AND inviter_user_id=? ORDER BY created_at LIMIT 1").get("pool-invite-rate-test", String(firstUser.id)).invite_code;
  env.testDb.prepare("UPDATE pool_invites SET invite_code=lower(invite_code) WHERE invite_code=?").run(poolInviteCode);
  // Use a fresh identity, separate from the three referral-qualification fixtures.
  const poolInviteUser = { id: 700004, first_name: "Liverpool", username: "liverpool_pool_fan" };
  const thirdPoolInit = signedInitData(poolInviteUser, { start_param: "pool_" + poolInviteCode });
  const thirdAuthResponse = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initData: thirdPoolInit })
  }), env);
  const thirdAuth = await thirdAuthResponse.json();
  assert.equal(thirdAuthResponse.status, 200);
  assert.equal(thirdAuth.pool_invite.pool_id, "pool-invite-rate-test");
  assert.equal(thirdAuth.pool_invite.side, "A");
  assert.equal(env.testDb.prepare("SELECT COUNT(*) AS n FROM pool_invite_acceptances WHERE invite_id=(SELECT id FROM pool_invites WHERE invite_code=lower(?)) AND invitee_user_id=?").get(poolInviteCode, String(poolInviteUser.id)).n, 1);
  const replayedPoolAuth = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initData: thirdPoolInit })
  }), env);
  assert.equal(replayedPoolAuth.status, 200);
  assert.equal(env.testDb.prepare("SELECT COUNT(*) AS n FROM pool_invite_acceptances WHERE invite_id=(SELECT id FROM pool_invites WHERE invite_code=lower(?)) AND invitee_user_id=?").get(poolInviteCode, String(poolInviteUser.id)).n, 1);
  const selfPoolInit = signedInitData(firstUser, { start_param: "pool_" + poolInviteCode });
  const selfPoolResponse = await worker.fetch(new Request("https://settlethis.test/api/telegram/auth", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initData: selfPoolInit })
  }), env);
  const selfPoolAuth = await selfPoolResponse.json();
  assert.equal(selfPoolResponse.status, 200);
  assert.equal(selfPoolAuth.pool_invite, null);
  const invalidBotEnv = { ...env, TELEGRAM_BOT_USERNAME: "attacker.example/path" };
  const invalidBotReferral = await api(invalidBotEnv, "/api/referrals", firstInit);
  assert.equal(invalidBotReferral.response.status, 200);
  assert.equal(invalidBotReferral.data.invite_link, null);
  const invalidBotPoolInvite = await api(invalidBotEnv, "/api/pool-court/pool-invite-rate-test/invites", firstInit, "POST", { side: "A" });
  assert.equal(invalidBotPoolInvite.response.status, 503);
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
  assert.equal(statusAt29.data.ads_today, 30); // one real credit plus 29 seeded records
  assert.equal(statusAt29.data.remaining_today, 0);

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
