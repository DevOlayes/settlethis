-- The current Mystery Footballer is a five-question multiple-choice game.
-- Remove unused fields from the retired clue-based format and the old daily cap.
CREATE TABLE mystery_game_settings_current (
  id INTEGER PRIMARY KEY CHECK(id=1),
  entry_easy_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_easy_ct BETWEEN 0 AND 100000),
  entry_medium_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_medium_ct BETWEEN 0 AND 100000),
  entry_hard_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_hard_ct BETWEEN 0 AND 100000),
  reward_easy_sethis INTEGER NOT NULL DEFAULT 130 CHECK(reward_easy_sethis BETWEEN 0 AND 100000),
  reward_medium_sethis INTEGER NOT NULL DEFAULT 200 CHECK(reward_medium_sethis BETWEEN 0 AND 100000),
  reward_hard_sethis INTEGER NOT NULL DEFAULT 500 CHECK(reward_hard_sethis BETWEEN 0 AND 100000),
  question_count INTEGER NOT NULL DEFAULT 5 CHECK(question_count=5),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO mystery_game_settings_current (
  id,entry_easy_ct,entry_medium_ct,entry_hard_ct,
  reward_easy_sethis,reward_medium_sethis,reward_hard_sethis,
  question_count,updated_at
)
SELECT
  id,entry_easy_ct,entry_medium_ct,entry_hard_ct,
  reward_easy_sethis,reward_medium_sethis,reward_hard_sethis,
  5,updated_at
FROM mystery_game_settings;

DROP TABLE mystery_game_settings;
ALTER TABLE mystery_game_settings_current RENAME TO mystery_game_settings;
