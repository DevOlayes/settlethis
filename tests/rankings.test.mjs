import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { RANKINGS_SQL } from "../src/rankings.ts";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE telegram_users (telegram_user_id TEXT PRIMARY KEY, username TEXT, first_name TEXT NOT NULL);
    CREATE TABLE court_participants (telegram_user_id TEXT, court_id TEXT, side TEXT, status TEXT);
    CREATE TABLE court_adjudications (court_id TEXT PRIMARY KEY, winner_side TEXT);
    CREATE TABLE pool_positions (user_id TEXT, pool_id TEXT, side TEXT, status TEXT);
    CREATE TABLE pool_adjudications (pool_id TEXT PRIMARY KEY, winner_side TEXT);
    CREATE TABLE wallet_ledger (user_id TEXT, token TEXT, amount INTEGER, transaction_type TEXT);
  `);
  const addUser = db.prepare("INSERT INTO telegram_users(telegram_user_id,username,first_name) VALUES(?,?,?)");
  const addCourt = db.prepare("INSERT INTO court_participants(telegram_user_id,court_id,side,status) VALUES(?,?,?,?)");
  const addCourtVerdict = db.prepare("INSERT INTO court_adjudications(court_id,winner_side) VALUES(?,?)");
  const addPool = db.prepare("INSERT INTO pool_positions(user_id,pool_id,side,status) VALUES(?,?,?,?)");
  const addPoolVerdict = db.prepare("INSERT INTO pool_adjudications(pool_id,winner_side) VALUES(?,?)");
  const addEarned = db.prepare("INSERT INTO wallet_ledger(user_id,token,amount,transaction_type) VALUES(?,'SETHIS',?,?)");
  for (const user of [["u-a","alpha","Alpha"],["u-b","bravo","Same"],["u-c","charlie","Charlie"],["u-d","delta","Delta"],["u-f","foxtrot","Same"],["u-e","echo","Echo"],["u-g","golf","Zebra"]]) addUser.run(...user);
  let sequence = 0;
  function court(user, side, winner, status = "settled") {
    const courtId = "court-" + (++sequence);
    addCourt.run(user,courtId,side,status);
    if (status === "settled") addCourtVerdict.run(courtId,winner);
  }
  court("u-a","A","A"); court("u-a","A","A"); court("u-a","B","A"); court("u-a","A","A","active");
  court("u-b","A","A"); court("u-b","A","A");
  court("u-c","A","A"); addPool.run("u-c","pool-c","A","settled"); addPoolVerdict.run("pool-c","A");
  court("u-d","A","A");
  court("u-f","A","A"); court("u-f","A","A");
  court("u-g","A","A"); court("u-g","A","A"); court("u-g","A","A","active");
  court("u-e","A","A","active");
  addEarned.run("u-a",500,"referral_reward"); addEarned.run("u-b",100,"court_reward");
  addEarned.run("u-c",100,"court_reward"); addEarned.run("u-c",100,"pool_prize");
  addEarned.run("u-d",1000,"ad_reward"); addEarned.run("u-f",100,"task_reward"); addEarned.run("u-g",100,"task_reward");
  for (let i=1;i<=101;i++) {
    const id="low-"+String(i).padStart(3,"0");
    addUser.run(id,null,"Low "+String(i).padStart(3,"0"));
    court(id,"A","B");
  }
  return db;
}

test("ranks combined Court and Pool outcomes by wins, win rate, earned SETHIS, entries and stable identity", () => {
  const db = setup();
  const rows = db.prepare(RANKINGS_SQL).all("");
  assert.deepEqual(rows.slice(0,6).map(row=>row.user_id),["u-c","u-g","u-b","u-f","u-a","u-d"]);
  assert.equal(rows[0].wins,2);
  assert.equal(rows[0].resolved,2);
  assert.equal(rows[0].win_rate,100);
  assert.equal(rows[0].sethis_earned,200);
  assert.equal(rows[1].entries,3);
  assert.equal(rows[4].entries,4);
  assert.equal(rows.some(row=>row.user_id==="u-e"),false);
  db.close();
});

test("returns an authenticated member's own rank even when outside the top 100", () => {
  const db = setup();
  const rows = db.prepare(RANKINGS_SQL).all("low-101");
  const mine = rows.find(row=>row.user_id==="low-101");
  assert.ok(mine);
  assert.equal(mine.rank,107);
  assert.equal(rows.length,101);
  db.close();
});
