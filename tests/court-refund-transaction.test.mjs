import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

function setup(hasAdjudication = false) {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE courts (id TEXT PRIMARY KEY,status TEXT NOT NULL,adjudication_notes TEXT,updated_at TEXT);
    CREATE TABLE court_adjudications (id TEXT PRIMARY KEY,court_id TEXT NOT NULL UNIQUE);
    CREATE TABLE court_participants (id TEXT PRIMARY KEY,court_id TEXT NOT NULL,telegram_user_id TEXT NOT NULL,entry_ct INTEGER NOT NULL,status TEXT NOT NULL);
    CREATE TABLE wallets (user_id TEXT PRIMARY KEY,ct_balance INTEGER NOT NULL DEFAULT 0,sethis_balance INTEGER NOT NULL DEFAULT 0,updated_at TEXT);
    CREATE TABLE wallet_ledger (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token TEXT NOT NULL,amount INTEGER NOT NULL,transaction_type TEXT NOT NULL,reference_id TEXT,idempotency_key TEXT NOT NULL UNIQUE);
    CREATE TABLE notifications (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,type TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,reference_id TEXT,event_key TEXT NOT NULL UNIQUE);
    INSERT INTO courts(id,status) VALUES('court-refund','locked');
    INSERT INTO court_participants(id,court_id,telegram_user_id,entry_ct,status) VALUES('participant-1','court-refund','user-1',500,'active');
    INSERT INTO wallets(user_id,ct_balance,sethis_balance) VALUES('user-1',0,0);
    INSERT INTO wallet_ledger(id,user_id,token,amount,transaction_type,reference_id,idempotency_key) VALUES('entry-1','user-1','CT',-500,'court_entry','court-refund','court-entry:user-1:court-refund');
  `);
  if (hasAdjudication) db.prepare("INSERT INTO court_adjudications(id,court_id) VALUES('adjudication-1','court-refund')").run();
  return db;
}

function cancelAndRefund(db) {
  const key = "court-refund:court-refund:user-1";
  const statements = [
    ["UPDATE courts SET status='cancelled',adjudication_notes='Cancellation reason is long enough for this test.',updated_at=CURRENT_TIMESTAMP WHERE id='court-refund' AND status='locked' AND NOT EXISTS(SELECT 1 FROM court_adjudications WHERE court_id='court-refund')",[]],
    ["INSERT OR IGNORE INTO wallets(user_id,ct_balance,sethis_balance) VALUES('user-1',0,0)",[]],
    ["UPDATE wallets SET ct_balance=ct_balance+500,updated_at=CURRENT_TIMESTAMP WHERE user_id='user-1' AND EXISTS(SELECT 1 FROM courts WHERE id='court-refund' AND status='cancelled') AND EXISTS(SELECT 1 FROM court_participants WHERE id='participant-1' AND status='active') AND NOT EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=?)",[key]],
    ["INSERT OR IGNORE INTO wallet_ledger(id,user_id,token,amount,transaction_type,reference_id,idempotency_key) SELECT 'refund-1','user-1','CT',500,'court_refund','court-refund',? WHERE EXISTS(SELECT 1 FROM courts WHERE id='court-refund' AND status='cancelled') AND EXISTS(SELECT 1 FROM court_participants WHERE id='participant-1' AND status='active')",[key]],
    ["UPDATE court_participants SET status='withdrawn' WHERE id='participant-1' AND status='active' AND EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=? AND user_id='user-1')",[key]],
    ["INSERT OR IGNORE INTO notifications(id,user_id,type,title,body,reference_id,event_key) SELECT 'refund-notice','user-1','court_refunded','Court cancelled · CT returned','500 CT returned.','court-refund',? WHERE EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=? AND user_id='user-1')",[key,key]]
  ];
  db.exec("BEGIN");
  try { for (const [sql,params] of statements) db.prepare(sql).run(...params); db.exec("COMMIT"); }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}

test("refunds a cancelled Regular Court exactly once", () => {
  const db = setup();
  cancelAndRefund(db);
  cancelAndRefund(db);
  assert.equal(db.prepare("SELECT status FROM courts WHERE id='court-refund'").get().status,"cancelled");
  assert.equal(db.prepare("SELECT status FROM court_participants WHERE id='participant-1'").get().status,"withdrawn");
  assert.equal(db.prepare("SELECT ct_balance FROM wallets WHERE user_id='user-1'").get().ct_balance,500);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE transaction_type='court_refund'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key='court-refund:court-refund:user-1'").get().n,1);
  db.close();
});

test("does not refund a Court that already has an immutable adjudication", () => {
  const db = setup(true);
  cancelAndRefund(db);
  assert.equal(db.prepare("SELECT status FROM courts WHERE id='court-refund'").get().status,"locked");
  assert.equal(db.prepare("SELECT status FROM court_participants WHERE id='participant-1'").get().status,"active");
  assert.equal(db.prepare("SELECT ct_balance FROM wallets WHERE user_id='user-1'").get().ct_balance,0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE transaction_type='court_refund'").get().n,0);
  db.close();
});
