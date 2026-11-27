import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { monetagWalletCreditSql, parseMonetagPostback } from "../src/monetag.ts";

test("maps the Home valued event to 100 CT", () => {
  const result = parseMonetagPostback({ymid:"home-event-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"home_ct"},"12269852");
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.value,{eventId:"home-event-1",userId:"123456789",zoneId:"12269852",placement:"home_ct",token:"CT",amount:100,balanceField:"ct_balance",idempotencyKey:"monetag:home-event-1"});
});

test("maps the Tasks valued event to 150 SETHIS", () => {
  const result = parseMonetagPostback({ymid:"tasks-event-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"tasks_sethis"},"12269852");
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.value,{eventId:"tasks-event-1",userId:"123456789",zoneId:"12269852",placement:"tasks_sethis",token:"SETHIS",amount:150,balanceField:"sethis_balance",idempotencyKey:"monetag:tasks-event-1"});
});

test("maps the Football Runner lobby bonus to 100 GT", () => {
  const result = parseMonetagPostback({ymid:"runner-lobby-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"runner_lobby_gt"},"12269852");
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.value,{eventId:"runner-lobby-1",userId:"123456789",zoneId:"12269852",placement:"runner_lobby_gt",token:"CT",amount:100,balanceField:"ct_balance",idempotencyKey:"monetag:runner-lobby-1"});
});

test("maps the Football Runner completed-run bonus to 2 SETHIS", () => {
  const event="runner_run_12345678-1234-1234-1234-123456789abc_1_abcdef123456";
  const result = parseMonetagPostback({ymid:event,reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"runner_run_sethis"},"12269852");
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.value,{eventId:event,userId:"123456789",zoneId:"12269852",placement:"runner_run_sethis",token:"SETHIS",amount:2,balanceField:"sethis_balance",idempotencyKey:"monetag:"+event});
});

test("rejects non-valued events and malformed event or Telegram IDs", () => {
  assert.equal(parseMonetagPostback({ymid:"event-1",reward_event_type:"non_valued",telegram_id:"123456789",zone_id:"12269852",request_var:"home_ct"},"12269852").ok,false);
  assert.equal(parseMonetagPostback({ymid:"bad id",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"home_ct"},"12269852").ok,false);
  assert.equal(parseMonetagPostback({ymid:"event-1",reward_event_type:"valued",telegram_id:"123",zone_id:"12269852",request_var:"home_ct"},"12269852").ok,false);
});

test("rejects an unrecognised or missing main zone and unknown placement", () => {
  assert.equal(parseMonetagPostback({ymid:"event-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"other",request_var:"home_ct"},"12269852").ok,false);
  assert.equal(parseMonetagPostback({ymid:"event-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"other"},"12269852").ok,false);
  assert.equal(parseMonetagPostback({ymid:"event-1",reward_event_type:"valued",telegram_id:"123456789",zone_id:"12269852",request_var:"home_ct"},"").ok,false);
});

test("credits a valued Monetag event once even when the same callback races or replays", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE wallets (user_id TEXT PRIMARY KEY, ct_balance INTEGER NOT NULL DEFAULT 0, sethis_balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT);
    CREATE TABLE wallet_ledger (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, amount INTEGER NOT NULL, idempotency_key TEXT NOT NULL UNIQUE);
    CREATE TABLE ad_reward_events (provider_event_id TEXT PRIMARY KEY, telegram_user_id TEXT NOT NULL);
    INSERT INTO wallets(user_id,ct_balance,sethis_balance) VALUES('123456789',0,0);
    INSERT INTO wallet_ledger(id,user_id,token,amount,idempotency_key) VALUES('ledger-1','123456789','CT',100,'monetag:event-1');
  `);
  const sql = monetagWalletCreditSql("ct_balance");
  const params = [100, "123456789", "monetag:event-1", "123456789", "CT", 100, "event-1"];
  const first = db.prepare(sql).run(...params);
  assert.equal(Number(first.changes), 1);
  db.prepare("INSERT INTO ad_reward_events(provider_event_id,telegram_user_id) VALUES(?,?)").run("event-1", "123456789");
  const duplicate = db.prepare(sql).run(...params);
  assert.equal(Number(duplicate.changes), 0);
  assert.equal(db.prepare("SELECT ct_balance FROM wallets WHERE user_id=?").get("123456789").ct_balance, 100);
  db.close();
});

test("does not credit without the matching ledger row or for an existing event", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE wallets (user_id TEXT PRIMARY KEY, ct_balance INTEGER NOT NULL DEFAULT 0, sethis_balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT);
    CREATE TABLE wallet_ledger (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, amount INTEGER NOT NULL, idempotency_key TEXT NOT NULL UNIQUE);
    CREATE TABLE ad_reward_events (provider_event_id TEXT PRIMARY KEY, telegram_user_id TEXT NOT NULL);
    INSERT INTO wallets(user_id,ct_balance,sethis_balance) VALUES('123456789',0,0);
    INSERT INTO wallet_ledger(id,user_id,token,amount,idempotency_key) VALUES('ledger-1','123456789','SETHIS',150,'monetag:event-1');
    INSERT INTO ad_reward_events(provider_event_id,telegram_user_id) VALUES('event-1','123456789');
  `);
  const sql = monetagWalletCreditSql("sethis_balance");
  assert.equal(Number(db.prepare(sql).run(150, "123456789", "monetag:event-1", "123456789", "SETHIS", 150, "event-1").changes), 0);
  assert.equal(Number(db.prepare(sql).run(150, "123456789", "monetag:event-2", "123456789", "SETHIS", 150, "event-2").changes), 0);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id=?").get("123456789").sethis_balance, 0);
  db.close();
});

test("rejects a balance column outside the two wallet token balances", () => {
  assert.throws(() => monetagWalletCreditSql("email"), /Unsupported wallet balance field/);
});
