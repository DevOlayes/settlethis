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
  reward_credited_at TEXT,
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


-- Starter bank: five fact-checked questions per difficulty, sourced from governing bodies and clubs.
INSERT OR IGNORE INTO mystery_questions(id,difficulty,category,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,source_label,source_url) VALUES
('mfq-e-001','easy','Rules','According to IFAB Law 3, how many players can each team have on the field at the start of a match?','Nine','Ten','Eleven','Twelve','c','A standard team may have a maximum of eleven players on the field, including the goalkeeper.','IFAB Law 3','https://www.theifab.com/laws/latest/the-players/'),
('mfq-e-002','easy','World Cup','Which nation won the 2022 FIFA World Cup?','France','Argentina','Brazil','Croatia','b','Argentina defeated France in the final and won the 2022 tournament.','FIFA World Cup Qatar 2022','https://www.fifa.com/tournaments/mens/worldcup/qatar2022'),
('mfq-e-003','easy','World Cup history','Which country hosted and won the inaugural FIFA World Cup in 1930?','Uruguay','Italy','Brazil','Argentina','a','Uruguay hosted the first FIFA World Cup and defeated Argentina in the final.','FIFA 1930 World Cup','https://www.fifa.com/en/tournaments/mens/worldcup/uruguay-1930'),
('mfq-e-004','easy','Clubs and stadiums','Which stadium is the home of Liverpool Football Club?','Old Trafford','Goodison Park','Stamford Bridge','Anfield','d','Anfield is the home stadium of Liverpool Football Club.','Liverpool FC — Anfield','https://www.liverpoolfc.com/anfield'),
('mfq-e-005','easy','World Cup','Which country won the 2010 FIFA World Cup?','Netherlands','Spain','Germany','Uruguay','b','Spain won the 2010 final against the Netherlands after extra time.','FIFA World Cup winners','https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain'),
('mfq-m-001','medium','Premier League history','Who scored the first goal in Premier League history?','Brian Deane','Alan Shearer','Eric Cantona','Teddy Sheringham','a','Brian Deane scored for Sheffield United against Manchester United on 15 August 1992.','Premier League history','https://www.premierleague.com/en/news/59518'),
('mfq-m-002','medium','European competitions','Which club won the 2012 UEFA Champions League final?','Bayern Munich','Barcelona','Real Madrid','Chelsea','d','Chelsea beat Bayern Munich on penalties after the final finished 1–1.','UEFA Champions League 2012 final','https://www.uefa.com/uefachampionsleague/match/2007693--bayern-vs-chelsea/'),
('mfq-m-003','medium','Premier League history','Which club became the first to win three consecutive Premier League titles?','Arsenal','Chelsea','Manchester United','Liverpool','c','Manchester United became the first club to win three consecutive Premier League titles in 2000/01.','Premier League 2000/01 season review','https://www.premierleague.com/en/news/693625'),
('mfq-m-004','medium','European Cup history','Who scored the winning goal for Real Madrid in the first European Cup final in 1956?','Alfredo Di Stéfano','Héctor Rial','Francisco Gento','Ferenc Puskás','b','Héctor Rial scored the winning goal as Real Madrid beat Stade de Reims 4–3.','UEFA 1955/56 final','https://www.uefa.com/uefachampionsleague/news/0258-0e6a0359223b-d180c4119f8e-1000--1955-56-madrid-claim-first-crown/'),
('mfq-m-005','medium','World Cup history','Which country became the first African nation to host the FIFA World Cup?','Egypt','Nigeria','South Africa','Morocco','c','South Africa hosted the 2010 FIFA World Cup, the first edition held in Africa.','FIFA South Africa 2010','https://inside.fifa.com/tournaments/mens/worldcup/2010south-africa/news/video-vault-tshabalala-opens-south-africa-2010-with-a-bang-2921847'),
('mfq-h-001','hard','Champions League records','Who scored the fastest goal in a UEFA Champions League final?','Paolo Maldini','Cristiano Ronaldo','Steven Gerrard','Filippo Inzaghi','a','Paolo Maldini scored for AC Milan against Liverpool in the 2005 final after approximately 51 seconds.','UEFA Champions League final records','https://www.uefa.com/uefachampionsleague/news/0252-0e98c715bb79-dea77f56e2bd-1000--champions-league-final-records-and-statistics/'),
('mfq-h-002','hard','European Cup records','Which player is the only one to have won the European Cup with three different clubs?','Paolo Maldini','Clarence Seedorf','Cristiano Ronaldo','Samuel Eto’o','b','Clarence Seedorf won the European Cup with Ajax, Real Madrid and AC Milan.','UEFA Champions League final facts','https://www.uefa.com/uefachampionsleague/news/025a-0ea7bd148aee-d58743bef67f-1000--uefa-champions-league-final-facts-and-figures/'),
('mfq-h-003','hard','Champions League records','Who is the youngest scorer in a UEFA Champions League or European Cup final?','Lionel Messi','Raúl González','Patrick Kluivert','Kylian Mbappé','c','Patrick Kluivert scored in the 1995 final at 18 years and 327 days.','UEFA Champions League final records','https://www.uefa.com/uefachampionsleague/news/0252-0e98c715bb79-dea77f56e2bd-1000--champions-league-final-records-and-statistics/'),
('mfq-h-004','hard','Champions League history','Which goalkeeper saved Andriy Shevchenko’s decisive penalty in the 2005 Champions League final shoot-out?','Dida','Petr Čech','Manuel Neuer','Jerzy Dudek','d','Jerzy Dudek saved Shevchenko’s final penalty to secure Liverpool’s shoot-out victory over AC Milan.','UEFA Liverpool triumph in Turkey','https://www.uefa.com/uefachampionsleague/news/0250-0c50f2820ac1-0d73022c807f-1000--liverpool-triumph-in-turkey/'),
('mfq-h-005','hard','European Cup history','How many goals did Ferenc Puskás score in the 1960 European Cup final?','Four','Three','Two','Five','a','Puskás scored four goals in Real Madrid’s 7–3 victory over Eintracht Frankfurt.','UEFA European Cup final records','https://www.uefa.com/uefachampionsleague/news/025a-0ea7bd148aee-d58743bef67f-1000--uefa-champions-league-final-facts-and-figures/');
