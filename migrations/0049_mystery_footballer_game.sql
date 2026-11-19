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
CREATE INDEX IF NOT EXISTS idx_mystery_presence_last_seen ON mystery_game_presence(last_seen_at);

INSERT OR IGNORE INTO mystery_players(id,answer,accepted_answers_json,nationality,difficulty,avatar_key) VALUES
('messi','Lionel Messi','["messi","lionel messi","leo messi"]','Argentina','easy','messi'),
('ronaldo','Cristiano Ronaldo','["ronaldo","cristiano ronaldo","cr7"]','Portugal','easy','ronaldo'),
('neymar','Neymar Jr','["neymar","neymar jr","neymar junior","neymar da silva santos junior"]','Brazil','easy','neymar'),
('salah','Mohamed Salah','["salah","mohamed salah","mo salah"]','Egypt','easy','salah'),
('mbappe','Kylian Mbappe','["mbappe","kylian mbappe","kylian mbappé"]','France','easy','mbappe'),
('haaland','Erling Haaland','["haaland","erling haaland"]','Norway','easy','haaland'),
('debruyne','Kevin De Bruyne','["de bruyne","kevin de bruyne","kdb"]','Belgium','medium','debruyne'),
('modric','Luka Modric','["modric","luka modric","luka modrić"]','Croatia','medium','modric'),
('drogba','Didier Drogba','["drogba","didier drogba"]','Ivory Coast','medium','drogba'),
('henry','Thierry Henry','["henry","thierry henry","titi henry"]','France','medium','henry'),
('ronaldinho','Ronaldinho','["ronaldinho","ronaldo de assis moreira"]','Brazil','medium','ronaldinho'),
('zidane','Zinedine Zidane','["zidane","zinedine zidane","zizou"]','France','medium','zidane'),
('rooney','Wayne Rooney','["rooney","wayne rooney"]','England','medium','rooney'),
('ramos','Sergio Ramos','["ramos","sergio ramos"]','Spain','medium','ramos'),
('iniesta','Andres Iniesta','["iniesta","andres iniesta","andrés iniesta"]','Spain','hard','iniesta'),
('mane','Sadio Mane','["mane","sadio mane","sadio mané"]','Senegal','medium','mane'),
('pirlo','Andrea Pirlo','["pirlo","andrea pirlo"]','Italy','hard','pirlo'),
('eto','Samuel Eto’o','["eto","eto'o","samuel eto","samuel eto’o","samuel eto'o"]','Cameroon','hard','eto'),
('kaka','Kaka','["kaka","kaká","ricardo kaka","ricardo kaká"]','Brazil','hard','kaka'),
('vanpersie','Robin van Persie','["van persie","robin van persie","r v p"]','Netherlands','hard','vanpersie');

