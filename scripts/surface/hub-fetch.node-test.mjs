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
    return new Response(body, { status });
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

const entry = "https://huggingface.co/datasets/csoai/fixture/resolve/main/items.jsonl";
const offline = { env: {}, home: "/nonexistent", wait: noWait };

test("untrusted entry URLs are refused before token lookup or any request", async () => {
  for (const url of ["http://huggingface.co/x", "https://other.invalid/x",
    "https://huggingface.co.evil.invalid/x", "https://huggingface.co:8443/x",
    "https://user:password@huggingface.co/x", "file:///tmp/bank", "not a URL"]) {
    let called = false;
    const env = new Proxy({}, { get() { throw new Error("Token lookup must not occur"); } });
    await assert.rejects(fetchText(url, { ...offline, env,
      fetchImpl: async () => { called = true; return new Response("unwanted"); } }),
    /Hub URL|HTTPS/);
    assert.equal(called, false, url);
  }
});

test("same-origin and CDN redirects preserve bytes but bind credentials only to HF", async () => {
  const calls = [];
  const text = await fetchText(entry, { ...offline, env: { HF_TOKEN: "synthetic-test-only" },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (calls.length === 1) return new Response(null, { status: 302, headers: { location: "/api/resolve-cache/fixture" } });
      if (calls.length === 2) return new Response(null, { status: 307, headers: { location: "https://cdn-fixture.invalid/file?signed=synthetic-query" } });
      return new Response("public bank bytes");
    } });
  assert.equal(text, "public bank bytes");
  assert.equal(calls[0].init.headers.Authorization, "Bearer synthetic-test-only");
  assert.equal(calls[1].init.headers.Authorization, "Bearer synthetic-test-only");
  assert.equal(calls[2].init.headers.Authorization, undefined);
  assert.ok(calls.every(({ init }) => init.redirect === "manual" && init.signal));
});

test("redirects refuse downgrades, embedded credentials, absent locations and loops", async () => {
  for (const location of ["http://other.invalid/file", "https://user:password@other.invalid/file", null]) {
    let calls = 0;
    await assert.rejects(fetchText(entry, { ...offline, fetchImpl: async () => {
      calls++;
      return new Response(null, { status: 302, headers: location ? { location } : {} });
    } }), /HTTPS|location/);
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(fetchText(entry, { ...offline, fetchImpl: async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: entry } });
  } }), /redirect limit/);
  assert.equal(calls, 6);
});

test("attempt and deadline options cannot remove their finite bounds", async () => {
  for (const bounds of [{ attempts: 0 }, { attempts: Infinity }, { attempts: 5 },
    { attempts: 1.5 }, { timeoutMs: 0 }, { timeoutMs: Infinity }, { timeoutMs: 60001 }]) {
    let calls = 0;
    await assert.rejects(fetchText(entry, { ...offline, ...bounds, fetchImpl: async () => {
      calls++; return new Response("unwanted");
    } }), /bound/);
    assert.equal(calls, 0);
  }
});

test("the request deadline rejects even when a fetch stub ignores abort", { timeout: 1000 }, async () => {
  let signal;
  await assert.rejects(fetchText(entry, { ...offline, timeoutMs: 15,
    fetchImpl: async (_, init) => { signal = init.signal; return new Promise(() => {}); } }), /timed out/);
  assert.equal(signal.aborted, true);
});

test("the same deadline covers a stalled body and cancels its locked reader", { timeout: 1000 }, async () => {
  let cancelled = 0, signal;
  await assert.rejects(fetchText(entry, { ...offline, timeoutMs: 15,
    fetchImpl: async (_, init) => {
      signal = init.signal;
      return new Response(new ReadableStream({ cancel() { cancelled++; } }));
    } }), /timed out/);
  assert.equal(signal.aborted, true);
  assert.equal(cancelled, 1);
});

test("a response arriving after timeout is cancelled rather than followed", { timeout: 1000 }, async () => {
  let resolveLate, cancelled = 0, calls = 0;
  const result = fetchText(entry, { ...offline, timeoutMs: 15,
    fetchImpl: async () => { calls++; return new Promise(resolve => { resolveLate = resolve; }); } });
  await assert.rejects(result, /timed out/);
  resolveLate(new Response(new ReadableStream({ cancel() { cancelled++; } }), {
    status: 302, headers: { location: "https://late-fixture.invalid/file" },
  }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(cancelled, 1);
});

test("retry, terminal-error and redirect bodies are cancelled", async () => {
  for (const status of [429, 500, 404, 302]) {
    let calls = 0, cancelled = 0;
    const invoke = fetchText(entry, { ...offline, fetchImpl: async () => {
      calls++;
      if (calls > 1) return new Response("BANK BYTES");
      return new Response(new ReadableStream({ cancel() { cancelled++; } }), {
        status, headers: status === 302 ? { location: "/redirect-target" } : {},
      });
    } });
    if (status === 404) await assert.rejects(invoke, /HTTP 404/);
    else assert.equal(await invoke, "BANK BYTES");
    assert.equal(cancelled, 1, `status ${status}`);
  }
});

test("a stalled cancellation cannot stall retry or deadline cleanup", { timeout: 1000 }, async () => {
  let calls = 0;
  const text = await fetchText(entry, { ...offline, fetchImpl: async () => {
    calls++;
    return calls === 1 ? { ok: false, status: 429, body: { cancel: () => new Promise(() => {}) } } : new Response("BANK BYTES");
  } });
  assert.equal(text, "BANK BYTES");
  assert.equal(calls, 2);
});

test("query strings and underlying fetch error text do not leak into diagnostics", async () => {
  const warnings = [], original = console.warn;
  console.warn = message => warnings.push(message);
  try {
    await assert.rejects(fetchText(entry + "?signed=synthetic-private-query", { ...offline,
      fetchImpl: async () => new Response("no", { status: 429 }) }), error =>
      !error.message.includes("synthetic-private-query") && /HTTP 429/.test(error.message));
    await assert.rejects(fetchText(entry, { ...offline, fetchImpl: async () => {
      throw new Error("https://cdn-fixture.invalid/?signed=synthetic-private-query");
    } }), error => error.message === "Hub request failed");
    assert.ok(warnings.every(message => !message.includes("synthetic-private-query")));
  } finally { console.warn = original; }
});

test("streamed UTF-8 bank text is unchanged across chunk boundaries", async () => {
  const bytes = new TextEncoder().encode('{"item":"café 🎯"}\n');
  const text = await fetchText(entry, { ...offline, fetchImpl: async () => new Response(new ReadableStream({
    start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); },
  })) });
  assert.equal(text, '{"item":"café 🎯"}\n');
});
