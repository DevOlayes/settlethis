-- Keep the existing SETHIS performance rewards aligned with the new 700-points-per-475-metres scale.
-- Only migrate untouched defaults; preserve any reward thresholds an admin has already customised.
-- Recalculate completed historical points so old 12-points/metre scores do not dominate the new leaderboard.
UPDATE runner_game_runs
SET points = CAST(distance * 700.0 / 475.0 AS INTEGER)
WHERE status = 'completed';

UPDATE runner_reward_settings
SET points_threshold_one = 600,
    points_threshold_two = 1200
WHERE id = 1
  AND points_threshold_one = 5000
  AND points_threshold_two = 10000;
