-- Replace the legacy clue-and-guess flow with daily, difficulty-based question sets.
ALTER TABLE mystery_game_settings ADD COLUMN entry_easy_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_easy_ct BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN entry_medium_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_medium_ct BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN entry_hard_ct INTEGER NOT NULL DEFAULT 300 CHECK(entry_hard_ct BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_easy_sethis INTEGER NOT NULL DEFAULT 130 CHECK(reward_easy_sethis BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_medium_sethis INTEGER NOT NULL DEFAULT 200 CHECK(reward_medium_sethis BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_hard_sethis INTEGER NOT NULL DEFAULT 500 CHECK(reward_hard_sethis BETWEEN 0 AND 100000);
ALTER TABLE mystery_game_settings ADD COLUMN question_count INTEGER NOT NULL DEFAULT 5 CHECK(question_count BETWEEN 3 AND 20);

CREATE TABLE IF NOT EXISTS mystery_questions (
  id TEXT PRIMARY KEY,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  category TEXT NOT NULL CHECK(length(trim(category)) BETWEEN 2 AND 60),
  question_text TEXT NOT NULL CHECK(length(trim(question_text)) BETWEEN 10 AND 500),
  option_a TEXT NOT NULL CHECK(length(trim(option_a)) BETWEEN 1 AND 160),
  option_b TEXT NOT NULL CHECK(length(trim(option_b)) BETWEEN 1 AND 160),
  option_c TEXT NOT NULL CHECK(length(trim(option_c)) BETWEEN 1 AND 160),
  option_d TEXT NOT NULL CHECK(length(trim(option_d)) BETWEEN 1 AND 160),
  correct_option TEXT NOT NULL CHECK(correct_option IN ('a','b','c','d')),
  explanation TEXT NOT NULL DEFAULT '' CHECK(length(explanation)<=800),
  source_label TEXT NOT NULL CHECK(length(trim(source_label)) BETWEEN 2 AND 120),
  source_url TEXT NOT NULL CHECK(length(trim(source_url)) BETWEEN 8 AND 500),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK(usage_count>=0),
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mystery_questions_rotation ON mystery_questions(difficulty,active,usage_count,last_used_at);

CREATE TABLE IF NOT EXISTS mystery_question_sets (
  id TEXT PRIMARY KEY,
  set_date TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  question_count INTEGER NOT NULL CHECK(question_count BETWEEN 3 AND 20),
  entry_ct INTEGER NOT NULL CHECK(entry_ct>=0),
  reward_sethis INTEGER NOT NULL CHECK(reward_sethis>=0),
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(set_date,difficulty)
);
CREATE TABLE IF NOT EXISTS mystery_question_set_items (
  set_id TEXT NOT NULL REFERENCES mystery_question_sets(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES mystery_questions(id),
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 20),
  PRIMARY KEY(set_id,question_id),
  UNIQUE(set_id,position)
);
CREATE TABLE IF NOT EXISTS mystery_question_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  set_id TEXT NOT NULL REFERENCES mystery_question_sets(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','won','lost','expired')),
  current_position INTEGER NOT NULL DEFAULT 1 CHECK(current_position BETWEEN 1 AND 20),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK(correct_answers>=0),
  total_questions INTEGER NOT NULL CHECK(total_questions BETWEEN 3 AND 20),
  entry_ct INTEGER NOT NULL CHECK(entry_ct>=0),
  reward_sethis INTEGER NOT NULL CHECK(reward_sethis>=0),
  reward_ledger_key TEXT UNIQUE,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  UNIQUE(user_id,set_id)
);
CREATE INDEX IF NOT EXISTS idx_mystery_attempts_user ON mystery_question_attempts(user_id,started_at DESC);
CREATE TABLE IF NOT EXISTS mystery_question_attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES mystery_question_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES mystery_questions(id),
  selected_option TEXT NOT NULL CHECK(selected_option IN ('a','b','c','d')),
  is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
  answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id,question_id)
);
