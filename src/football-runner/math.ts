import { RUNNER_CONFIG, RUNNER_REWARD_DEMO } from "./config";

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const damp = (current: number, target: number, response: number, delta: number): number =>
  current + (target - current) * Math.min(1, response * delta);

export const getRunSpeed = (elapsedSeconds: number): number => {
  const { initialSpeed, maximumSpeed, speedRampPerSecond } = RUNNER_CONFIG.movement;
  return initialSpeed + Math.min(maximumSpeed - initialSpeed, elapsedSeconds * speedRampPerSecond);
};

export const getDemoReward = (balls: number, distance: number, points: number): number => {
  const reward = RUNNER_REWARD_DEMO;
  const distanceBonus = Math.max(0, Math.floor(distance / reward.distanceStep)) * reward.distanceBonus;
  const performanceBonus = reward.performanceThresholds.find((tier) => points >= tier.points)?.bonus ?? 0;
  return Math.min(reward.prototypeDisplayCap, Math.round(balls * reward.ballValue + distanceBonus + performanceBonus));
};
