export type RunnerChallengeScore = {
  points: number;
  distance: number;
  balls: number;
};

export type RunnerChallenge = {
  version: 1;
  id: string;
  createdAt: number;
  score: RunnerChallengeScore;
};

export type RunnerChallengeResult = {
  version: 1;
  challenge: RunnerChallenge;
  result: RunnerChallengeScore;
  completedAt: number;
};

const MAX_ENCODED_LENGTH = 1800;
const MAX_POINTS = 100_000_000;
const MAX_DISTANCE = 10_000_000;
const MAX_BALLS = 100_000;

function validScore(value: unknown): value is RunnerChallengeScore {
  if (!value || typeof value !== "object") return false;
  const score = value as Record<string, unknown>;
  return Number.isSafeInteger(score.points) && Number(score.points) >= 0 && Number(score.points) <= MAX_POINTS
    && Number.isSafeInteger(score.distance) && Number(score.distance) >= 0 && Number(score.distance) <= MAX_DISTANCE
    && Number.isSafeInteger(score.balls) && Number(score.balls) >= 0 && Number(score.balls) <= MAX_BALLS;
}

function validChallenge(value: unknown): value is RunnerChallenge {
  if (!value || typeof value !== "object") return false;
  const challenge = value as Record<string, unknown>;
  return challenge.version === 1
    && typeof challenge.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(challenge.id)
    && Number.isSafeInteger(challenge.createdAt) && Number(challenge.createdAt) > 0
    && validScore(challenge.score);
}

function encode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string): unknown {
  if (!value || value.length > MAX_ENCODED_LENGTH || !/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  try { return JSON.parse(atob(padded)); } catch { return null; }
}

export function createRunnerChallenge(score: RunnerChallengeScore): RunnerChallenge {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return { version: 1, id: randomId, createdAt: Date.now(), score: {
    points: Math.max(0, Math.floor(score.points)),
    distance: Math.max(0, Math.floor(score.distance)),
    balls: Math.max(0, Math.floor(score.balls)),
  } };
}

export function encodeRunnerChallenge(challenge: RunnerChallenge): string {
  return encode(challenge);
}

export function decodeRunnerChallenge(value: string | null): RunnerChallenge | null {
  if (!value) return null;
  const parsed = decode(value);
  return validChallenge(parsed) ? parsed : null;
}

export function encodeRunnerChallengeResult(result: RunnerChallengeResult): string {
  return encode(result);
}

export function decodeRunnerChallengeResult(value: string | null): RunnerChallengeResult | null {
  if (!value) return null;
  const parsed = decode(value);
  if (!parsed || typeof parsed !== "object") return null;
  const item = parsed as Record<string, unknown>;
  if (item.version !== 1 || !validChallenge(item.challenge) || !validScore(item.result)
    || !Number.isSafeInteger(item.completedAt) || Number(item.completedAt) <= 0) return null;
  return parsed as RunnerChallengeResult;
}

export function compareRunnerScores(a: RunnerChallengeScore, b: RunnerChallengeScore): number {
  if (a.points !== b.points) return a.points - b.points;
  if (a.distance !== b.distance) return a.distance - b.distance;
  return a.balls - b.balls;
}

export function createRunnerChallengeUrl(challenge: RunnerChallenge): string {
  const url = new URL("/football-runner", window.location.origin);
  url.searchParams.set("challenge", encodeRunnerChallenge(challenge));
  return url.toString();
}

export function createRunnerChallengeResultUrl(result: RunnerChallengeResult): string {
  const url = new URL("/football-runner", window.location.origin);
  url.searchParams.set("challengeResult", encodeRunnerChallengeResult(result));
  return url.toString();
}
