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

test("breaks equal remainders by larger stake, then stable user ID", () => {
  const result = allocatePoolPrize(2, [
    { id: "small", user_id: "z-user", stake_ct: 1 },
    { id: "large", user_id: "b-user", stake_ct: 2 },
    { id: "same", user_id: "a-user", stake_ct: 1 }
  ]);
  assert.deepEqual(result.payouts.map(p => p.amount), [0, 1, 1]);
  assert.equal(result.payouts.reduce((sum, p) => sum + p.amount, 0), 2);
});

test("conserves the full prize across uneven stakes and multiple winner counts", () => {
  for (const [prize, stakes] of [
    [1, [1, 2, 7]],
    [17, [3, 5, 11, 19]],
    [999, [1, 1, 1, 97]],
    [1000003, [123, 456, 789, 1234, 5678]]
  ]) {
    const rows = stakes.map((stake, index) => ({
      id: "p" + index,
      user_id: "u" + index,
      stake_ct: stake
    }));
    const result = allocatePoolPrize(prize, rows);
    assert.equal(result.payouts.reduce((sum, p) => sum + p.amount, 0), prize);
    assert.ok(result.payouts.every(p => Number.isSafeInteger(p.amount) && p.amount >= 0));
    for (let index = 0; index < rows.length; index++) {
      assert.equal(result.payouts[index].id, rows[index].id);
      assert.equal(result.payouts[index].user_id, rows[index].user_id);
    }
  }
});

test("handles safe-integer prize and stake values without floating-point drift", () => {
  const result = allocatePoolPrize(Number.MAX_SAFE_INTEGER, [
    { id: "a", user_id: "101", stake_ct: 1 },
    { id: "b", user_id: "102", stake_ct: 2 }
  ]);
  assert.equal(result.payouts.reduce((sum, p) => sum + BigInt(p.amount), 0n), BigInt(Number.MAX_SAFE_INTEGER));
});

test("rejects invalid prizes, stakes, empty winners and duplicate users", () => {
  assert.throws(() => allocatePoolPrize(0, positions));
  assert.throws(() => allocatePoolPrize(100, []));
  assert.throws(() => allocatePoolPrize(100, [{ id: "x", user_id: "1", stake_ct: 0 }]));
  assert.throws(() => allocatePoolPrize(100, [
    { id: "x", user_id: "1", stake_ct: 10 },
    { id: "y", user_id: "1", stake_ct: 20 }
  ]));
  assert.throws(() => allocatePoolPrize(Number.MAX_SAFE_INTEGER + 1, positions));
});
