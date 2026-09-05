/**
 * tool-catalogue-parity.test.mjs — every surface that names tools must agree with runtime.
 *
 * WP-4 asks for one versioned capability registry and for tool counts to be reconciled across
 * runtime, discovery, plugin metadata, README, extension copy and UI, failing closed on drift.
 * Measured 2026-09-05, the surfaces said 11, 12, 7, 9, 8, 5 and 4.
 *
 * Most of those turned out to be dated records — HANDOFF-2026-07-02, X402-DEMAND-MAP-2026-09-02,
 * SOV-Counter-Canon. Rewriting a point-in-time document to match today would falsify it, so they
 * are left alone and this test does not read them.
 *
 * What the numbers actually mean, verified against the source rather than assumed:
 *
 *   functions/mcp/gspc-tools.json   7   the FREE read definitions, shared byte-for-byte with the
 *                                       stdio package — 7 is correct for what this file is
 *   functions/mcp/_paid.ts         +4   commission_card art50_marking_evidence rwa_evidence
 *                                       receipts_batch, added over the x402 rail
 *   live POST /mcp tools/list      11   7 + 4. This is the authority.
 *   mcp/gspc-server/index.mjs      12   the stdio package also carries witness_hash
 *   capabilities/registry.json     12   11 served + witness_hash OWNER_GATED
 *
 * witness_hash is the one that needs stating rather than counting. /api/witness returns 503
 * QUARANTINED_PRE_RELEASE, and [[path]].ts says so in the server description: "The witness_hash
 * SKU is quarantined pre-release and is not advertised." stdio still lists it, and forwards to
 * the same 503 — so it fails closed rather than bypassing the gate, but a stdio user does see a
 * tool that cannot currently succeed. That is a packaging choice, not a leak, and it is asserted
 * here so it stays deliberate.
 *
 * docs/PLUGINS.md said the HTTP surface carried "the same 7 names". It carries 11. Fixed.
 *
 * Offline by default. LIVE_MCP=1 compares against the real endpoint.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const read = (p) => readFileSync(path.join(repo, p), "utf8");

const FREE = JSON.parse(read("functions/mcp/gspc-tools.json"));
const freeNames = (Array.isArray(FREE) ? FREE : FREE.tools).map((t) => t.name).sort();
const PAID = ["art50_marking_evidence", "commission_card", "receipts_batch", "rwa_evidence"];
const GATED = ["witness_hash"];

describe("tool catalogue parity", () => {
  it("the free definitions file carries exactly the free reads", () => {
    assert.equal(freeNames.length, 7, `gspc-tools.json now has ${freeNames.length} entries`);
    for (const paid of PAID) {
      assert.ok(
        !freeNames.includes(paid),
        `${paid} is a paid tool and must not appear in the free definitions file`,
      );
    }
  });

  it("the paid tools are defined where the server says they are", () => {
    const paidSrc = read("functions/mcp/_paid.ts");
    for (const name of PAID) {
      assert.ok(paidSrc.includes(`"${name}"`), `${name} missing from functions/mcp/_paid.ts`);
    }
  });

  it("the gated SKU is documented as not advertised, in the server's own description", () => {
    const server = read("functions/mcp/[[path]].ts");
    for (const name of GATED) {
      assert.ok(
        new RegExp(`${name}[^."]*quarantin`, "i").test(server),
        `${name} is gated but the server description does not say so — a reader of tools/list ` +
          `has no way to learn why it is absent`,
      );
    }
  });

  it("the stdio package's extra tool is the gated one, and nothing else", () => {
    const stdio = read("mcp/gspc-server/index.mjs");
    const all = [...freeNames, ...PAID, ...GATED];
    const carried = all.filter((n) => stdio.includes(`"${n}"`));
    const extra = carried.filter((n) => !freeNames.includes(n) && !PAID.includes(n));
    assert.deepEqual(
      extra,
      GATED,
      `stdio carries ${extra.join(", ")} beyond the HTTP catalogue. Only the known gated SKU may ` +
        `differ, and only because it forwards to the same 503. Anything else is a transport that ` +
        `offers what the gate refuses.`,
    );
  });

  it("docs/PLUGINS.md does not claim HTTP carries only the free seven", () => {
    const docs = read("docs/PLUGINS.md");
    assert.ok(
      !/same 7 names/.test(docs),
      `docs/PLUGINS.md still says the HTTP surface carries "the same 7 names". It serves 11.`,
    );
    assert.ok(/serves 11/.test(docs), "docs/PLUGINS.md should state the real HTTP count");
  });

  it("live tools/list equals free + paid, with the gated SKU absent", async () => {
    if (!process.env.LIVE_MCP) {
      console.log("      (offline: LIVE_MCP unset — live comparison NOT made)");
      return;
    }
    const res = await fetch("https://councilof.ai/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    assert.ok(res.ok, `tools/list HTTP ${res.status}`);
    const live = (await res.json()).result.tools.map((t) => t.name).sort();
    assert.deepEqual(live, [...freeNames, ...PAID].sort(), "live tools/list is not free + paid");
    for (const g of GATED) {
      assert.ok(!live.includes(g), `${g} is gated but IS being advertised — ungate it or hide it`);
    }
  });
});
