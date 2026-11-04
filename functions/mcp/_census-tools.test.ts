/**
 * Unit tests for the 3 census SKU MCP tools:
 *   - `trust_query`   (./_trust-query.ts)
 *   - `parity_lookup` (./_parity-lookup.ts)
 *   - `index_edition` (./_index-edition.ts)
 *
 * Verifies:
 *   1. Doctrine & honesty invariants (`not_a_certification: true` on all paths; no forbidden roots).
 *   2. Filtering by rail, subject, check, and edition (`trust_query`).
 *   3. URL normalization (`normaliseEndpoint`) and `history: true` vs `false` (`parity_lookup`).
 *   4. Verbatim forwarding of `draft_artifact: true` and `draft_notes` (`index_edition`).
 *   5. Honest `EMPTY` / `NOT_MEASURED` / `BAD_ARGUMENTS` / `UNREACHABLE` handling (never zero-as-fail).
 */

import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TRUST_QUERY_TOOL_NAMES,
  trustQueryResult,
  trustQueryToolResult,
  trust_query,
} from "./_trust-query.ts";
import {
  PARITY_LOOKUP_TOOL_NAMES,
  normaliseEndpoint,
  parityLookupResult,
  parityLookupToolResult,
  parity_lookup,
} from "./_parity-lookup.ts";
import {
  INDEX_EDITION_TOOL_NAMES,
  indexEditionResult,
  indexEditionToolResult,
  index_edition,
} from "./_index-edition.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

function loadJsonOrFallback<T>(candidates: string[], fallback: T): T {
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, "utf8")) as T;
    }
  }
  return fallback;
}

const EDITION_2026_11_03 = loadJsonOrFallback(
  [resolve("/Users/nicholas/ZCodeProject/build/out/trust-index/edition-2026-11-03.json")],
  {
    index: "gspc-trust-index",
    rail: "x402",
    edition: "2026-11-03",
    cut_at: "2026-11-03T02:49:55.465Z",
    merkle_root: "a14bd010ca2d90ead8158422ed9e90f17d866b23e7398fdb565e13fe9d1b0267",
    previous_edition: {
      edition: "2026-11-02-v0.1",
      merkle_root: "6f128d445e7c44fd95272cb53e69dfd71b3707569f6e304ef06dff6fc2d83ae4",
    },
    draft_artifact: true,
    draft_notes: ["DRAFT EDITION — pre-mint staging, not yet anchored to public root."],
    not_a_certification: true,
    entries: [
      {
        subject: "agent-kiosk.vercel.app",
        url: "https://agent-kiosk.vercel.app/v1/github-intel",
        checks: [
          {
            id: "x402.challenge-correctness",
            state: "MEASURED",
            outcome: "CHALLENGE_OK",
            as_of: "2026-11-03T02:49:55.465Z",
          },
        ],
      },
      {
        subject: "agent-kiosk.vercel.app",
        url: "https://agent-kiosk.vercel.app/v1/token-due-diligence",
        checks: [
          {
            id: "x402.challenge-correctness",
            state: "MEASURED",
            outcome: "CHALLENGE_OK",
            as_of: "2026-11-03T02:49:55.465Z",
          },
        ],
      },
      {
        subject: "agentpay.agentpay-apis.workers.dev",
        url: "https://agentpay.agentpay-apis.workers.dev/extract/v1/page",
        checks: [
          {
            id: "x402.listing-parity",
            state: "MEASURED",
            outcome: "MISMATCH",
            diffs: ["network eip155:8453≠base"],
            as_of: "2026-11-03T02:49:55.465Z",
          },
        ],
      },
      {
        subject: "agentreferee.ai",
        url: "https://agentreferee.ai/join/weighted",
        checks: [
          {
            id: "x402.challenge-correctness",
            state: "MEASURED",
            outcome: "CHALLENGE_OK",
            as_of: "2026-11-03T02:49:55.465Z",
          },
        ],
      },
    ],
  },
);

const X402_LATEST = loadJsonOrFallback(
  [
    resolve(REPO_ROOT, "public/interop/x402-trust/latest.json"),
    resolve("/Users/nicholas/councilof-ai-ops/public/interop/x402-trust/latest.json"),
  ],
  {
    schema: "csoai.x402-trust/0.1",
    as_of: "2026-10-24T00:00:00Z",
    n_measured: 94,
    n_total: 100,
    entries: [
      {
        subject: "councilof.ai",
        url: "https://councilof.ai/api/evidence-bundle",
        rail: "x402",
        checks: { "x402.challenge": { status: "MEASURED", state: "VALID_402" } },
      },
    ],
  },
);

