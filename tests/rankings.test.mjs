import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { RANKINGS_SQL } from "../src/rankings.ts";

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE telegram_users (telegram_user_id TEXT PRIMARY KEY, username TEXT, first_name TEXT NOT NULL);
    CREATE TABLE runner_game_runs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, status TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE mystery_question_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, status TEXT NOT NULL, correct_answers INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE wallet_ledger (user_id TEXT, token TEXT, amount INTEGER, transaction_type TEXT);
  `);
  const addUser = db.prepare("INSERT INTO telegram_users(telegram_user_id,username,first_name) VALUES(?,?,?)");
  const addRunner = db.prepare("INSERT INTO runner_game_runs(id,user_id,status,points) VALUES(?,?,'completed',?)");
  const addMystery = db.prepare("INSERT INTO mystery_question_attempts(id,user_id,status,correct_answers) VALUES(?,?,?,?)");
  const addEarned = db.prepare("INSERT INTO wallet_ledger(user_id,token,amount,transaction_type) VALUES(?,'SETHIS',?,?)");
  for (const user of [["u-a","alpha","Alpha"],["u-b","bravo","Bravo"],["u-c","charlie","Charlie"],["u-d","delta","Delta"],["u-f","foxtrot","Foxtrot"],["u-g","golf","Golf"],["u-e","echo","Echo"]]) addUser.run(...user);

  addRunner.run("run-a-1","u-a",1500);
  addMystery.run("mystery-a-win","u-a","won",5);
  addMystery.run("mystery-a-loss","u-a","lost",2);

  addRunner.run("run-b-1","u-b",1400);
  addRunner.run("run-c-1","u-c",1300);
  addMystery.run("mystery-c-win","u-c","won",5);
  addRunner.run("run-f-1","u-f",1300);
  addRunner.run("run-d-1","u-d",1200);
  addRunner.run("run-g-1","u-g",1100);
  addMystery.run("mystery-g-loss","u-g","lost",2);

  addEarned.run("u-a",500,"referral_reward");
  addEarned.run("u-a",130,"mystery_game_reward");
  addEarned.run("u-b",1000,"ad_reward");
  addEarned.run("u-c",200,"mystery_game_reward");
  addEarned.run("u-f",100,"task_reward");
  addEarned.run("u-g",100,"runner_game_reward");
  addEarned.run("u-e",2000,"ad_reward");

  for (let i=1;i<=101;i++) {
    const id="low-"+String(i).padStart(3,"0");
    addUser.run(id,null,"Low "+String(i).padStart(3,"0"));
    addRunner.run("run-"+id,id,1);
  }
  return db;
}

test("ranks Football Runner and Mystery Footballer outcomes using combined game points, wins, win rate and earned SETHIS", () => {
  const db = setup();
  const rows = db.prepare(RANKINGS_SQL).all("");
  assert.deepEqual(rows.slice(0,6).map(row=>row.user_id),["u-a","u-b","u-c","u-f","u-d","u-g"]);
  assert.equal(rows[0].wins,2);
  assert.equal(rows[0].resolved,3);
  assert.equal(rows[0].entries,3);
  assert.equal(rows[0].game_points,1507);
  assert.equal(rows[0].win_rate,67);
  assert.equal(rows[0].sethis_earned,630);
  assert.equal(rows[2].wins,2);
  assert.equal(rows[2].resolved,2);
  assert.equal(rows[2].game_points,1305);
  assert.equal(rows[2].sethis_earned,200);
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
