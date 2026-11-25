-- Country-level audience analytics. Store only Cloudflare's two-letter country code;
-- never persist raw IP addresses or precise location.
ALTER TABLE telegram_users ADD COLUMN country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_telegram_users_country ON telegram_users(country_code);
