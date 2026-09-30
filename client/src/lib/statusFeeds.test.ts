import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  fleetView,
  fundingRow,
  evidenceRows,
  censusRows,
  timestampRows,
  otsStateOfBytes,
  proofUrlsFrom,
  type Read,
  type FleetStatusPublic,
  type EvidenceManifest,
  type SiteOtsManifest,
} from "./statusFeeds";

const at = "2026-09-25T13:00:00.000Z";
const ok = <T,>(body: T): Read<T> => ({ ok: true, body, readAt: at });
const down: Read<never> = { ok: false, error: "HTTP 503", readAt: at };

const FLEET: FleetStatusPublic & { funding: { state: string; as_of: string; balance_usd?: number } } = {
  schema: "csoai.fleet-status-public/0.1",
  published_at: "2026-09-25T12:50:02Z",
  jobs: [
    { id: "domain-watch", state: "OK", last_ok: "2026-09-25T12:40:02Z" },
    { id: "airbench", state: "FAILED", last_ok: null },
    { id: "pod-mill-hourly", state: "UNMEASURED", last_ok: null },
  ],
  funding: { state: "GREEN", as_of: "2026-09-25T12:45:01Z", balance_usd: 4963.17 },
};

const MANIFEST: EvidenceManifest = {
  schema: "csoai.pubbus-manifest/0.1",
  records: [
    {
      slug: "mcp-remote-census", dataset: "mcp-remote-census", title: "csoai/mcp-remote-census", page_index: "/evidence/mcp-remote-census/",
      versions: [
        { version: "2026-09-25-c4880fdba787", page: "/evidence/mcp-remote-census/2026-09-25-c4880fdba787/", state: "SUPERSEDED", as_of: "2026-09-25T06:54:10Z", read_state: "PARTIAL", signature: { state: "VERIFIED", did: "did:web:csoai.org#board-attestation-1" }, ots: { state: "PENDING_CALENDAR_COMMITMENT", proof_url: "https://x/a.ots", upgraded_proof_url: null }, record_url: "https://x/a" },
        { version: "2026-09-25-fd5c8a7a65f2", page: "/evidence/mcp-remote-census/2026-09-25-fd5c8a7a65f2/", state: "CURRENT", as_of: "2026-09-25T06:54:10Z", read_state: "PARTIAL", signature: { state: "VERIFIED", did: "did:web:csoai.org#board-attestation-1" }, ots: { state: "BITCOIN_ATTESTATION_IN_PROOF", proof_url: "https://x/b.ots", upgraded_proof_url: "https://x/b-up.ots" }, record_url: "https://x/b" },
      ],
    },
    {
      slug: "cross-ledger-usdc", dataset: "cross-ledger-supply", title: "csoai/cross-ledger-supply — cross-ledger-usdc", page_index: "/evidence/cross-ledger-usdc/",
      versions: [{ version: "2026-09-25-1a1009dc98a6", page: "/evidence/cross-ledger-usdc/2026-09-25-1a1009dc98a6/", state: "CURRENT", as_of: "2026-09-25T10:00:00Z", read_state: null, signature: { state: "VERIFIED", did: "did:web:csoai.org#board-attestation-1" }, ots: { state: "PENDING_CALENDAR_COMMITMENT", proof_url: "https://x/c.ots", upgraded_proof_url: null }, record_url: "https://x/c" }],
    },
  ],
  refused: [{ dataset: "agent-interop-census", state: "REFUSED_UNSIGNED", reason: "no *.signed.json" }],
};

const MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
const proof = (tag: number[]) => new Uint8Array([...MAGIC, 1, ...new Array(32).fill(7), ...tag]);
const BTC = proof([0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01]);
const PENDING = proof([0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e]);

const digits = (s: string) => s.match(/\d+/g) ?? [];

