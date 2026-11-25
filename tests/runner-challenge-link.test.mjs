import test from "node:test";
import assert from "node:assert/strict";
import { createRunnerChallenge, createRunnerChallengeUrl, decodeRunnerChallenge } from "../src/football-runner/challenges.ts";

test("Runner challenge share URL opens the Telegram Mini App with its score payload",()=>{
  const challenge=createRunnerChallenge({points:12500,distance:1100,balls:8});
  const url=new URL(createRunnerChallengeUrl(challenge,"SettleThisBot"));
  assert.equal(url.hostname,"t.me");
  assert.equal(url.pathname,"/SettleThisBot");
  const startParam=url.searchParams.get("startapp");
  assert.ok(startParam?.startsWith("runner_"));
  const decoded=decodeRunnerChallenge(startParam.slice(7));
  assert.deepEqual(decoded,challenge);
});
