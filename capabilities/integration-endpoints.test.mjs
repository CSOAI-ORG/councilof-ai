/**
 * integration-endpoints.test.mjs — the integrations sidebar advertises hosts; do they answer?
 *
 * WP-4: "One versioned capability registry across HTTP, MCP, AG-UI, A2A, A2UI, SDK, plugin,
 * extension and app. TEST ACTUAL HOST SUPPORT." `client/src/data/intel/integrations.ts` is a
 * registry of ten integrations, seven of which name a live endpoint, rendered by
 * `/opengridworks` (HTTP 200). Nothing compared any of them to runtime.
 *
 * Probed 2026-09-05. THREE OF SEVEN DID NOT ANSWER, and all three are now fixed:
 *
 *   https://app.csoai.org/mcp                          200
 *   https://app.csoai.org/.well-known/mcp.json         200
 *   https://app.csoai.org/crosswalks                   200
 *   https://app.csoai.org/eu-ai-act-classifier         200
 *   https://app.csoai.org/agent.json                   404
 *   https://app.csoai.org/data/regulation-deltas.json  404
 *   https://meok-attestation-api.vercel.app            402   <- the one that matters
 *
 * THE 402 IS THE DEAD-VERCEL SIGNATURE. Vercel was unlinked from this estate on 2026-08-31 and
 * every leftover host answers 402. The entry says "Issue and verify Ed25519-signed compliance
 * attestations — provenance you can prove", with "POST /sign to issue an attestation". It cannot
 * issue anything. For an estate whose product is attestation, that is the worst entry to have
 * pointing at a dead host.
 *
 * WHAT IS *NOT* CLAIMED HERE, because it was measured and is not true: none of this is on screen
 * today. `/opengridworks` renders 2,700 characters at 1400px and 2,596 on a phone, and neither
 * contains "Ed25519" or "meok-attestation-api" — the integrations list needs an interaction to
 * surface. Local and production agree byte-for-byte on both counts. So this is a LATENT trap, not
 * a live defect: the entry ships the moment anyone renders the full list, and the estate has
 * already shipped a retracted claim exactly that way.
 *
 * FIXED, not excused: agent.json now points at `/.well-known/agent-card.json` (served); the
 * attestation entry points at `/api/proof`, which returns a real free inclusion proof for
 * `?sha=<64-hex>` and correctly 400s a bare GET; and the deltas entry lost its endpoint and
 * gained an `unavailable` reason, because no deltas file exists at any host and `/feed` is a
 * page titled "Evidence review in progress" rather than a feed.
 *
 * `client/src/components/evidence/EvidencePackage.tsx` — 323 lines, imported by nothing, route
 * `/evidence-package` 404 — still fetches the dead host. Its own README says `/evidence` is taken
 * by a different product. OWNER CALL: it is another lane's port, so this file records it and
 * deletes nothing.
 *
 * Offline by default. LIVE_INTEGRATIONS=1 probes every advertised endpoint.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(repo, "client/src/data/intel/integrations.ts");

/**
 * Measured 2026-09-05, and now EMPTY, because all three were fixed rather than excused:
 *
 *   https://app.csoai.org/agent.json                   404  -> repointed to the served
 *                                                            /.well-known/agent-card.json
 *   https://meok-attestation-api.vercel.app            402  -> repointed to /api/proof, the
 *                                                            free inclusion proof that exists
 *   https://app.csoai.org/data/regulation-deltas.json  404  -> endpoint removed; the entry now
 *                                                            carries an `unavailable` reason
 *
 * A known-failures list that only grows stops meaning anything. This one is kept at zero on
 * purpose: an entry here is a decision to ship a dead endpoint, and needs the reason written next
 * to it.
 */
const KNOWN_DEAD = {};

