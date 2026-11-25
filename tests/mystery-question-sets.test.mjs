import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

test("Mystery question-set migration creates sourced, difficulty-balanced starter bank",()=>{
  const db=new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec("CREATE TABLE mystery_game_settings(id INTEGER PRIMARY KEY CHECK(id=1),entry_ct INTEGER NOT NULL DEFAULT 100,session_minutes INTEGER NOT NULL DEFAULT 10,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,daily_entry_limit INTEGER NOT NULL DEFAULT 5,reward_easy_clue1 INTEGER NOT NULL DEFAULT 10,reward_easy_clue2 INTEGER NOT NULL DEFAULT 7,reward_easy_clue3 INTEGER NOT NULL DEFAULT 5,reward_medium_clue1 INTEGER NOT NULL DEFAULT 20,reward_medium_clue2 INTEGER NOT NULL DEFAULT 14,reward_medium_clue3 INTEGER NOT NULL DEFAULT 10,reward_hard_clue1 INTEGER NOT NULL DEFAULT 35,reward_hard_clue2 INTEGER NOT NULL DEFAULT 25,reward_hard_clue3 INTEGER NOT NULL DEFAULT 15,daily_sethis_cap INTEGER NOT NULL DEFAULT 150)");
  db.exec("INSERT INTO mystery_game_settings(id) VALUES(1)");
  db.exec("CREATE TABLE telegram_users(telegram_user_id TEXT PRIMARY KEY)");
  const sql=readFileSync(new URL("../migrations/0057_mystery_question_sets.sql",import.meta.url),"utf8");
  db.exec(sql);
  const counts=db.prepare("SELECT difficulty,COUNT(*) AS total FROM mystery_questions GROUP BY difficulty ORDER BY difficulty").all();
  assert.deepEqual(counts.map(x=>[x.difficulty,x.total]),[["easy",5],["hard",5],["medium",5]]);
  const invalid=db.prepare("SELECT COUNT(*) AS total FROM mystery_questions WHERE source_url NOT LIKE 'https://%' OR length(trim(explanation))=0 OR correct_option NOT IN ('a','b','c','d')").get();
  assert.equal(invalid.total,0);
  const settings=db.prepare("SELECT entry_easy_ct,entry_medium_ct,entry_hard_ct,reward_easy_sethis,reward_medium_sethis,reward_hard_sethis,question_count FROM mystery_game_settings WHERE id=1").get();
  assert.deepEqual(Object.values(settings),[300,300,300,130,200,500,5]);
  db.close();
});
