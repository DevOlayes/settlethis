import { RUNNER_CONFIG, RUNNER_REWARD_DEMO } from "./config";

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const damp = (current: number, target: number, response: number, delta: number): number =>
  current + (target - current) * Math.min(1, response * delta);

export const getRunSpeed = (elapsedSeconds: number): number => {
  const { initialSpeed, maximumSpeed, speedRampPerSecond } = RUNNER_CONFIG.movement;
  return initialSpeed + Math.min(maximumSpeed - initialSpeed, elapsedSeconds * speedRampPerSecond);
};

export type DemoRewardBreakdown = {
  footballReward: number;
  distanceBonus: number;
  performanceBonus: number;
  grossEstimate: number;
};

export const getDemoRewardBreakdown = (
  balls: number,
  distance: number,
  points: number,
): DemoRewardBreakdown => {
  const reward = RUNNER_REWARD_DEMO;
  const safeBalls = Math.max(0, Math.floor(Number.isFinite(balls) ? balls : 0));
  const safeDistance = Math.max(0, Number.isFinite(distance) ? distance : 0);
  const safePoints = Math.max(0, Number.isFinite(points) ? points : 0);
  const footballReward = safeBalls * reward.ballValue;
  const distanceBonus = Math.floor(safeDistance / reward.distanceStep) * reward.distanceBonus;
  const performanceBonus = reward.performanceThresholds.find((tier) => safePoints >= tier.points)?.bonus ?? 0;
  const grossEstimate = Math.min(
    reward.prototypeDisplayCap,
    footballReward + distanceBonus + performanceBonus,
  );
  return { footballReward, distanceBonus, performanceBonus, grossEstimate };
};

export const getDemoReward = (balls: number, distance: number, points: number): number =>
  getDemoRewardBreakdown(balls, distance, points).grossEstimate;
