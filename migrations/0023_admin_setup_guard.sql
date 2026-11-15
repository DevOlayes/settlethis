CREATE TABLE IF NOT EXISTS admin_setup_authorizations (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  expires_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS guard_admin_user_insert
BEFORE INSERT ON admin_users
WHEN NOT EXISTS (
  SELECT 1
  FROM admin_setup_authorizations
  WHERE id = 1
    AND julianday(expires_at) > julianday('now')
)
BEGIN
  SELECT RAISE(ABORT, 'admin setup authorization required');
END;
