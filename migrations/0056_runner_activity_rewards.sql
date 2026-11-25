-- Activity-based Football Runner reward policy. Players with 10 completed runs in a rolling 7-day window graduate from the starter cap.
ALTER TABLE runner_reward_settings ADD COLUMN active_player_run_threshold INTEGER NOT NULL DEFAULT 10 CHECK(active_player_run_threshold BETWEEN 1 AND 1000);
