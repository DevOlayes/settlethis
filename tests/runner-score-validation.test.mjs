import test from "node:test";
import assert from "node:assert/strict";
import { validateRunnerScore } from "../src/football-runner/score-validation.ts";

test("accepts a score consistent with elapsed time and game scoring", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 10_000, distance: 100, points: 2_200, footballs: 10 }), true);
});

test("allows fractional-distance rounding used by the game engine", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 10_000, distance: 100, points: 2_211, footballs: 10 }), true);
});

test("rejects impossible distance for the server-recorded duration", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 2_000, distance: 500, points: 6_000, footballs: 0 }), false);
});

test("rejects points that do not match distance and football pickups", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 10_000, distance: 100, points: 9_999, footballs: 10 }), false);
});

test("rejects an impossible football collection count", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 30_000, distance: 10, points: 1_200, footballs: 100 }), false);
});

test("rejects sessions outside the allowed duration", () => {
  assert.equal(validateRunnerScore({ elapsedMs: 1_000, distance: 0, points: 0, footballs: 0 }), false);
  assert.equal(validateRunnerScore({ elapsedMs: 1_800_001, distance: 0, points: 0, footballs: 0 }), false);
});
