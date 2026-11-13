import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { AXES_FIN } from "../../../functions/api/_gspc_axes_fin";
import {
  AXIS_SETS,
  fetchPublishedSet,
  loadAgentAndMcpHarnesses,
  loadAgentLayerArenaAndAcademyHitl,
  loadAiCompanies,
  loadAiLabs,
  loadBoard,
  loadHumanoidLabsAndDeployments,
  loadInteropWorkingGroups,
  loadMeasurersAndHarnesses,
  loadOsaiaSafeAndClaimMaintenance,
} from "./axis-sets";

const boardSet = AXIS_SETS.find((set) => set.id === "board");
if (!boardSet) throw new Error("board set missing");

const runRows = {
  measured_on: { date: "2026-09-04" },
  axes: [
    {
      axis: "provenance-controls",
      family: "financial",
      kind: "deterministic-facts",
      status: "MEASURED",
      evidence_url: "/interop/signed.json",
      run_attestation: "ED25519_SIGNED",
    },
    {
      axis: "reserve-attestation",
      family: "financial",
      kind: "deterministic-facts",
      status: "MEASURED",
      evidence_url: "/interop/unsigned.json",
      run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    },
    {
      axis: "unknown-attestation",
      family: "financial",
      kind: "deterministic-facts",
      status: "MEASURED",
      evidence_url: "/interop/unknown.json",
    },
  ],
};

