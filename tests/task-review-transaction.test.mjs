import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { taskApprovalStatements } from "../src/task-review.ts";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE task_claims (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, task_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', reviewed_by TEXT, review_note TEXT,
      reviewed_at TEXT, reward_ledger_key TEXT, UNIQUE(user_id,task_key)
    );
    CREATE TABLE wallets (
      user_id TEXT PRIMARY KEY, ct_balance INTEGER NOT NULL DEFAULT 0,
      sethis_balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT
    );
    CREATE TABLE wallet_ledger (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, amount INTEGER NOT NULL,
      transaction_type TEXT NOT NULL, reference_id TEXT, idempotency_key TEXT NOT NULL UNIQUE,
      grant_source TEXT, grant_reason TEXT, admin_id TEXT
    );
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, reference_id TEXT, event_key TEXT NOT NULL UNIQUE
    );
    INSERT INTO task_claims(id,user_id,task_key,status) VALUES('claim-1','user-1','telegram','pending');
  `);
  return db;
}

function approve(db, adminId = "admin-1") {
  const statements = taskApprovalStatements({
    claimId: "claim-1", userId: "user-1", token: "SETHIS", amount: 150,
    taskKey: "telegram", taskTitle: "Join the official Telegram channel", adminId, note: "Evidence checked.",
    ledgerId: "ledger-" + adminId, notificationId: "notice-" + adminId
  });
  db.exec("BEGIN");
  try {
    for (const statement of statements) db.prepare(statement.sql).run(...statement.params);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function reject(db, adminId = "admin-2") {
  db.prepare("UPDATE task_claims SET status='rejected',reviewed_by=?,review_note='Evidence not sufficient.',reviewed_at=CURRENT_TIMESTAMP WHERE id='claim-1' AND status='pending'").run(adminId);
}

test("credits an approved task exactly once and records its ledger and notification", () => {
  const db = setup();
  approve(db);
  approve(db, "admin-duplicate");
  assert.equal(db.prepare("SELECT status FROM task_claims WHERE id='claim-1'").get().status, "approved");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-1'").get().sethis_balance, 150);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE transaction_type='task_reward'").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key='task-approved:claim-1'").get().n, 1);
  db.close();
});

test("a rejection that wins the race prevents a stale approval from crediting the reward", () => {
  const db = setup();
  reject(db);
  approve(db, "stale-approver");
  assert.equal(db.prepare("SELECT status FROM task_claims WHERE id='claim-1'").get().status, "rejected");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallets").get().n, 1);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-1'").get().sethis_balance, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications").get().n, 0);
  db.close();
});

test("an approval that wins the race cannot be overwritten by a stale rejection", () => {
  const db = setup();
  approve(db);
  reject(db);
  assert.equal(db.prepare("SELECT status FROM task_claims WHERE id='claim-1'").get().status, "approved");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-1'").get().sethis_balance, 150);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger").get().n, 1);
  db.close();
});

test("rejects unsupported reward tokens and invalid amounts", () => {
  assert.throws(() => taskApprovalStatements({claimId:"c",userId:"u",token:"DOGE",amount:1,taskKey:"k",taskTitle:"t",adminId:"a",note:"",ledgerId:"l",notificationId:"n"}), /Unsupported task reward token/);
  assert.throws(() => taskApprovalStatements({claimId:"c",userId:"u",token:"CT",amount:0,taskTitle:"t",adminId:"a",note:"",ledgerId:"l",notificationId:"n"}), /positive safe integer/);
});
