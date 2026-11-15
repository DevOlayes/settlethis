import assert from "node:assert/strict";
import test from "node:test";
import { allocatePoolPrize } from "../src/settlement.ts";

const positions = [
  { id: "p1", user_id: "101", stake_ct: 200 },
  { id: "p2", user_id: "102", stake_ct: 300 }
];

test("allocates a prize exactly in proportion to CT stakes", () => {
  const result = allocatePoolPrize(1000, positions);
  assert.equal(result.totalStake, 500);
  assert.deepEqual(result.payouts.map(p => p.amount), [400, 600]);
  assert.equal(result.payouts.reduce((sum, p) => sum + p.amount, 0), 1000);
});

test("distributes indivisible remainder deterministically", () => {
  const result = allocatePoolPrize(10, [
    { id: "c", user_id: "103", stake_ct: 1 },
    { id: "a", user_id: "101", stake_ct: 1 },
    { id: "b", user_id: "102", stake_ct: 1 }
  ]);
  assert.deepEqual(result.payouts.map(p => p.amount), [3, 4, 3]);
  assert.equal(result.payouts.reduce((sum, p) => sum + p.amount, 0), 10);
});

test("supports positions receiving zero when the prize is smaller than the winner count", () => {
  const result = allocatePoolPrize(2, [
    { id: "a", user_id: "101", stake_ct: 1 },
    { id: "b", user_id: "102", stake_ct: 1 },
    { id: "c", user_id: "103", stake_ct: 1 }
  ]);
  assert.deepEqual(result.payouts.map(p => p.amount), [1, 1, 0]);
  assert.equal(result.payouts.filter(p => p.amount > 0).length, 2);
  assert.equal(result.payouts.reduce((sum, p) => sum + p.amount, 0), 2);
});

test("rejects invalid prizes, stakes, empty winners and duplicate users", () => {
  assert.throws(() => allocatePoolPrize(0, positions));
  assert.throws(() => allocatePoolPrize(100, []));
  assert.throws(() => allocatePoolPrize(100, [{ id: "x", user_id: "1", stake_ct: 0 }]));
  assert.throws(() => allocatePoolPrize(100, [
    { id: "x", user_id: "1", stake_ct: 10 },
    { id: "y", user_id: "1", stake_ct: 20 }
  ]));
});
