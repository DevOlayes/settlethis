ALTER TABLE court_suggestions ADD COLUMN image_relevance_note TEXT;
ALTER TABLE court_suggestions ADD COLUMN image_review_status TEXT NOT NULL DEFAULT 'none' CHECK (image_review_status IN ('none','pending','verified','rejected'));
ALTER TABLE courts ADD COLUMN image_relevance_note TEXT;
ALTER TABLE pool_courts ADD COLUMN image_relevance_note TEXT;
