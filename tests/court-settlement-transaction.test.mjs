import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE admin_users (id INTEGER PRIMARY KEY);
    CREATE TABLE courts (
      id TEXT PRIMARY KEY, status TEXT NOT NULL, winner_reward_sethis INTEGER NOT NULL,
      winner_side TEXT, verdict TEXT, adjudication_notes TEXT, adjudication_source TEXT,
      adjudicated_by INTEGER REFERENCES admin_users(id), settled_at TEXT, updated_at TEXT
    );
    CREATE TABLE court_participants (
      id TEXT PRIMARY KEY, court_id TEXT NOT NULL REFERENCES courts(id),
      telegram_user_id TEXT NOT NULL, side TEXT NOT NULL, entry_ct INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(court_id,telegram_user_id)
    );
    CREATE TABLE court_adjudications (
      id TEXT PRIMARY KEY, court_id TEXT NOT NULL UNIQUE REFERENCES courts(id),
      admin_id INTEGER NOT NULL REFERENCES admin_users(id), winner_side TEXT NOT NULL,
      verdict TEXT NOT NULL, rationale TEXT NOT NULL, source_url TEXT NOT NULL,
      winner_count INTEGER NOT NULL DEFAULT 0, reward_per_winner INTEGER NOT NULL DEFAULT 1550,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    INSERT INTO courts(id,status,winner_reward_sethis) VALUES('court-1','locked',1550);
    INSERT INTO court_participants(id,court_id,telegram_user_id,side,entry_ct) VALUES
      ('pa','court-1','user-a','A',500),('pb','court-1','user-b','B',500);
    INSERT INTO wallets(user_id,ct_balance,sethis_balance) VALUES('user-a',0,0),('user-b',0,0);
  `);
  return db;
}

function settle(db, side, adjudicationId) {
  const reward = 1550, courtId = "court-1", verdict = "The evidence supports this side.", rationale = "The recorded evidence and resolution rule support this verdict.", source = "https://example.com/evidence";
  const winners = db.prepare("SELECT COUNT(*) AS n FROM court_participants WHERE court_id=? AND side=? AND status='active'").get(courtId, side).n;
  const statements = [
    ["INSERT OR IGNORE INTO court_adjudications(id,court_id,admin_id,winner_side,verdict,rationale,source_url,winner_count,reward_per_winner) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM courts WHERE id=? AND status='locked') AND NOT EXISTS(SELECT 1 FROM court_adjudications WHERE court_id=?)",
      [adjudicationId,courtId,1,side,verdict,rationale,source,winners,reward,courtId,courtId]],
    ["UPDATE courts SET status='settled',winner_side=?,verdict=?,adjudication_notes=?,adjudication_source=?,adjudicated_by=?,settled_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='locked' AND EXISTS(SELECT 1 FROM court_adjudications WHERE court_id=? AND winner_side=?)",
      [side,verdict,rationale,source,1,courtId,courtId,side]],
    ["INSERT OR IGNORE INTO wallets(user_id,ct_balance,sethis_balance) SELECT telegram_user_id,0,0 FROM court_participants WHERE court_id=? AND side=? AND status='active'",
      [courtId,side]],
    ["UPDATE wallets SET sethis_balance=sethis_balance+?,updated_at=CURRENT_TIMESTAMP WHERE user_id IN (SELECT telegram_user_id FROM court_participants WHERE court_id=? AND side=? AND status='active') AND NOT EXISTS(SELECT 1 FROM wallet_ledger l WHERE l.idempotency_key='court-settlement:'||?||':'||wallets.user_id) AND EXISTS(SELECT 1 FROM court_adjudications WHERE court_id=? AND winner_side=?)",
      [reward,courtId,side,courtId,courtId,side]],
    ["INSERT OR IGNORE INTO wallet_ledger(id,user_id,token,amount,transaction_type,reference_id,idempotency_key) SELECT lower(hex(randomblob(16))),telegram_user_id,'SETHIS',?,'court_reward',?,'court-settlement:'||?||':'||telegram_user_id FROM court_participants WHERE court_id=? AND side=? AND status='active' AND EXISTS(SELECT 1 FROM court_adjudications WHERE court_id=? AND winner_side=?)",
      [reward,courtId,courtId,courtId,side,courtId,side]],
    ["UPDATE court_participants SET status='settled' WHERE court_id=? AND status='active' AND EXISTS(SELECT 1 FROM court_adjudications WHERE court_id=?)",
      [courtId,courtId]],
    ["INSERT OR IGNORE INTO notifications(id,user_id,type,title,body,reference_id,event_key) SELECT lower(hex(randomblob(16))),p.telegram_user_id,CASE WHEN p.side=? THEN 'court_won' ELSE 'court_lost' END,CASE WHEN p.side=? THEN 'Court verdict: you won' ELSE 'Court verdict recorded' END,CASE WHEN p.side=? THEN 'The editorial verdict backed your position. '||?||' SETHIS has been credited to your wallet.' ELSE 'The editorial verdict went to the opposing position. Your Court entry is now settled.' END,?,'court-verdict:'||?||':'||p.telegram_user_id FROM court_participants p WHERE p.court_id=? AND EXISTS(SELECT 1 FROM courts c JOIN court_adjudications a ON a.court_id=c.id WHERE c.id=p.court_id AND c.status='settled' AND a.winner_side=?)",
      [side,side,side,reward,courtId,courtId,courtId,side]]
  ];
  db.exec("BEGIN");
  try {
    for (const [sql, params] of statements) db.prepare(sql).run(...params);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

test("settles a Regular Court once, credits only the winning side and records both outcomes", () => {
  const db = setup();
  settle(db, "A", "adjudication-1");
  const court = db.prepare("SELECT status,winner_side FROM courts WHERE id='court-1'").get();
  assert.equal(court.status, "settled");
  assert.equal(court.winner_side, "A");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-a'").get().sethis_balance, 1550);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-b'").get().sethis_balance, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE transaction_type='court_reward'").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM court_participants WHERE status='settled'").get().n, 2);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key LIKE 'court-verdict:court-1:%'").get().n, 2);
  db.close();
});

test("makes repeated or conflicting verdict requests unable to pay twice or change the winner", () => {
  const db = setup();
  settle(db, "A", "adjudication-1");
  settle(db, "A", "adjudication-replay");
  settle(db, "B", "adjudication-conflict");
  const finalCourt = db.prepare("SELECT status,winner_side FROM courts WHERE id='court-1'").get();
  assert.equal(finalCourt.status, "settled");
  assert.equal(finalCourt.winner_side, "A");
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-a'").get().sethis_balance, 1550);
  assert.equal(db.prepare("SELECT sethis_balance FROM wallets WHERE user_id='user-b'").get().sethis_balance, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM court_adjudications WHERE court_id='court-1'").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM wallet_ledger WHERE transaction_type='court_reward'").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_key LIKE 'court-verdict:court-1:%'").get().n, 2);
  db.close();
});