INSERT OR IGNORE INTO mystery_player_clues(id,player_id,clue_number,clue_text) VALUES
('messi-c1','messi',1,'I was born in Rosario, Argentina.'),
('messi-c2','messi',2,'I spent most of my club career at Barcelona before moving to Paris.'),
('messi-c3','messi',3,'I have won the Ballon d’Or eight times.'),
('ronaldo-c1','ronaldo',1,'I was born on the Portuguese island of Madeira.'),
('ronaldo-c2','ronaldo',2,'I became a global star at Manchester United and Real Madrid.'),
('ronaldo-c3','ronaldo',3,'My famous nickname is CR7.'),
('neymar-c1','neymar',1,'I began my senior career at Santos in Brazil.'),
('neymar-c2','neymar',2,'I formed an attacking trio with Messi and Suarez at Barcelona.'),
('neymar-c3','neymar',3,'I captained Brazil to Olympic football gold in 2016.'),
('salah-c1','salah',1,'I am an Egyptian forward.'),
('salah-c2','salah',2,'I played for Roma before joining Liverpool.'),
('salah-c3','salah',3,'Liverpool fans know me as the Egyptian King.'),
('mbappe-c1','mbappe',1,'I was born in Bondy, France.'),
('mbappe-c2','mbappe',2,'I won the 2018 FIFA World Cup with France as a teenager.'),
('mbappe-c3','mbappe',3,'I moved from Paris Saint-Germain to Real Madrid in 2024.'),
('haaland-c1','haaland',1,'I was born in Leeds, England, but represent Norway.'),
('haaland-c2','haaland',2,'Before Manchester City, I played for Borussia Dortmund.'),
('haaland-c3','haaland',3,'I became the Premier League single-season scoring record holder in 2022–23.'),
('debruyne-c1','debruyne',1,'I am a Belgian midfielder.'),
('debruyne-c2','debruyne',2,'I played in Germany for Wolfsburg before returning to England.'),
('debruyne-c3','debruyne',3,'I became a key playmaker for Manchester City under Pep Guardiola.'),
('modric-c1','modric',1,'I am a Croatian midfielder.'),
('modric-c2','modric',2,'I helped my country reach the 2018 World Cup final.'),
('modric-c3','modric',3,'I won the 2018 Ballon d’Or after a remarkable year with Real Madrid and Croatia.'),
('drogba-c1','drogba',1,'I was born in Ivory Coast.'),
('drogba-c2','drogba',2,'I became a Chelsea legend and scored in the 2012 Champions League final.'),
('drogba-c3','drogba',3,'I scored the decisive penalty in the 2012 Champions League shootout.'),
('henry-c1','henry',1,'I am a French forward who began my professional career at Monaco.'),
('henry-c2','henry',2,'I became Arsenal’s all-time leading goalscorer.'),
('henry-c3','henry',3,'I later won the Champions League with Barcelona in 2009.'),
('ronaldinho-c1','ronaldinho',1,'I am a Brazilian footballer famous for my joyful style and skills.'),
('ronaldinho-c2','ronaldinho',2,'I starred for Barcelona and AC Milan.'),
('ronaldinho-c3','ronaldinho',3,'I won the 2005 Ballon d’Or.'),
('zidane-c1','zidane',1,'I was born in Marseille, France.'),
('zidane-c2','zidane',2,'I won the 1998 World Cup with France.'),
('zidane-c3','zidane',3,'I scored twice in the 1998 World Cup final and later coached Real Madrid.'),
('rooney-c1','rooney',1,'I made my senior breakthrough at Everton as a teenager.'),
('rooney-c2','rooney',2,'I became Manchester United’s all-time leading goalscorer.'),
('rooney-c3','rooney',3,'I captained England and wore number 10 for much of my career.'),
('ramos-c1','ramos',1,'I am a Spanish defender who began at Sevilla.'),
('ramos-c2','ramos',2,'I won four Champions League titles with Real Madrid.'),
('ramos-c3','ramos',3,'I scored a famous late equaliser in the 2014 Champions League final.'),
('iniesta-c1','iniesta',1,'I spent the majority of my career at Barcelona.'),
('iniesta-c2','iniesta',2,'I won the 2010 World Cup with Spain.'),
('iniesta-c3','iniesta',3,'I scored the winning goal in the 2010 World Cup final.'),
('mane-c1','mane',1,'I am a Senegalese forward.'),
('mane-c2','mane',2,'I won the Champions League and Premier League with Liverpool.'),
('mane-c3','mane',3,'I was part of Senegal’s team that won the 2021 Africa Cup of Nations.'),
('pirlo-c1','pirlo',1,'I am an Italian midfielder known for my passing and free kicks.'),
('pirlo-c2','pirlo',2,'I won the World Cup with Italy in 2006.'),
('pirlo-c3','pirlo',3,'I played for both AC Milan and Juventus.'),
('eto-c1','eto',1,'I am a Cameroonian striker.'),
('eto-c2','eto',2,'I won the Champions League with Barcelona and Inter Milan.'),
('eto-c3','eto',3,'I won the Africa Cup of Nations twice with Cameroon.'),
('kaka-c1','kaka',1,'I am a Brazilian attacking midfielder.'),
('kaka-c2','kaka',2,'I won the Champions League with AC Milan in 2007.'),
('kaka-c3','kaka',3,'I won the 2007 Ballon d’Or.'),
('vanpersie-c1','vanpersie',1,'I am a Dutch striker who played for Arsenal and Manchester United.'),
('vanpersie-c2','vanpersie',2,'I won the Premier League title in my first season at Manchester United.'),
('vanpersie-c3','vanpersie',3,'I scored a famous flying header for the Netherlands at the 2014 World Cup.');
