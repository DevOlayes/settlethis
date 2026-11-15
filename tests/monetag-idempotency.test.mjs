import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { monetagWalletCreditSql } from "../src/monetag.ts";

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
