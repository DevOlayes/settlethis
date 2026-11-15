ALTER TABLE telegram_users ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_step BETWEEN 0 AND 7);
