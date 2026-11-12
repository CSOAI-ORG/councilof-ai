// hub-fetch.mjs — one authenticated, retrying fetch for the Hugging Face Hub.
//
// WHY THIS IS A SEPARATE FILE. It is the only network call in the bench-suite build, and it
// is the only thing in that build that can fail for a reason that has nothing to do with the
// tree. On 2026-11-07 it failed the build twice in one hour with an HTTP 429 from a PUBLIC
// dataset, and the build IS the pre-push gate — so a rate limit on the hub was blocking every
// push and every deploy. A gate that fails for an unrelated reason is a gate that cries wolf,
// and a crying wolf gets disabled, which would have cost the estate its content checks.
//
// It is its own module so the retry and the header can be tested OFFLINE, with a stubbed
// fetch: importing build-bench-suite.mjs would run the whole build, because that module calls
// main() at import time.
//
// The token is used only as a request header. It is never printed, never written into any
// output, and never committed. An environment without one still works.

import { readFileSync } from "node:fs";

/**
 * The hub token, if this machine has one. The banks are PUBLIC — the bytes do not need a
 * token — but an ANONYMOUS request to huggingface.co is rate-limited far more aggressively
 * than an authenticated one.
 *
 * CONTROL (2026-11-07): the bank's sha256 is byte-identical with and without the header
 * (9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b61b5 both ways), so sending
 * the token cannot change the artefact — it only changes the rate limit the hub applies.
 */
export function hubToken(env = process.env, home = process.env.HOME) {
  for (const k of ["HF_TOKEN", "HUGGING_FACE_HUB_TOKEN", "HUGGINGFACE_TOKEN"]) {
    const v = (env[k] || "").trim();
    if (v) return v;
  }
  try {
    const v = readFileSync(`${home}/.cache/huggingface/token`, "utf8").trim();
    return v || null;
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HUB_ORIGIN = "https://huggingface.co";
const MAX_ATTEMPTS = 4;
const MAX_REDIRECTS = 5;

class HubFetchError extends Error {}

function checkedUrl(value, entry = false) {
  let url;
  try { url = new URL(value); } catch { throw new HubFetchError("Invalid Hub URL"); }
  if (url.protocol !== "https:" || url.username || url.password ||
      (entry && url.origin !== HUB_ORIGIN)) {
    throw new HubFetchError("Hub requests require HTTPS and an exact huggingface.co entry origin");
  }
  return url;
}

// Cancellation must not extend the deadline if an upstream/custom stream stalls.
function cancelBody(body) {
  try { Promise.resolve(body?.cancel()).catch(() => {}); } catch {}
}

async function readText(response, signal, onReader) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  onReader(reader);
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) return text + decoder.decode();
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    cancelBody(reader);
    reader.releaseLock();
  }
}

async function requestAttempt(entry, token, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const { signal } = controller;
  let activeBody;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      cancelBody(activeBody);
      reject(new HubFetchError("Hub request or response body timed out"));
    }, timeoutMs);
  });
  const request = async () => {
    let url = entry;
    for (let redirects = 0; ; redirects++) {
      signal.throwIfAborted();
      const headers = { "User-Agent": "csoai-build-bench-suite/1.0" };
      // HF can redirect public files to a CDN. Never send its token to that origin.
      if (token && url.origin === HUB_ORIGIN) headers.Authorization = `Bearer ${token}`;
      const response = await fetchImpl(url.href, { headers, redirect: "manual", signal });
      activeBody = response.body;
      try {
        signal.throwIfAborted();
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (redirects >= MAX_REDIRECTS) throw new HubFetchError("Hub redirect limit exceeded");
          const location = response.headers.get("location");
          if (!location) throw new HubFetchError("Hub redirect has no location");
          url = checkedUrl(new URL(location, url));
          continue;
        }
        if (!response.ok) return { status: response.status };
        return { status: response.status, text: await readText(response, signal, (reader) => { activeBody = reader; }) };
      } finally {
        cancelBody(response.body);
      }
    }
  };
  try {
    return await Promise.race([request(), deadline]);
  } catch (error) {
    // Do not forward fetch errors containing signed redirect URLs or credentials.
    throw error instanceof HubFetchError ? error : new HubFetchError("Hub request failed");
  } finally {
    clearTimeout(timer);
    controller.abort();
    cancelBody(activeBody);
  }
}

/**
 * Fetch a bank, with the hub token when there is one, and with a bounded retry on the
 * statuses that are genuinely transient.
 *
 * A 4xx that is not 429 is an ANSWER — the file is gone, the repo is private — and is NOT
 * retried. Retrying a real answer is how a build ends up failing slowly instead of failing
 * honestly, and it turns one true negative into four requests against a host that already
 * said no.
 */
export async function fetchText(url, { fetchImpl = globalThis.fetch, env = process.env, home = process.env.HOME, wait = sleep, attempts = 4, timeoutMs = 15000 } = {}) {
  const entry = checkedUrl(url, true);
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > MAX_ATTEMPTS ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new HubFetchError("Invalid Hub attempt or timeout bound");
  }
  const token = hubToken(env, home);
  let status = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await requestAttempt(entry, token, fetchImpl, timeoutMs);
    if (res.text !== undefined) return res.text;
    status = res.status;
    if (status !== 429 && !(status >= 500 && status <= 599)) break;
    if (attempt < attempts - 1) {
      console.warn(`[hub-fetch] GET ${entry.origin}${entry.pathname} -> HTTP ${status}; retrying in ${1000 * 2 ** attempt}ms`);
      await wait(1000 * 2 ** attempt);
    }
  }
  throw new HubFetchError(`GET ${entry.origin}${entry.pathname} -> HTTP ${status}`);
}
