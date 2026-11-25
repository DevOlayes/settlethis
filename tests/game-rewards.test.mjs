import test from "node:test";
import assert from "node:assert/strict";
import { calculateRunnerSethisReward, calculateMysterySethisReward } from "../src/game-rewards.ts";

test("Runner reward combines collected balls, distance milestones and one performance bonus",()=>{
  assert.deepEqual(calculateRunnerSethisReward({distance:1200,points:6000,footballs:3,dailyRemaining:300}),{amount:26,football:6,distance:10,performance:10});
});
test("Runner reward respects per-run and remaining daily caps",()=>{
  assert.equal(calculateRunnerSethisReward({distance:10000,points:50000,footballs:100,dailyRemaining:40}).amount,40);
  assert.equal(calculateRunnerSethisReward({distance:10000,points:50000,footballs:100,dailyRemaining:300,settings:{per_run_cap:55}}).amount,55);
});
// Run this suite on main pushes so the uncapped activity policy is checked in CI.
test("Runner reward rejects invalid scores",()=>{
  assert.throws(()=>calculateRunnerSethisReward({distance:-1,points:0,footballs:0,dailyRemaining:10}));
});
test("Mystery rewards vary by difficulty and clue count",()=>{
  assert.equal(calculateMysterySethisReward("easy",1,150),10);
  assert.equal(calculateMysterySethisReward("medium",2,150),14);
  assert.equal(calculateMysterySethisReward("hard",3,150),15);
});
test("Mystery reward respects daily remaining balance",()=>{
  assert.equal(calculateMysterySethisReward("hard",1,4),4);
});

test("Both games stop issuing SETHIS after the daily cap is exhausted",()=>{
  assert.equal(calculateRunnerSethisReward({distance:9000,points:50000,footballs:30,dailyRemaining:0}).amount,0);
  assert.equal(calculateMysterySethisReward("hard",1,0),0);
});

test("configured Mystery Footballer reward values override launch defaults",()=>{
  assert.equal(calculateMysterySethisReward("hard",1,100,{reward_hard_clue1:42}),42);
});

test("Highly active Runner reward settings can remove both per-run and daily ceilings",()=>{
  assert.deepEqual(calculateRunnerSethisReward({distance:12000,points:50000,footballs:40,dailyRemaining:null,settings:{per_run_cap:0}}),{amount:220,football:80,distance:120,performance:20});
});
