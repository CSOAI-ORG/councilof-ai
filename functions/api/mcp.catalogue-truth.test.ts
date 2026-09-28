import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./mcp";

/**
 * G-2 (2026-09-22). GET https://councilof.ai/api/mcp published six servers as
 *
 *   "status": "catalogued-not-probed",
 *   "catalogue_claim": { "tools_count": 6, "status": "LIVE", "verified": false }
 *
 * The record's own status was honest; the claim block beside it said LIVE. csoai-anchors,
 * csoai-watchdog, csoai-spectrum and csoai-drift have no published endpoint, have never
 * been contacted, and their corresponding public routes answer 404. "LIVE" is a
 * reachability assertion and the only thing that may assert reachability is a probe that
 * returned — the same rule `last_probed` has kept since 2026-08-26. The claim was
 * inherited verbatim from the pre-2026-08-26 hardcoded array that this whole artifact
 * exists to replace.
 *
 * The claim block is kept as provenance of what that array asserted, with its numbers
 * relabelled `asserted_tools_count` and every status-shaped key dropped by
 * `stripClaimedState` in scripts/mcp-probe.mjs. This test reads the SERVED payload, so it
 * fails whether the claim comes back through the targets file, the producer, or the
 * handler.
 */

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

type Server = {
  id: string;
  status: string;
  endpoint: string | null;
  last_probed: string | null;
  tools_count: number | null;
  catalogue_claim: Record<string, unknown> | null;
};

async function servedRegistry(): Promise<{ servers: Server[]; probe_host: string }> {
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/mcp"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  expect(res.status).toBe(200);
  return (await res.json()) as { servers: Server[]; probe_host: string };
}

/** Keys that assert a state. A catalogue may assert numbers; only a probe asserts these. */
const STATE_KEYS = ["status", "state", "health", "availability", "live", "reachable", "uptime"];

describe("GET /api/mcp: a never-probed server carries no liveness claim", () => {
  it("serves the servers and the six unprobed entries this guard reads", async () => {
    const { servers } = await servedRegistry();
    expect(servers.length).toBeGreaterThan(5);
    const unprobed = servers.filter((s) => s.status === "catalogued-not-probed");
    expect(unprobed.length).toBe(6);
    for (const id of ["csoai-anchors", "csoai-watchdog", "csoai-spectrum", "csoai-drift"]) {
      expect(unprobed.map((s) => s.id)).toContain(id);
    }
  });

  it("no catalogue_claim asserts a state", async () => {
    const { servers } = await servedRegistry();
    const offences: string[] = [];
    for (const s of servers) {
      for (const k of Object.keys(s.catalogue_claim ?? {})) {
        if (STATE_KEYS.includes(k.toLowerCase())) offences.push(`${s.id}.catalogue_claim.${k}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it("the word LIVE appears nowhere in the served registry", async () => {
    const registry = await servedRegistry();
    const hits = JSON.stringify(registry).match(/\bLIVE\b/g) ?? [];
    expect(hits).toEqual([]);
  });

  it("a catalogue's asserted count is never named tools_count", async () => {
    const { servers } = await servedRegistry();
    for (const s of servers) {
      expect(s.catalogue_claim?.tools_count, `${s.id}`).toBeUndefined();
    }
  });

  it("every unprobed server is honest about what was never measured", async () => {
    const { servers } = await servedRegistry();
    for (const s of servers.filter((x) => x.status === "catalogued-not-probed")) {
      expect(s.last_probed, `${s.id}.last_probed`).toBeNull();
      expect(s.tools_count, `${s.id}.tools_count`).toBeNull();
      expect(s.endpoint, `${s.id}.endpoint`).toBeNull();
      expect(s.catalogue_claim?.verified, `${s.id}.verified`).toBe(false);
      expect(s.catalogue_claim?.claim_state, `${s.id}.claim_state`).toBe("UNVERIFIED_HISTORICAL");
    }
  });

  it("the targets file — the other place the claim could re-enter — carries no status", () => {
    const targets = JSON.parse(readFileSync(join(REPO, "scripts", "mcp-targets.json"), "utf8"));
    const offences: string[] = [];
    for (const entry of targets.catalogued ?? []) {
      for (const k of Object.keys(entry.catalogue_claim ?? {})) {
        if (STATE_KEYS.includes(k.toLowerCase())) offences.push(`${entry.id}.catalogue_claim.${k}`);
      }
    }
    expect(offences).toEqual([]);
    expect(targets.catalogued.length).toBe(6); // not vacuous
  });
});
