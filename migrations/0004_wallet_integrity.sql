-- Wallet balance and ledger integrity indexes for user activity.
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reference ON wallet_ledger(user_id,transaction_type,reference_id);
CREATE INDEX IF NOT EXISTS idx_court_participants_court_side ON court_participants(court_id,side,status);
