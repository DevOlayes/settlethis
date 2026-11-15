import assert from "node:assert/strict";
import test from "node:test";
import { checkinSummary, lagosDate } from "../src/checkin.ts";

test("Lagos calendar date changes at 23:00 UTC", () => {
  assert.equal(lagosDate(new Date("2026-11-15T22:59:59.000Z")), "2026-11-15");
  assert.equal(lagosDate(new Date("2026-11-15T23:00:00.000Z")), "2026-11-16");
});

test("counts a current streak including today's check-in", () => {
  const result = checkinSummary(
    ["2026-11-15", "2026-11-14", "2026-11-13", "2026-11-10"],
    "2026-11-15"
  );
  assert.equal(result.streak, 3);
  assert.equal(result.checked_in_today, true);
  assert.equal(result.total_checkins, 4);
});

test("keeps the streak alive through yesterday when today is not checked in", () => {
  const result = checkinSummary(
    ["2026-11-14", "2026-11-13", "2026-11-12"],
    "2026-11-15"
  );
  assert.equal(result.streak, 3);
  assert.equal(result.checked_in_today, false);
});

test("breaks a streak at the first missing day and returns exactly seven days", () => {
  const result = checkinSummary(
    ["2026-11-15", "2026-11-13", "2026-11-12"],
    "2026-11-15"
  );
  assert.equal(result.streak, 1);
  assert.deepEqual(result.days.map(day => day.date), [
    "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
    "2026-11-13", "2026-11-14", "2026-11-15"
  ]);
  assert.equal(result.days.length, 7);
});
