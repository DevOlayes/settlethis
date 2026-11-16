ALTER TABLE debate_candidates ADD COLUMN competition TEXT;
ALTER TABLE debate_candidates ADD COLUMN home_team TEXT;
ALTER TABLE debate_candidates ADD COLUMN away_team TEXT;
ALTER TABLE debate_candidates ADD COLUMN match_date TEXT;
ALTER TABLE debate_candidates ADD COLUMN data_provider TEXT;

INSERT OR IGNORE INTO debate_source_feeds(id,source_name,feed_url,source_type,enabled,interval_minutes) VALUES
 ('fd-pl','Football Data · Premier League','https://api.football-data.org/v4/competitions/PL/matches','football_api',1,360),
 ('fd-bl1','Football Data · Bundesliga','https://api.football-data.org/v4/competitions/BL1/matches','football_api',1,360),
 ('fd-sa','Football Data · Serie A','https://api.football-data.org/v4/competitions/SA/matches','football_api',1,360),
 ('fd-pd','Football Data · La Liga','https://api.football-data.org/v4/competitions/PD/matches','football_api',1,360),
 ('fd-cl','Football Data · Champions League','https://api.football-data.org/v4/competitions/CL/matches','football_api',1,360),
 ('fd-fl1','Football Data · Ligue 1','https://api.football-data.org/v4/competitions/FL1/matches','football_api',1,360);
