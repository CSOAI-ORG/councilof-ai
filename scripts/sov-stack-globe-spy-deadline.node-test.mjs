// waitForGlobeDriveReady's deadline, with a fake page: no browser, no network, so it runs in PR CI.
//
// The browser fixture test (sov-stack-globe-spy.node-test.mjs) failed now and then in sov-stack-e2e
// (runs 44869063299, 44915858751, 44971112062) with "TimeoutError: locator.evaluate: Timeout 1ms
// exceeded" where it expects "No parent-origin layer0 readiness message before deadline". Each
// evaluate gets the time left before the deadline, at least 1 ms, and the Playwright timeout escaped
// the loop whenever that budget ran out mid-evaluate. These cases pin the deadline behaviour.
import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForGlobeDriveReady } from "./sov-stack-globe-spy.mjs";

function timeoutError(ms) {
  const error = new Error(`locator.evaluate: Timeout ${ms}ms exceeded.`);
  error.name = "TimeoutError";
  return error;
}

// A page whose globe iframe answers each evaluate with the next scripted outcome.
function fakePage(outcomes) {
  const calls = [];
  const body = {
    evaluate: async (_fn, _arg, options) => {
      calls.push(options?.timeout);
      const next = outcomes.length > 1 ? outcomes.shift() : outcomes[0];
      if (next instanceof Error) throw next;
      return next;
    },
  };
  return {
    calls,
    frameLocator: () => ({ first: () => ({ locator: () => body }) }),
    waitForTimeout: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

test("a locator timeout as the budget runs out reports the missing readiness, not the timeout", async () => {
  const page = fakePage([timeoutError(1)]);
  await assert.rejects(waitForGlobeDriveReady(page, { timeout: 50 }), /No parent-origin layer0 readiness message/);
  assert.ok(page.calls.length >= 1);
  assert.ok(page.calls.every((ms) => ms >= 1 && ms <= 50), `each evaluate stays inside the budget: ${page.calls}`);
});

test("a timeout with time left is retried, and a later readiness message resolves", async () => {
  const page = fakePage([timeoutError(5), false, true]);
  await waitForGlobeDriveReady(page, { timeout: 2000 });
  assert.equal(page.calls.length, 3);
});

test("a real evaluate failure still throws as itself", async () => {
  const page = fakePage([new Error("Target page, context or browser has been closed")]);
  await assert.rejects(waitForGlobeDriveReady(page, { timeout: 2000 }), /Target page, context or browser has been closed/);
});

test("a detached frame is still retried until the deadline", async () => {
  const page = fakePage([new Error("Frame was detached"), true]);
  await waitForGlobeDriveReady(page, { timeout: 2000 });
  assert.equal(page.calls.length, 2);
});
