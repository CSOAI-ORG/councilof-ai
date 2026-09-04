import { describe, expect, it, vi } from "vitest";
import { AXES_FIN } from "../../../functions/api/_gspc_axes_fin";
import { AXIS_SETS, fetchPublishedSet, loadBoard } from "./axis-sets";

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
});
