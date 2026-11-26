export type RunnerScoreInput = {
  elapsedMs: number;
  distance: number;
  points: number;
  footballs: number;
};

export function validateRunnerScore(input: RunnerScoreInput): boolean {
  const { elapsedMs, distance, points, footballs } = input;
  if (!Number.isSafeInteger(elapsedMs) || elapsedMs < 1500 || elapsedMs > 30 * 60 * 1000) return false;
  if (!Number.isSafeInteger(distance) || distance < 0 || distance > 1_000_000) return false;
  if (!Number.isSafeInteger(points) || points < 0 || points > 100_000_000) return false;
  if (!Number.isSafeInteger(footballs) || footballs < 0 || footballs > 100_000) return false;
  const maximumDistance = Math.floor((elapsedMs / 1000) * 20 + 45);
  const maximumFootballs = Math.floor(distance / 2.5) + 8;
  const expectedPoints = Math.floor(distance * (700 / 475));
  return distance <= maximumDistance
    && footballs <= maximumFootballs
    && points >= expectedPoints - 2
    && points <= expectedPoints + 2;
}