function registry() {
  const src = readFileSync(REGISTRY, "utf8");
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function advertised() {
  return [...new Set([...registry().matchAll(/endpoint:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]))];
}

/**
 * Endpoints whose entry DOCUMENTS a required query parameter. A bare GET to one of these is
 * correctly rejected with 400 — the path is served, the call was incomplete. /api/proof is the
 * case: it answers 400 to a bare GET and returns a real free inclusion proof for ?sha=<64-hex>.
 *
 * This allowance is deliberately tied to the `connect` line rather than to a URL list. An
 * endpoint may only be excused a 400 while the registry actually tells a caller which parameter
 * to pass — otherwise "needs parameters" becomes the excuse that hides a broken path, which is
 * the same shape as the filename allowlist that let a retracted claim ship past brand-gate.
 */
function documentsParameters(url) {
  const entry = registry().split(/\{\s*\n/).find((b) => b.includes(url));
  if (!entry) return false;
  const connect = entry.match(/connect:\s*['"]([^'"]*)['"]/);
  return !!connect && /[?&]\w+=/.test(connect[1]);
}

async function status(url) {
  try {
    return String((await fetch(url, { redirect: "follow" })).status);
  } catch {
    return "ERR";
  }
}

describe("every endpoint the integrations registry advertises", () => {
  it("the registry still parses and names endpoints", () => {
    const eps = advertised();
    assert.ok(
      eps.length >= 5,
      `only ${eps.length} endpoints parsed out of the integrations registry — the shape changed ` +
        `and this guard is checking nothing`,
    );
    for (const e of eps) assert.match(e, /^https?:\/\//, `not an absolute URL: ${e}`);
  });

  it("no endpoint points at a dead Vercel host without being recorded", () => {
    // Static, so it fails in CI with no network. Vercel was unlinked on 2026-08-31 and every
    // leftover host 402s; a NEW vercel.app endpoint is someone reintroducing a dead backend.
    const strays = advertised().filter((e) => /vercel\.app/i.test(e) && !(e in KNOWN_DEAD));
    assert.deepEqual(
      strays,
      [],
      `these endpoints point at Vercel, which is dead for this estate: ${strays.join(", ")}. ` +
        `Every leftover host answers 402. Point them at councilof.ai or app.csoai.org.`,
    );
  });

  it("live: no NEW endpoint has stopped answering", async () => {
    if (!process.env.LIVE_INTEGRATIONS) {
      console.log("      (offline: LIVE_INTEGRATIONS unset — endpoints NOT probed)");
      return;
    }
    const broken = [];
    for (const url of advertised()) {
      const code = await status(url);
      const n = Number(code);
      if (Number.isFinite(n) && n >= 200 && n < 400) continue;
      if (code === "400" && documentsParameters(url)) continue; // served; the bare GET was incomplete
      if (KNOWN_DEAD[url] === code) continue;
      broken.push(`${url} -> ${code}`);
    }
    assert.deepEqual(
      broken,
      [],
      `these advertised integration endpoints do not answer: ${broken.join("; ")}. The sidebar ` +
        `tells a visitor how to call each one. Fix the host, drop the endpoint and give the ` +
        `entry an \`unavailable\` reason, or record it in KNOWN_DEAD. A 400 is excused only ` +
        `while the entry's \`connect\` line names the parameter it needs.`,
    );
  });

  it("live: a KNOWN_DEAD endpoint that revives is retired from the list", async () => {
    if (!process.env.LIVE_INTEGRATIONS) {
      console.log("      (offline: LIVE_INTEGRATIONS unset — revivals NOT checked)");
      return;
    }
    // The other half of a known-failures list. Without this it only ever grows, and a fixed
    // endpoint stays permanently excused — which is how a stale allowlist stops meaning anything.
    const revived = [];
    for (const [url, expected] of Object.entries(KNOWN_DEAD)) {
      if (!advertised().includes(url)) continue; // already removed from the registry
      const code = await status(url);
      if (code !== expected && Number(code) >= 200 && Number(code) < 400) revived.push(`${url} -> ${code}`);
    }
    assert.deepEqual(
      revived,
      [],
      `these endpoints were recorded dead and now answer: ${revived.join("; ")}. Delete them ` +
        `from KNOWN_DEAD so the list keeps meaning "measured, still broken".`,
    );
  });
});
