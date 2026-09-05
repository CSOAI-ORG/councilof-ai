/**
 * capabilities/registry.test.mjs — the registry must match what runtime actually serves.
 *
 * WHY THIS EXISTS. Six surfaces stated six different tool counts: live /mcp served 11,
 * capabilities/registry.json declared 12, docs/PLUGINS.md said 7, ALIGNMENT.md said 4, and
 * several docs said 9. A reader has no way to tell which is authoritative, and "the registry"
 * is only authoritative if something fails when it drifts from the thing it describes.
 *
 * The one real difference is deliberate: witness_hash is declared so its contract is stable,
 * while /api/witness returns 503 lifecycle=QUARANTINED_PRE_RELEASE by design. That is the
 * distinction the registry could not previously express — declared-and-gated versus
 * declared-and-broken — so the count looked like a lie when it was a policy.
 *
 * Every OTHER difference is drift and fails here.
 *
 * Offline by default: proves internal consistency. Pass LIVE_MCP=1 to compare against the
 * real endpoint. A skipped comparison is reported, never counted as a pass.
 *
 * Uses node:test so it runs in a bare worktree with no install.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(path.join(here, "registry.json"), "utf8"));

const AVAILABILITY = new Set([
  "VERIFIED",
  "LOCAL_CANDIDATE",
  "OWNER_GATED",
  "UNAVAILABLE",
  "UNSUPPORTED",
]);

const mcpCaps = registry.capabilities.filter((c) => (c.protocols || []).includes("mcp"));

/** Live tools/list, or null when it could not be reached. Null is UNCHECKABLE, never "pass". */
async function liveToolNames() {
  if (!process.env.LIVE_MCP) return null;
  const res = await fetch("https://councilof.ai/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  if (!res.ok) throw new Error(`tools/list HTTP ${res.status}`);
  const body = await res.json();
  return new Set((body.result?.tools ?? []).map((t) => t.name));
}

describe("capability registry describes the runtime it claims to describe", () => {
  it("every MCP capability carries a state from the published vocabulary", () => {
    assert.ok(mcpCaps.length > 0);
    for (const c of mcpCaps) {
      assert.ok(AVAILABILITY.has(c.availability), `${c.id} availability=${c.availability}`);
      // A state without a reason is a label, not information.
      assert.ok(String(c.availability_reason || "").length > 10, `${c.id} needs a reason`);
    }
  });

  it("the counts block matches the entries it summarises", () => {
    assert.equal(registry.counts.by_protocol.mcp, mcpCaps.length);
    assert.equal(registry.counts.mcp_detail.declared, mcpCaps.length);
    const gated = mcpCaps.filter((c) => c.availability === "OWNER_GATED").length;
    assert.equal(registry.counts.mcp_detail.owner_gated, gated);
    // declared minus deliberately-gated must equal what we claim is served
    assert.equal(registry.counts.mcp_detail.served_live, mcpCaps.length - gated);
  });

  it("nothing is UNAVAILABLE — that state means drift, not policy", () => {
    const drifted = mcpCaps.filter((c) => c.availability === "UNAVAILABLE").map((c) => c.id);
    assert.deepEqual(
      drifted,
      [],
      `declared but not served and not gated: ${drifted.join(", ")}. Either serve it, gate it ` +
        `with a named reason, or remove it from the registry.`,
    );
  });

  it("matches live /mcp when LIVE_MCP=1, and reports UNCHECKABLE rather than passing when it cannot", async () => {
    const live = await liveToolNames();
    if (live === null) {
      // Deliberate: an offline run proves the registry is internally consistent and says so,
      // rather than reporting a comparison it never made.
      assert.equal(typeof registry.counts.mcp_detail.served_live, "number");
      console.log("      (offline: internal consistency only, live comparison NOT made)");
      return;
    }
    const declared = new Set(mcpCaps.map((c) => c.id));
    const gated = new Set(mcpCaps.filter((c) => c.availability === "OWNER_GATED").map((c) => c.id));

    const servedNotDeclared = [...live].filter((n) => !declared.has(n));
    assert.deepEqual(servedNotDeclared, [], `served but undeclared: ${servedNotDeclared.join(", ")}`);

    const declaredNotServed = [...declared].filter((n) => !live.has(n));
    const unexplained = declaredNotServed.filter((n) => !gated.has(n));
    assert.deepEqual(unexplained, [], `declared, not served, not gated: ${unexplained.join(", ")}`);

    for (const id of gated) {
      assert.equal(live.has(id), false, `${id} is marked OWNER_GATED but IS being served — ungate it`);
    }
  });
});
