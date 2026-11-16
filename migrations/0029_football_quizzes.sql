PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS football_quizzes (
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 5 AND 140),
 description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 0 AND 600),
 quiz_type TEXT NOT NULL CHECK(quiz_type IN ('daily','fixture')),
 fixture_id TEXT REFERENCES fixtures(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed','archived')),
 opens_at TEXT NOT NULL,
 closes_at TEXT NOT NULL,
 reward_amount INTEGER NOT NULL DEFAULT 0 CHECK(reward_amount BETWEEN 0 AND 100000),
 pass_mark INTEGER NOT NULL DEFAULT 100 CHECK(pass_mark BETWEEN 1 AND 100),
 created_by INTEGER NOT NULL REFERENCES admin_users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(julianday(closes_at)>julianday(opens_at)),
 CHECK((quiz_type='daily' AND fixture_id IS NULL) OR (quiz_type='fixture' AND fixture_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS quiz_questions (
 id TEXT PRIMARY KEY,
 quiz_id TEXT NOT NULL REFERENCES football_quizzes(id) ON DELETE CASCADE,
 question_text TEXT NOT NULL CHECK(length(trim(question_text)) BETWEEN 5 AND 500),
 question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice','true_false')),
 explanation TEXT NOT NULL DEFAULT '' CHECK(length(explanation)<=600),
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 19),
 UNIQUE(quiz_id,position),
 UNIQUE(id,quiz_id)
);
CREATE TABLE IF NOT EXISTS quiz_options (
 id TEXT PRIMARY KEY,
 question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
 option_text TEXT NOT NULL CHECK(length(trim(option_text)) BETWEEN 1 AND 160),
 is_correct INTEGER NOT NULL DEFAULT 0 CHECK(is_correct IN (0,1)),
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 5),
 UNIQUE(question_id,position),
 UNIQUE(id,question_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_one_correct_answer ON quiz_options(question_id) WHERE is_correct=1;
CREATE TABLE IF NOT EXISTS quiz_attempts (
 id TEXT PRIMARY KEY,
 quiz_id TEXT NOT NULL REFERENCES football_quizzes(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
 correct_answers INTEGER NOT NULL CHECK(correct_answers>=0),
 total_questions INTEGER NOT NULL CHECK(total_questions BETWEEN 1 AND 20),
 reward_amount INTEGER NOT NULL DEFAULT 0 CHECK(reward_amount>=0),
 reward_ledger_key TEXT UNIQUE,
 submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(quiz_id,user_id)
);
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
 id TEXT PRIMARY KEY,
 attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
 question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
 option_id TEXT NOT NULL,
 is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
 UNIQUE(attempt_id,question_id),
 FOREIGN KEY(option_id,question_id) REFERENCES quiz_options(id,question_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_football_quizzes_status_window ON football_quizzes(status,opens_at,closes_at);
CREATE INDEX IF NOT EXISTS idx_football_quizzes_fixture ON football_quizzes(fixture_id,status);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id,submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
