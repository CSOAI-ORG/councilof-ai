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

/**
 * Fetch a bank, with the hub token when there is one, and with a bounded retry on the
 * statuses that are genuinely transient.
 *
 * A 4xx that is not 429 is an ANSWER — the file is gone, the repo is private — and is NOT
 * retried. Retrying a real answer is how a build ends up failing slowly instead of failing
 * honestly, and it turns one true negative into four requests against a host that already
 * said no.
 */
export async function fetchText(url, { fetchImpl = globalThis.fetch, env = process.env, home = process.env.HOME, wait = sleep, attempts = 4 } = {}) {
  const headers = { "User-Agent": "csoai-build-bench-suite/1.0" };
  const token = hubToken(env, home);
  if (token) headers.Authorization = `Bearer ${token}`;
  let status = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetchImpl(url, { headers });
    if (res.ok) return res.text();
    status = res.status;
    if (status !== 429 && status < 500) break;
    if (attempt < attempts - 1) {
      console.warn(`[hub-fetch] GET ${url} -> HTTP ${status}; retrying in ${1000 * 2 ** attempt}ms`);
      await wait(1000 * 2 ** attempt);
    }
  }
  throw new Error(`GET ${url} -> HTTP ${status}`);
}
