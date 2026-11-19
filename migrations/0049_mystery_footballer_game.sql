PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mystery_players (
  id TEXT PRIMARY KEY,
  answer TEXT NOT NULL CHECK(length(trim(answer)) BETWEEN 2 AND 100),
  accepted_answers_json TEXT NOT NULL DEFAULT '[]',
  nationality TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  avatar_key TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mystery_player_clues (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES mystery_players(id) ON DELETE CASCADE,
  clue_number INTEGER NOT NULL CHECK(clue_number BETWEEN 1 AND 3),
  clue_text TEXT NOT NULL CHECK(length(trim(clue_text)) BETWEEN 5 AND 240),
  UNIQUE(player_id,clue_number)
);
CREATE TABLE IF NOT EXISTS mystery_game_rounds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES mystery_players(id),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','won','missed','expired')),
  clue_index INTEGER NOT NULL DEFAULT 1 CHECK(clue_index BETWEEN 1 AND 3),
  guess_count INTEGER NOT NULL DEFAULT 0 CHECK(guess_count BETWEEN 0 AND 3),
  entry_ct INTEGER NOT NULL DEFAULT 100 CHECK(entry_ct>=0),
  points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mystery_one_active_round_per_user
  ON mystery_game_rounds(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_mystery_rounds_user_history
  ON mystery_game_rounds(user_id,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mystery_rounds_leaderboard
  ON mystery_game_rounds(status,points DESC,completed_at);
CREATE TABLE IF NOT EXISTS mystery_game_guesses (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES mystery_game_rounds(id) ON DELETE CASCADE,
  guess_number INTEGER NOT NULL CHECK(guess_number BETWEEN 1 AND 3),
  guess_text TEXT NOT NULL CHECK(length(trim(guess_text)) BETWEEN 1 AND 100),
  is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(round_id,guess_number)
);
CREATE TABLE IF NOT EXISTS mystery_game_presence (
  user_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mystery_game_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  entry_ct INTEGER NOT NULL DEFAULT 100 CHECK(entry_ct BETWEEN 0 AND 100000),
  session_minutes INTEGER NOT NULL DEFAULT 10 CHECK(session_minutes BETWEEN 1 AND 60),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO mystery_game_settings(id,entry_ct,session_minutes) VALUES(1,100,10);
CREATE INDEX IF NOT EXISTS idx_mystery_presence_last_seen ON mystery_game_presence(last_seen_at);




