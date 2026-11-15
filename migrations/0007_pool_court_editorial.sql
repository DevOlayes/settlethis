ALTER TABLE pool_courts ADD COLUMN side_a_label TEXT NOT NULL DEFAULT 'YES';
ALTER TABLE pool_courts ADD COLUMN side_b_label TEXT NOT NULL DEFAULT 'NO';
ALTER TABLE pool_courts ADD COLUMN resolution_method TEXT;
ALTER TABLE pool_courts ADD COLUMN resolution_source TEXT;
ALTER TABLE pool_courts ADD COLUMN evidence_summary TEXT;
ALTER TABLE pool_courts ADD COLUMN hero_image_url TEXT;
ALTER TABLE pool_courts ADD COLUMN image_source_url TEXT;
ALTER TABLE pool_courts ADD COLUMN image_alt TEXT;