describe("status feeds: an unreachable source is UNMEASURED and shows no figure", () => {
  it("fleet, funding, evidence, census and timestamps all go UNMEASURED with nothing from any earlier read", () => {
    // A good read first, then the source goes away: nothing from the first read may survive.
    fleetView(ok(FLEET));
    const rows = [
      ...fleetView(down).rows,
      fundingRow(down),
      ...evidenceRows(down, Date.parse(at)),
      ...censusRows(down),
      ...timestampRows(down, [], down),
    ];
    expect(rows.length).toBeGreaterThanOrEqual(6);
    for (const r of rows) {
      expect(r.state).toBe("UNMEASURED");
      // The only digits allowed are the error's own ("HTTP 503"); no count, colour or date from a prior read.
      expect(digits(r.observation).filter((d) => d !== "503")).toEqual([]);
      expect(r.observation).toMatch(/never substituted/);
      expect(r.observedAt).toBeNull();
    }
    expect(fleetView(down).jobs).toEqual([]);
  });

  it("a source that answers with the wrong shape is UNMEASURED too, not OK", () => {
    expect(fleetView(ok({ schema: "something-else" })).rows[0].state).toBe("UNMEASURED");
    expect(evidenceRows(ok({ schema: "x" }), 0)[0].state).toBe("UNMEASURED");
  });
});

describe("status feeds: live values", () => {
  it("fleet counts are computed from this read's list; a FAILED job degrades the row", () => {
    const v = fleetView(ok(FLEET));
    expect(v.jobs).toHaveLength(3);
    expect(v.rows[0].state).toBe("DEGRADED");
    expect(v.rows[0].observation).toContain("FAILED 1");
    expect(v.rows[0].observedAt).toBe("2026-09-25T12:50:02Z");
  });

  it("funding is a colour, never an amount", () => {
    const r = fundingRow(ok(FLEET));
    expect(r.badge).toBe("GREEN");
    expect(JSON.stringify(r)).not.toContain("4963");
    expect(fundingRow(ok({ ...FLEET, funding: { state: "PURPLE" } })).state).toBe("UNMEASURED");
    expect(fundingRow(ok({ ...FLEET, funding: { state: "RED", as_of: "2026-09-25T12:00:00Z" } })).badge).toBe("RED");
  });

  it("evidence rows show each series' CURRENT version and publish refusals", () => {
    const rows = evidenceRows(ok(MANIFEST), Date.parse(at));
    expect(rows[0].href).toBe("/evidence/mcp-remote-census/2026-09-25-fd5c8a7a65f2/");
    expect(rows[0].observation).toContain("2 version(s)");
    expect(rows.find((r) => r.badge === "REFUSED_UNSIGNED")?.label).toBe("csoai/agent-interop-census");
  });

  it("census rows carry each census's own as_of and nothing for non-census series", () => {
    const rows = censusRows(ok(MANIFEST));
    expect(rows.map((r) => r.label)).toEqual(["csoai/mcp-remote-census"]);
    expect(rows[0].observedAt).toBe("2026-09-25T06:54:10Z");
  });

  it("timestamp states come from proof bytes; an unreadable proof is not counted either way", () => {
    expect(otsStateOfBytes(BTC)).toBe("BITCOIN_ATTESTATION_IN_PROOF");
    expect(otsStateOfBytes(PENDING)).toBe("PENDING_CALENDAR_COMMITMENT");
    expect(otsStateOfBytes(new Uint8Array([1, 2, 3]))).toBe("NOT_AN_OTS_PROOF");
    expect(proofUrlsFrom(ok(MANIFEST))).toEqual(["https://x/b-up.ots", "https://x/c.ots"]);
    const site = ok<SiteOtsManifest>({ as_of: "2026-09-24T17:47:40Z", counts: { proofs: 631, bitcoin_attested: 628, calendar_pending: 3 } });
    const rows = timestampRows(site, [ok(BTC), down], ok(MANIFEST));
    expect(rows[0].observation).toContain("628 Bitcoin-attested");
    expect(rows[1].state).toBe("DEGRADED");
    expect(rows[1].observation).toContain("1 of 2 proof(s) read: BITCOIN_ATTESTATION_IN_PROOF 1");
  });
});

describe("/status wiring", () => {
  const page = readFileSync(new URL("../pages/YieldStatus.tsx", import.meta.url), "utf8");
  it("reads every new source with no-store and renders the UNMEASURED state", () => {
    expect(page).toContain("FLEET_STATUS_URL");
    expect(page).toContain("EVIDENCE_MANIFEST_URL");
    expect(page).toContain("SITE_OTS_MANIFEST_URL");
    expect(page).toContain('cache: "no-store"');
    expect(page).toContain('"UNMEASURED"');
    expect(page).not.toMatch(/localStorage|sessionStorage/);
  });
});
