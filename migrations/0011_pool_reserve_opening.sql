ALTER TABLE pool_courts ADD COLUMN reserve_status TEXT NOT NULL DEFAULT 'pending' CHECK (reserve_status IN ('pending','secured','released'));
ALTER TABLE pool_courts ADD COLUMN reserve_reference TEXT;
ALTER TABLE pool_courts ADD COLUMN reserved_at TEXT;
