export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const damp = (current: number, target: number, response: number, delta: number): number =>
  current + (target - current) * Math.min(1, response * delta);

export const getRunSpeed = (elapsedSeconds: number): number =>
  9 + Math.min(11, elapsedSeconds * 0.085);

export const getDemoReward = (balls: number, distance: number, points: number): number => {
  const distanceBonus = Math.max(0, Math.floor(distance / 500)) * 4;
  const performanceBonus = points >= 10000 ? 8 : points >= 5000 ? 4 : 0;
  return Math.min(1500, Math.round(balls * 5 + distanceBonus + performanceBonus));
};
