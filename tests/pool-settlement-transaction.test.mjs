import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { allocatePoolPrize } from "../src/settlement.ts";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE admin_users (id INTEGER PRIMARY KEY);
    CREATE TABLE pool_courts (
      id TEXT PRIMARY KEY, status TEXT NOT NULL, prize_amount INTEGER NOT NULL,
      winner_side TEXT, verdict TEXT, adjudication_notes TEXT, adjudication_source TEXT,
      adjudicated_by INTEGER REFERENCES admin_users(id), settled_at TEXT
    );
    CREATE TABLE pool_positions (
      id TEXT PRIMARY KEY, pool_id TEXT NOT NULL REFERENCES pool_courts(id),
      user_id TEXT NOT NULL, side TEXT NOT NULL, stake_ct INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(pool_id,user_id)
    );
    CREATE TABLE pool_adjudications (
      id TEXT PRIMARY KEY, pool_id TEXT NOT NULL UNIQUE REFERENCES pool_courts(id),
      admin_id INTEGER NOT NULL REFERENCES admin_users(id), winner_side TEXT NOT NULL,
      verdict TEXT NOT NULL, rationale TEXT NOT NULL, source_url TEXT NOT NULL,
      winner_stake_ct INTEGER NOT NULL, winner_count INTEGER NOT NULL, prize_amount INTEGER NOT NULL
    );
    CREATE TABLE wallets (
      user_id TEXT PRIMARY KEY, ct_balance INTEGER NOT NULL DEFAULT 0,
      sethis_balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT
    );
    CREATE TABLE wallet_ledger (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, amount INTEGER NOT NULL,
      transaction_type TEXT NOT NULL, reference_id TEXT, idempotency_key TEXT NOT NULL UNIQUE
    );
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, reference_id TEXT, event_key TEXT NOT NULL UNIQUE
    );
    INSERT INTO admin_users(id) VALUES(1);
    INSERT INTO pool_courts(id,status,prize_amount) VALUES('pool-1','locked',1000);
    INSERT INTO pool_positions(id,pool_id,user_id,side,stake_ct) VALUES
      ('p-a','pool-1','user-a','A',200),
      ('p-b','pool-1','user-b','A',300),
      ('p-c','pool-1','user-c','B',500);
    INSERT INTO wallets(user_id,ct_balance,sethis_balance) VALUES
      ('user-a',0,0),('user-b',0,0),('user-c',0,0);
  `);
  return db;
}

function settle(db, side, adjudicationId) {
  const poolId = "pool-1", prize = 1000;
  const winners = db.prepare("SELECT id,user_id,stake_ct FROM pool_positions WHERE pool_id=? AND side=? AND status='active' ORDER BY created_at,id").all(poolId, side);
  const allocation = allocatePoolPrize(prize, winners);
  const creditedWinnerCount = allocation.payouts.filter(p => p.amount > 0).length;
  const statements = [
    ["INSERT INTO pool_adjudications(id,pool_id,admin_id,winner_side,verdict,rationale,source_url,winner_stake_ct,winner_count,prize_amount) SELECT ?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM pool_courts WHERE id=? AND status='locked') AND NOT EXISTS(SELECT 1 FROM pool_adjudications WHERE pool_id=?)",
      [adjudicationId,poolId,1,side,"The evidence supports this side.","The recorded evidence and resolution rule support this verdict.","https://example.com/evidence",allocation.totalStake,creditedWinnerCount,prize,poolId,poolId]],
    ["UPDATE pool_courts SET status='settled',winner_side=?,verdict=?,adjudication_notes=?,adjudication_source=?,adjudicated_by=?,settled_at=CURRENT_TIMESTAMP WHERE id=? AND status='locked' AND EXISTS(SELECT 1 FROM pool_adjudications WHERE pool_id=? AND winner_side=?)",
      [side,"The evidence supports this side.","The recorded evidence and resolution rule support this verdict.","https://example.com/evidence",1,poolId,poolId,side]]
  ];
  for (const p of allocation.payouts) {
    if (p.amount > 0) {
      statements.push(["INSERT OR IGNORE INTO wallets(user_id,ct_balance,sethis_balance) VALUES(?,0,0)",[p.user_id]]);
      statements.push(["UPDATE wallets SET sethis_balance=sethis_balance+?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND NOT EXISTS(SELECT 1 FROM wallet_ledger WHERE idempotency_key=?) AND EXISTS(SELECT 1 FROM pool_courts c JOIN pool_adjudications a ON a.pool_id=c.id WHERE c.id=? AND c.status='settled' AND a.winner_side=?)",
        [p.amount,p.user_id,"pool-prize:"+poolId+":"+p.user_id,poolId,side]]);
      statements.push(["INSERT INTO wallet_ledger(id,user_id,token,amount,transaction_type,reference_id,idempotency_key) SELECT ?,?,'SETHIS',?,'pool_prize',?,? WHERE EXISTS(SELECT 1 FROM pool_courts c JOIN pool_adjudications a ON a.pool_id=c.id WHERE c.id=? AND c.status='settled' AND a.winner_side=?)",
        ["ledger-"+p.user_id,p.user_id,p.amount,poolId,"pool-prize:"+poolId+":"+p.user_id,poolId,side]]);
    }
    statements.push(["UPDATE pool_positions SET status='settled' WHERE id=? AND status='active' AND EXISTS(SELECT 1 FROM pool_courts c JOIN pool_adjudications a ON a.pool_id=c.id WHERE c.id=pool_positions.pool_id AND c.status='settled' AND a.winner_side=?)",
      [p.id,side]]);
  }
  statements.push(["UPDATE pool_positions SET status='settled' WHERE pool_id=? AND status='active' AND EXISTS(SELECT 1 FROM pool_courts c JOIN pool_adjudications a ON a.pool_id=c.id WHERE c.id=pool_positions.pool_id AND c.status='settled' AND a.winner_side=?)",
    [poolId,side]]);
  statements.push(["INSERT OR IGNORE INTO notifications(id,user_id,type,title,body,reference_id,event_key) SELECT lower(hex(randomblob(16))),x.user_id,CASE WHEN x.side=? THEN 'pool_won' ELSE 'pool_lost' END,CASE WHEN x.side=? THEN 'Pool Court: prize awarded' ELSE 'Pool Court: verdict recorded' END,CASE WHEN x.side=? THEN 'Your position won. '||(SELECT COALESCE(l.amount,0) FROM wallet_ledger l WHERE l.user_id=x.user_id AND l.reference_id=? AND l.transaction_type='pool_prize')||' SETHIS has been credited.' ELSE 'The winning side was the opposition. Your Pool Court position is settled.' END,?,'pool-verdict:'||?||':'||x.user_id FROM pool_positions x WHERE x.pool_id=? AND EXISTS(SELECT 1 FROM pool_courts c JOIN pool_adjudications a ON a.pool_id=c.id WHERE c.id=x.pool_id AND c.status='settled' AND a.winner_side=?)",
    [side,side,side,poolId,poolId,poolId,poolId,side]]);
  db.exec("BEGIN");
  try {
    for (const [sql, params] of statements) db.prepare(sql).run(...params);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

test("settles a Pool Court proportionally and records every participant outcome", () => {
  const db = setup();
  settle(db, "A", "pool-adjudication-1");
  const pool = db.prepare("SELECT status,winner_side FROM pool_courts WHERE id='pool-1'").get();
  assert.equal(pool.status, "settled");
  assert.equal(pool.winner_side, "A");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-a'").get().sethis_balance, 400);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-b'").get().sethis_balance, 600);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-c'").get().sethis_balance, 0);
  assert.equal(db.prepare("SELECT SUM(amount) AS n FROM wallet_ledger WHERE transaction_type='pool_prize'").get().n, 1000);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pool_positions WHERE status='settled'").get().n, 3);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key LIKE 'pool-verdict:pool-1:%'").get().n, 3);
  db.close();
});

test("prevents repeated or conflicting Pool verdicts from changing the winner or paying twice", () => {
  const db = setup();
  settle(db, "A", "pool-adjudication-1");
  assert.throws(() => settle(db, "A", "pool-adjudication-replay"), /UNIQUE constraint failed/);
  settle(db, "B", "pool-adjudication-conflict");
  const pool = db.prepare("SELECT status,winner_side FROM pool_courts WHERE id='pool-1'").get();
  assert.equal(pool.status, "settled");
  assert.equal(pool.winner_side, "A");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-a'").get().sethis_balance, 400);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-b'").get().sethis_balance, 600);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-c'").get().sethis_balance, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pool_adjudications WHERE pool_id='pool-1'").get().n, 1);
  assert.equal(db.prepare("SELECT SUM(amount) AS n FROM wallet_ledger WHERE transaction_type='pool_prize'").get().n, 1000);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key LIKE 'pool-verdict:pool-1:%'").get().n, 3);
  db.close();
});
