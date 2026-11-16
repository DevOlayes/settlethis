ALTER TABLE fixtures ADD COLUMN live_minute INTEGER CHECK(live_minute IS NULL OR live_minute BETWEEN 0 AND 130);