const MCP_LATEST = loadJsonOrFallback(
  [
    resolve(REPO_ROOT, "public/interop/mcp-trust/latest.json"),
    resolve("/Users/nicholas/councilof-ai-ops/public/interop/mcp-trust/latest.json"),
  ],
  {
    schema: "csoai.mcp-trust/0.1",
    as_of: "2026-11-02T00:00:00Z",
    entries: [
      {
        subject: "councilof.ai",
        url: "https://councilof.ai/mcp",
        rail: "mcp",
        checks: { "mcp.tools-list": { status: "MEASURED", state: "CONSISTENT" } },
      },
    ],
  },
);

function makeMockFetch(overrides: Record<string, { status: number; body: unknown }> = {}) {
  return async (url: string): Promise<Response> => {
    if (overrides[url]) {
      const o = overrides[url];
      return new Response(JSON.stringify(o.body), {
        status: o.status,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.endsWith("/interop/x402-trust/latest.json")) {
      return new Response(JSON.stringify(X402_LATEST), { status: 200 });
    }
    if (url.endsWith("/interop/mcp-trust/latest.json")) {
      return new Response(JSON.stringify(MCP_LATEST), { status: 200 });
    }
    if (
      url.endsWith("/trust-index/latest.json") ||
      url.endsWith("/trust-index/edition-2026-11-03.json")
    ) {
      return new Response(JSON.stringify(EDITION_2026_11_03), { status: 200 });
    }
    if (url.includes("/measurement-capsules/v0.2/endpoints/")) {
      return new Response(JSON.stringify({ endpoints: {} }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  };
}

describe("census SKU MCP tools — doctrine & tool names", () => {
  it("exports the exact 3 snake_case tool names and doctrine-safe descriptions", () => {
    assert.deepEqual([...TRUST_QUERY_TOOL_NAMES], ["trust_query"]);
    assert.deepEqual([...PARITY_LOOKUP_TOOL_NAMES], ["parity_lookup"]);
    assert.deepEqual([...INDEX_EDITION_TOOL_NAMES], ["index_edition"]);

    for (const tool of [trust_query, parity_lookup, index_edition]) {
      const desc = tool.definition.description;
      assert.match(desc, /Measurement, never certification/);
      assert.doesNotMatch(desc, /\b(certifies|certified|compliant|non-compliant|unsafe|approve)\b/i);
    }
  });
});

describe("trust_query", () => {
  it("filters real 2026-11-03 Trust Index edition by subject and check", async () => {
    const res = await trustQueryResult(
      "https://councilof.ai",
      {
        rail: "x402",
        subject: "agent-kiosk.vercel.app",
        check: "x402.challenge-correctness",
      },
      makeMockFetch(),
    );
    assert.equal(res.state, "MEASURED");
    assert.equal(res.not_a_certification, true);
    assert.equal(res.draft_artifact, true);
    assert.equal(res.match_count, 2);
    const matches = res.matches as Array<Record<string, unknown>>;
    assert.equal(matches[0].subject, "agent-kiosk.vercel.app");
    const checks = matches[0].checks as Array<Record<string, unknown>>;
    assert.equal(checks.length, 1);
    assert.equal(checks[0].id, "x402.challenge-correctness");
    assert.equal(checks[0].outcome, "CHALLENGE_OK");
  });

  it("returns EMPTY (matches: []) for an unknown subject without synthesizing states", async () => {
    const res = await trustQueryResult(
      "https://councilof.ai",
      { rail: "x402", subject: "nonexistent-host.example.invalid" },
      makeMockFetch(),
    );
    assert.equal(res.state, "EMPTY");
    assert.equal(res.match_count, 0);
    assert.deepEqual(res.matches, []);
    assert.equal(res.not_a_certification, true);
  });

  it("rejects invalid rail with BAD_ARGUMENTS and not_a_certification: true", async () => {
    const mcpRes = await trustQueryToolResult(
      { rail: "solana" },
      "https://councilof.ai",
      makeMockFetch(),
    );
    assert.equal(mcpRes.isError, true);
    assert.equal(mcpRes.structuredContent?.state, "BAD_ARGUMENTS");
    assert.equal(mcpRes.structuredContent?.not_a_certification, true);
  });
});

describe("parity_lookup", () => {
  it("normalizes URLs identically to measurementCapsule.ts", () => {
    assert.equal(
      normaliseEndpoint("HTTPS://Example.COM:443/mcp/free/?a=1#frag"),
      "https://example.com/mcp/free?a=1",
    );
    assert.equal(normaliseEndpoint("https://example.com/"), "https://example.com/");
    assert.equal(normaliseEndpoint("ftp://example.com/mcp"), null);
    assert.equal(normaliseEndpoint("https://user:pass@example.com/mcp"), null);
  });

  it("returns MEASURED parity observation from Trust Index listing-parity for a known URL", async () => {
    const res = await parityLookupResult(
      "https://councilof.ai",
      { url: "https://agentpay.agentpay-apis.workers.dev/extract/v1/page/" },
      makeMockFetch(),
    );
    assert.equal(res.state, "MEASURED");
    assert.equal(res.url, "https://agentpay.agentpay-apis.workers.dev/extract/v1/page");
    assert.equal(res.not_a_certification, true);
    const obs = res.observations as Array<Record<string, unknown>>;
    assert.equal(obs.length, 1);
    assert.equal(obs[0].parity, "INCONSISTENT");
    assert.deepEqual(obs[0].diffs, ["network eip155:8453≠base"]);
  });

  it("returns NOT_MEASURED and observations: [] for an unknown URL", async () => {
    const res = await parityLookupResult(
      "https://councilof.ai",
      { url: "https://unmeasured.example.org/mcp" },
      makeMockFetch(),
    );
    assert.equal(res.state, "NOT_MEASURED");
    assert.deepEqual(res.observations, []);
    assert.equal(res.not_a_certification, true);
  });
});

describe("index_edition", () => {
  it("loads the 2026-11-03 edition and preserves draft_artifact and draft_notes verbatim", async () => {
    const res = await indexEditionResult(
      "https://councilof.ai",
      { edition: "2026-11-03" },
      makeMockFetch(),
    );
    assert.equal(res.state, "PUBLISHED");
    assert.equal(res.edition, "2026-11-03");
    assert.equal(res.entry_count, EDITION_2026_11_03.entries.length);
    assert.equal(res.merkle_root, EDITION_2026_11_03.merkle_root);
    assert.equal(res.draft_artifact, true);
    assert.deepEqual(res.draft_notes, EDITION_2026_11_03.draft_notes);
    assert.equal(res.not_a_certification, true);
  });

  it("filters edition entries by subject and returns EMPTY when not in sample", async () => {
    const hit = await indexEditionResult(
      "https://councilof.ai",
      { edition: "2026-11-03", subject: "agentreferee.ai" },
      makeMockFetch(),
    );
    assert.equal(hit.state, "PUBLISHED");
    assert.equal(hit.entry_count, 1);

    const miss = await indexEditionToolResult(
      { edition: "2026-11-03", subject: "not-in-sample.example.com" },
      "https://councilof.ai",
      makeMockFetch(),
    );
    assert.equal(miss.isError, false);
    assert.equal(miss.structuredContent?.state, "EMPTY");
    assert.equal(miss.structuredContent?.entry_count, 0);
  });
});

describe("hf-mirror-gate F2 (T18-card-wrapper-mirror)", () => {
  it("verifies all 4 pinned Article 50 card wrappers against mocked or live HF resolve", async () => {
    const scriptPath = existsSync(resolve(REPO_ROOT, "scripts/hf-mirror-gate.mjs"))
      ? "../../scripts/hf-mirror-gate.f2-patch.mjs"
      : "./hf-mirror-gate.f2-patch.mjs";
    const { PINNED_ART50_SAMPLE_CARDS, verifySampleCard } = await import(scriptPath);
    assert.equal(PINNED_ART50_SAMPLE_CARDS.length, 4);
    for (const cardId of PINNED_ART50_SAMPLE_CARDS) {
      const mockHfFetch: typeof fetch = async () =>
        new Response(
          JSON.stringify({
            card: { sha256: cardId, schema: "https://councilof.ai/schema/card-v1.json" },
            proof: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      const res = await verifySampleCard(cardId, "/nonexistent-local-public-dir", mockHfFetch);
      assert.equal(res.verdict, "VALID");
      assert.equal(res.card_sha256, cardId);
      assert.equal(res.proof_siblings, 9);
    }
  });
});
