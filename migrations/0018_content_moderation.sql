ALTER TABLE court_arguments ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'visible' CHECK (moderation_status IN ('visible','hidden','removed'));
ALTER TABLE court_replies ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'visible' CHECK (moderation_status IN ('visible','hidden','removed'));
ALTER TABLE courts ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'visible' CHECK (moderation_status IN ('visible','hidden','removed'));
