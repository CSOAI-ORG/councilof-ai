/**
 * openapi-runtime-parity.test.mjs — the published API spec against what the API actually returns.
 *
 * WP-4 asks for one versioned capability registry with ACTUAL host support tested. /openapi.json
 * is the machine-facing half of that: 81 paths, 76 GET-able, version 2026-09-03. Agents generate
 * clients from it. Nothing was comparing it to runtime.
 *
 * Probed 2026-09-05, every declared GET path against production. 69 of 76 return a status the
 * spec declares. Seven do not:
 *
 *   /api/request-attestation   live 402   declared [200]   <- the one that matters
 *   /api/evidence-bundle       live 400   declared [200]
 *   /api/interop-bulk          live 400   declared [200]
 *   /api/proof                 live 400   declared [200]
 *   /api/trace                 live 400   declared [200]
 *   /api/fulfill               live 404   declared [200]
 *   /api/worker                live 404   declared [501]
 *
 * THE 402 IS NOT A BUG, IT IS AN UNDECLARED PROTOCOL. /api/request-attestation is the x402
 * endpoint, and 402-with-a-payment-challenge is how x402 BEGINS — the response carries the
 * accepts[] entry a wallet signs against. A client generated from a spec that declares only 200
 * treats the protocol's first step as a failure. This is the estate's paid rail, described to
 * machines as if the payment handshake did not exist.
 *
 * The four 400s are honest runtime behaviour — those endpoints need query parameters and a bare
 * GET is correctly rejected. The spec simply never declares it, so an agent meets an undeclared
 * status on its first call.
 *
 * /api/fulfill is the interesting one: it answers 404 with a body that is exactly right —
 * {"configured":false,"public_prices":false,"message":"No public prices. A grade is never
 * sold..."}. The door is deliberately closed and says so in doctrine terms. Only the spec is
 * wrong, declaring 200. And /api/worker is declared at a bare path with 501 while the
 * implementation is a catch-all proxy at /api/worker/* that 404s throughout, so both its path
 * shape and its status are wrong.
 *
 * THIS FILE DOES NOT DEMAND THE SEVEN BE FIXED — several are the endpoint behaving correctly and
 * the spec lagging, which is a documentation change owned by whoever maintains it. It records
 * them, and fails on the EIGHTH, so the gap between what this estate tells machines and what it
 * does to them cannot widen unnoticed.
 *
 * Offline by default. LIVE_OPENAPI=1 fetches the spec and probes every declared GET path.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const SPEC = "https://councilof.ai/openapi.json";

/** Divergences measured 2026-09-05. An eighth is a regression; a seventh removed is progress. */
const KNOWN = {
  "/api/request-attestation": "402",
  "/api/evidence-bundle": "400",
  "/api/interop-bulk": "400",
  "/api/proof": "400",
  "/api/trace": "400",
  "/api/fulfill": "404",
  "/api/worker": "404",
};

async function probe(path) {
  try {
    const res = await fetch(`https://councilof.ai${path}`, { redirect: "manual" });
    return String(res.status);
  } catch {
    return "ERR";
  }
}

describe("the published OpenAPI spec matches runtime", () => {
  it("live: the spec is served and declares a substantial surface", async () => {
    if (!process.env.LIVE_OPENAPI) {
      console.log("      (offline: LIVE_OPENAPI unset — spec NOT fetched)");
      return;
    }
    const spec = await (await fetch(SPEC)).json();
    assert.match(String(spec.openapi), /^3\./);
    assert.ok(
      Object.keys(spec.paths ?? {}).length > 50,
      "the spec now declares fewer than 50 paths — confirm that shrink is deliberate",
    );
  });

  it("live: no NEW path returns a status the spec does not declare", async () => {
    if (!process.env.LIVE_OPENAPI) {
      console.log("      (offline: LIVE_OPENAPI unset — paths NOT probed)");
      return;
    }
    const spec = await (await fetch(SPEC)).json();
    const gets = Object.entries(spec.paths)
      .filter(([, ops]) => ops.get)
      .map(([p, ops]) => [p, Object.keys(ops.get.responses ?? {})]);

    const surprises = [];
    for (const [p, declared] of gets) {
      const live = await probe(p);
      if (declared.includes(live)) continue;
      if (KNOWN[p] === live) continue;
      surprises.push(`${p}: live ${live}, declared [${declared.join(", ")}]`);
    }
    assert.deepEqual(
      surprises,
      [],
      `these paths return a status /openapi.json does not declare: ${surprises.join("; ")}. ` +
        `Agents generate clients from that spec — an undeclared status is an error to them, ` +
        `whatever it means to us. Declare it, or record it in KNOWN with the reason.`,
    );
  });

  it("live: the x402 payment challenge is still the reason request-attestation diverges", async () => {
    if (!process.env.LIVE_OPENAPI) {
      console.log("      (offline: LIVE_OPENAPI unset — x402 NOT probed)");
      return;
    }
    // If this stops being 402, either the paid rail changed or the spec was corrected. Both
    // are worth noticing deliberately rather than discovering later.
    const live = await probe("/api/request-attestation");
    assert.equal(
      live,
      "402",
      `/api/request-attestation now returns ${live}, not the x402 challenge. If the spec was ` +
        `corrected to declare 402, delete this entry from KNOWN. If the rail changed, that is ` +
        `a bigger change than a spec edit.`,
    );
  });

  it("live: /api/fulfill still refuses in doctrine terms, not by accident", async () => {
    if (!process.env.LIVE_OPENAPI) {
      console.log("      (offline: LIVE_OPENAPI unset — fulfill NOT probed)");
      return;
    }
    // A 404 that carries the reason is a closed door. A bare 404 is a missing endpoint. The
    // difference is the whole point, and only one of them is intentional.
    const res = await fetch("https://councilof.ai/api/fulfill");
    const body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.public_prices, false);
    assert.match(
      String(body.message),
      /never sold/i,
      "the closed fulfillment door no longer explains itself — a bare 404 reads as a broken " +
        "endpoint rather than a deliberate refusal",
    );
  });
});
