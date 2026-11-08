#!/usr/bin/env node
/**
 * hf-mirror-gate.node-test.mjs — the HF mirror gate must tell a MISSING file from a
 * FAILED READ.
 *
 * WHY. On 2026-11-07T10:35:43Z the gate failed PR #4063 with
 *
 *     x cards: HF mirror MISSING (001e8bd830605eb1.json -> ERROR)
 *     x interop/ots: HF mirror MISSING (_invalid-2026-09-16/README.md -> ERROR)
 *
 * Six minutes later every one of the six probed URLs returned 200. The two "missing"
 * directories were present the whole time -- the READS had failed. The request was
 * anonymous, and an anonymous request to huggingface.co is rate-limited far more
 * aggressively than an authenticated one.
 *
 * A gate that reports a failed read as a finding about the files is a gate that cries
 * wolf, and a crying wolf gets disabled. This test pins the three states OFFLINE with a
 * stubbed fetch, so a 429 and a 404 can be produced on demand and the distinction
 * cannot rot.
 *
 *   node --test scripts/surface/hf-mirror-gate.node-test.mjs
 *
 * No network, no deps.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyStatus, decide, probe } from "../hf-mirror-gate.mjs";

/** A fetch stub that answers with the given statuses in order, then repeats the last. */
function stubFetch(statuses) {
  const seen = [];
  const impl = async (url) => {
    seen.push(url);
    const status = statuses[Math.min(seen.length - 1, statuses.length - 1)];
    if (typeof status === "number") return { status };
    throw status; // an Error instance means the request itself failed
  };
  impl.seen = seen;
  return impl;
}

const URL = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/cards/x.json";

test("a 404 is MISSING and a 429 is not", () => {
  assert.equal(classifyStatus(404), "MISSING");
  assert.equal(classifyStatus(429), "UNCHECKABLE");
  assert.equal(classifyStatus(500), "UNCHECKABLE");
  assert.equal(classifyStatus(503), "UNCHECKABLE");
  assert.equal(classifyStatus(403), "UNCHECKABLE");
  assert.equal(classifyStatus("TIMEOUT"), "UNCHECKABLE");
  assert.equal(classifyStatus("ERROR"), "UNCHECKABLE");
});

test("the verified statuses stay verified", () => {
  for (const status of [200, 301, 302, 307]) assert.equal(classifyStatus(status), "VERIFIED");
});

test("CONTROL: a 404 is reported MISSING after one attempt, not retried", async () => {
  const fetchImpl = stubFetch([404]);
  const result = await probe(URL, { fetchImpl, wait: async () => {} });
  assert.equal(result.state, "MISSING");
  assert.equal(result.attempts, 1, "a 404 is an answer; retrying it is not honest");
  assert.equal(result.retried, false);
});

test("CONTROL: a 429 is retried and can become VERIFIED", async () => {
  const fetchImpl = stubFetch([429, 429, 200]);
  const result = await probe(URL, { fetchImpl, wait: async () => {} });
  assert.equal(result.state, "VERIFIED");
  assert.equal(result.attempts, 3);
  assert.equal(result.retried, true);
});

test("CONTROL: a 429 that never clears is UNCHECKABLE, never MISSING", async () => {
  const fetchImpl = stubFetch([429]);
  const result = await probe(URL, { fetchImpl, wait: async () => {} });
  assert.equal(result.state, "UNCHECKABLE", "a rate limit is a transport event, not a finding");
  assert.notEqual(result.state, "MISSING");
  assert.equal(result.attempts, 3, "the bounded retry is bounded");
});

test("CONTROL: a network error is UNCHECKABLE, never MISSING", async () => {
  const fetchImpl = stubFetch([new Error("ECONNRESET")]);
  const result = await probe(URL, { fetchImpl, wait: async () => {} });
  assert.equal(result.state, "UNCHECKABLE");
  assert.notEqual(result.state, "MISSING");
});

test("CONTROL: a 5xx is retried", async () => {
  const fetchImpl = stubFetch([503, 200]);
  const result = await probe(URL, { fetchImpl, wait: async () => {} });
  assert.equal(result.state, "VERIFIED");
  assert.equal(result.attempts, 2);
});

test("the token is sent when one is available, and only to huggingface.co", async () => {
  const seen = [];
  const fetchImpl = async (url, opts) => {
    seen.push({ url, headers: opts.headers });
    return { status: 200 };
  };
  await probe(URL, { fetchImpl, token: "hf_secret", wait: async () => {} });
  assert.equal(seen[0].headers.Authorization, "Bearer hf_secret");

  const elsewhere = [];
  const fetchImpl2 = async (url, opts) => {
    elsewhere.push({ url, headers: opts.headers });
    return { status: 200 };
  };
  await probe("https://example.invalid/x", { fetchImpl: fetchImpl2, token: "hf_secret", wait: async () => {} });
  assert.equal(elsewhere[0].headers.Authorization, undefined, "the token must not leave huggingface.co");
});

test("CONTROL: the decision separates MISSING from UNCHECKABLE", () => {
  const allGood = decide([
    { path: "a", state: "VERIFIED" },
    { path: "b", state: "VERIFIED" },
  ]);
  assert.equal(allGood.verdict, "VERIFIED");
  assert.equal(allGood.missing.length, 0);
  assert.equal(allGood.uncheckable.length, 0);

  const oneMissing = decide([
    { path: "a", state: "VERIFIED" },
    { path: "b", state: "MISSING" },
  ]);
  assert.equal(oneMissing.verdict, "MISSING");
  assert.deepEqual(oneMissing.missing, ["b"]);

  const oneUncheckable = decide([
    { path: "a", state: "VERIFIED" },
    { path: "b", state: "UNCHECKABLE" },
  ]);
  assert.equal(oneUncheckable.verdict, "UNCHECKABLE");
  assert.deepEqual(oneUncheckable.missing, [], "an unreadable probe must not be counted as missing");
  assert.deepEqual(oneUncheckable.uncheckable, ["b"]);
});