describe("measurement-board run and fallback truth", () => {
  it("renders the current 1 signed / 7 unsigned financial run split truthfully", () => {
    const rows = loadBoard({ axes: AXES_FIN }).rows;
    const signed = rows.filter((row) => row.runAttestation === "ED25519_SIGNED");
    const unsigned = rows.filter(
      (row) => row.runAttestation === "CONTENT_ADDRESSED_UNSIGNED",
    );

    expect(rows).toHaveLength(8);
    expect(signed).toHaveLength(1);
    expect(unsigned).toHaveLength(7);
    expect(signed[0].evidence.find((link) => link.kind === "run")?.label).toBe(
      "the signed run",
    );
    expect(
      unsigned.every(
        (row) =>
          row.evidence.find((link) => link.kind === "run")?.label ===
          "the content-addressed unsigned run",
      ),
    ).toBe(true);
  });

  it("carries run attestation state into rows and never infers a signature", () => {
    const rows = loadBoard(runRows).rows;

    expect(rows[0].runAttestation).toBe("ED25519_SIGNED");
    expect(rows[0].evidence[0].label).toBe("the signed run");
    expect(rows[1].runAttestation).toBe("CONTENT_ADDRESSED_UNSIGNED");
    expect(rows[1].evidence[0].label).toBe("the content-addressed unsigned run");
    expect(rows[2].runAttestation).toBeNull();
    expect(rows[2].evidence[0].label).toBe("the run artifact");
  });

  it("reads status first and refuses a superseded fallback without loading it", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url === "/api/gspc") return new Response("unavailable", { status: 503 });
      if (url === "/signed/gspc-board.status.json")
        return Response.json({
          state: "SUPERSEDED_KNOWN_CLAIM_DEFECT",
          current: false,
        });
      if (url === "/signed/gspc-board.signed.json") return Response.json(runRows);
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    await expect(fetchPublishedSet(boardSet, fetchImpl)).rejects.toThrow(
      /fallback refused:.*SUPERSEDED_KNOWN_CLAIM_DEFECT/,
    );
    expect(calls).toEqual(["/api/gspc", "/signed/gspc-board.status.json"]);
  });

  it("renders an eligible current snapshot as an explicitly non-live fallback", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url === "/api/gspc") return new Response("unavailable", { status: 503 });
      if (url === "/signed/gspc-board.status.json")
        return Response.json({ state: "CURRENT", current: true });
      if (url === "/signed/gspc-board.signed.json") return Response.json(runRows);
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    const loaded = await fetchPublishedSet(boardSet, fetchImpl);
    expect(calls).toEqual([
      "/api/gspc",
      "/signed/gspc-board.status.json",
      "/signed/gspc-board.signed.json",
    ]);
    expect(loaded.rows).toHaveLength(3);
    expect(loaded.live).toBe(false);
    expect(loaded.provenance).toMatch(/signed snapshot whose status document marks it CURRENT/);
  });

  it("loads all 6 universal GSPC cohorts from /interop/gspc-universal-ledger.json with own-entity self-exclusion", () => {
    const ledgerPath = resolve(__dirname, "../../../public/interop/gspc-universal-ledger.json");
    const raw = JSON.parse(readFileSync(ledgerPath, "utf8"));

    const measurers = loadMeasurersAndHarnesses(raw);
    expect(measurers.rows).toHaveLength(22); // 24 total minus 2 own-entity rows listed apart
    expect(measurers.rows.some((r) => /csoai/i.test(r.name))).toBe(false);
    expect(
      measurers.aside.some((a) => /listed apart, never self-ranked/i.test(a.label)),
    ).toBe(true);

    const agents = loadAgentAndMcpHarnesses(raw);
    expect(agents.rows).toHaveLength(14); // 17 total minus 3 own-entity rows (csoai.org, gspc, council-os)
    expect(agents.rows.some((r) => r.name === "csoai.org" || r.name === "gspc" || r.name === "council-os")).toBe(false);

    const wgs = loadInteropWorkingGroups(raw);
    expect(wgs.rows).toHaveLength(12);

    const labs = loadAiLabs(raw);
    expect(labs.rows).toHaveLength(10);

    const humanoids = loadHumanoidLabsAndDeployments(raw);
    expect(humanoids.rows).toHaveLength(38); // 8 signed vendor probes + 30 named public deployments
    expect(
      humanoids.rows.filter((r) => r.runAttestation === "ED25519_SIGNED"),
    ).toHaveLength(8);

    const companies = loadAiCompanies(raw);
    expect(companies.rows).toHaveLength(32);

    const setIds = AXIS_SETS.map((s) => s.id);
    expect(setIds).toEqual(
      expect.arrayContaining([
        "measurers-harnesses",
        "agent-mcp-harnesses",
        "interop-working-groups",
        "ai-labs",
        "humanoid-labs",
        "ai-companies",
        "osaia-safe-reverification",
        "agent-layer-arena-hitl",
      ]),
    );
  });

  it("loads OSAIA SAFE v0.2 re-verification, 417 frozen EU provisions, and Agent Layer / Arena / Academy HITL from /interop/gspc-agent-layer-safe-arena.json", () => {
    const alsaPath = resolve(__dirname, "../../../public/interop/gspc-agent-layer-safe-arena.json");
    const raw = JSON.parse(readFileSync(alsaPath, "utf8"));

    const safeSet = loadOsaiaSafeAndClaimMaintenance(raw);
    expect(safeSet.rows).toHaveLength(10);
    expect(safeSet.rows.filter((r) => r.status === "MEASURED")).toHaveLength(9);
    expect(safeSet.rows.filter((r) => r.status === "UNMEASURED")).toHaveLength(1);
    expect(
      safeSet.aside.some((a) => /417 frozen provisions across 6 EU instruments/i.test(a.value)),
    ).toBe(true);

    const agentArenaSet = loadAgentLayerArenaAndAcademyHitl(raw);
    // 5 AX protocols + 4 MEOK/H.I.M. loop actions + 1 Arena + 1 Council City + 9 Academy HITL exercises = 20 rows
    expect(agentArenaSet.rows).toHaveLength(20);
    expect(
      agentArenaSet.rows.some((r) => r.id === "arena:head-to-head-scoreboard" && r.n === 4760),
    ).toBe(true);
    expect(
      agentArenaSet.rows.some((r) => r.id === "city:red-vs-blue-simulation" && r.n === 400),
    ).toBe(true);
  });
});

