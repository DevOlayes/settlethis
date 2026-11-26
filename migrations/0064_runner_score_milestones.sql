-- Keep the existing SETHIS performance rewards aligned with the new 700-points-per-475-metres scale.
-- Only migrate untouched defaults; preserve any reward thresholds an admin has already customised.
UPDATE runner_reward_settings
SET points_threshold_one = 600,
    points_threshold_two = 1200
WHERE id = 1
  AND points_threshold_one = 5000
  AND points_threshold_two = 10000;
