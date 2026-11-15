ALTER TABLE court_suggestions ADD COLUMN court_kind TEXT NOT NULL DEFAULT 'regular' CHECK (court_kind IN ('regular','pool'));
ALTER TABLE court_suggestions ADD COLUMN pool_prize_amount INTEGER;
ALTER TABLE court_suggestions ADD COLUMN pool_minimum_stake_ct INTEGER;
ALTER TABLE court_suggestions ADD COLUMN pool_duration_days INTEGER;
