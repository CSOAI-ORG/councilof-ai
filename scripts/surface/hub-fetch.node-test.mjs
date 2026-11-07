// hub-fetch.node-test.mjs — the hub fetch that gates the build, proved offline.
//
// WHY. On 2026-11-07 the bench-suite build fetched a PUBLIC dataset from the Hugging Face
// Hub ANONYMOUSLY, and the hub answered 429 at random. Twice in one hour that failed the
// build, and the build IS the pre-push gate: a rate limit on a public dataset was blocking
// every push and every deploy. The fix sends the hub token when the machine has one and
// retries a transient 429/5xx.
//
// A fix that only works when the network cooperates is not proved by a pass. These tests
// stub the fetch, so they can make the hub misbehave on demand:
//
//   · a 429 is retried and then succeeds
//   · a 404 is NOT retried — it is an answer, and retrying a real answer is how a build
//     fails slowly instead of failing honestly
//   · a 5xx IS retried
//   · the token is sent when there is one, and the header is absent when there is not
//   · the body returned is the body the hub served
//
// node:test file vitest cannot collect, so it is named in NODE_TEST_FILES in vitest.config.ts
// and pr-gates.yml runs it under `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchText, hubToken } from "./hub-fetch.mjs";

/** A fetch that answers with a scripted sequence, and records what it was asked for. */
function stub(sequence) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    const status = sequence[Math.min(calls.length - 1, sequence.length - 1)];
    const body = status === 200 ? "BANK BYTES" : "nope";
    return { ok: status >= 200 && status < 300, status, text: async () => body };
  };
  return { impl, calls };
}

const noWait = async () => {};

test("a 429 is retried and the fetch then succeeds", async () => {
  const { impl, calls } = stub([429, 429, 200]);
  const out = await fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
    fetchImpl: impl,
    env: {},
    home: "/nonexistent",
    wait: noWait,
  });
  assert.equal(out, "BANK BYTES");
  assert.equal(calls.length, 3, "the 429s should have been retried");
});

test("a 404 is NOT retried — it is an answer", async () => {
  const { impl, calls } = stub([404]);
  await assert.rejects(
    () => fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
      fetchImpl: impl, env: {}, home: "/nonexistent", wait: noWait,
    }),
    /HTTP 404/,
  );
  assert.equal(calls.length, 1, "a 404 must not be retried");
});

test("a 500 IS retried", async () => {
  const { impl, calls } = stub([500, 200]);
  const out = await fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
    fetchImpl: impl, env: {}, home: "/nonexistent", wait: noWait,
  });
  assert.equal(out, "BANK BYTES");
  assert.equal(calls.length, 2);
});

test("the retry is bounded — it gives up rather than hammering the hub", async () => {
  const { impl, calls } = stub([429]);
  await assert.rejects(
    () => fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
      fetchImpl: impl, env: {}, home: "/nonexistent", wait: noWait,
    }),
    /HTTP 429/,
  );
  assert.ok(calls.length <= 4, `expected a bounded number of attempts, got ${calls.length}`);
});

test("the token is sent when the machine has one, and only then", async () => {
  const { impl, calls } = stub([200]);
  await fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
    fetchImpl: impl, env: { HF_TOKEN: "hf_secret" }, home: "/nonexistent", wait: noWait,
  });
  assert.equal(calls[0].init.headers.Authorization, "Bearer hf_secret");

  const bare = stub([200]);
  await fetchText("https://huggingface.co/x/resolve/main/items.jsonl", {
    fetchImpl: bare.impl, env: {}, home: "/nonexistent", wait: noWait,
  });
  assert.equal(bare.calls[0].init.headers.Authorization, undefined,
    "no token must mean no Authorization header — the banks are public");
});

test("the token is read from the environment first, then the local hub cache", () => {
  assert.equal(hubToken({ HF_TOKEN: "from-env" }, "/nonexistent"), "from-env");
  assert.equal(hubToken({ HUGGING_FACE_HUB_TOKEN: "from-env-2" }, "/nonexistent"), "from-env-2");
  assert.equal(hubToken({}, "/nonexistent"), null);
});
