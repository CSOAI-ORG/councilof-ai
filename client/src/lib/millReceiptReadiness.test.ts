import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { isMillReceiptReadiness, loadMillReceiptReadiness, MILL_RECEIPT_POINTER, MILL_RECEIPT_SNAPSHOT, regulationLabel,
  type MillReceipt } from "./millReceiptReadiness";

const row: MillReceipt = {
  id: "a".repeat(64), card_url: "/card.json", model: "model", axis: "governance", measured_at: null,
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "STAGED_UNSIGNED",
  regulatory_linkage: { state: "UNLINKED", source_state: "UNLINKED", refs: [], regulation_score_eligible: false },
};

describe("mill receipt readiness", () => {
  it("keeps outer validity separate from declared lifecycle", () => {
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v1", receipts: [row] })).toBe(true);
    expect(row.outer_signature.state).toBe("VALID");
    expect(row.declared_lifecycle).toBe("STAGED_UNSIGNED");
  });
  it("prohibits regulation-scored language for unlinked receipts", () => {
    expect(regulationLabel(row)).toBe("unlinked; no regulation score");
    const falseClaim = structuredClone(row);
    falseClaim.regulatory_linkage.regulation_score_eligible = true;
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v1", receipts: [falseClaim] })).toBe(false);
  });

  it("reads the v2 file (signed receipts) instead of rejecting it whole", () => {
    // Shape of the live /interop/mill-receipt-readiness.json on 6 Oct 2026 (schema v2, SIGNED).
    const signed: MillReceipt = { ...structuredClone(row), declared_lifecycle: "SIGNED" };
    const v2 = {
      schema: "csoai.mill-receipt-readiness/v2",
      truth_rule: "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states.",
      counts: { receipts: 1, outer_signature_valid: 1, declared_staged_unsigned: 0, declared_signed: 1, regulatory_linked: 0, regulatory_unlinked: 1 },
      receipts: [signed],
    };
    expect(isMillReceiptReadiness(v2)).toBe(true);
  });
  it("shows an INVALID or UNCHECKABLE outer signature rather than hiding the file", () => {
    for (const state of ["INVALID", "UNCHECKABLE"] as const) {
      const r = structuredClone(row);
      r.outer_signature.state = state;
      expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v2", receipts: [r] })).toBe(true);
    }
    const unknown = structuredClone(row) as unknown as { outer_signature: { state: string } };
    unknown.outer_signature.state = "PROBABLY_FINE";
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v2", receipts: [unknown] })).toBe(false);
    expect(isMillReceiptReadiness({ schema: "csoai.mill-receipt-readiness/v3", receipts: [row] })).toBe(false);
  });

  describe("loading through the discovery pointer", () => {
    const version = "/interop/mill-receipt-readiness-2026-10-07-0123456789ab.json";
    const bytes = JSON.stringify({ schema: "csoai.mill-receipt-readiness/v2", truth_rule: "t", counts: { receipts: 1 },
      receipts: [{ ...structuredClone(row), declared_lifecycle: "SIGNED" }] });
    const pointerFor = (over: Record<string, unknown> = {}) => JSON.stringify({ schema: "csoai.mill-receipt-readiness-pointer/1",
      kind: "DISCOVERY_POINTER_ONLY", index_url: version,
      index_sha256: createHash("sha256").update(bytes).digest("hex"), ...over });
    const serve = (pointer: string | null, file = bytes) => {
      const seen: string[] = [];
      const fetcher = (async (input: RequestInfo | URL) => {
        const path = String(input);
        seen.push(path);
        if (path === MILL_RECEIPT_POINTER) return pointer === null ? new Response("not found", { status: 404 }) : new Response(pointer);
        if (path === version || (pointer === null && path === MILL_RECEIPT_SNAPSHOT)) return new Response(file);
        return new Response("the stamped snapshot must not be read when a pointer exists", { status: 500 });
      }) as typeof fetch;
      return { fetcher, seen };
    };

    it("reads the version the pointer selects, and only its exact bytes", async () => {
      const { fetcher, seen } = serve(pointerFor());
      const data = await loadMillReceiptReadiness(fetcher);
      expect(data.receipts[0].declared_lifecycle).toBe("SIGNED");
      expect(seen).toEqual([MILL_RECEIPT_POINTER, version]);
    });

    it("falls back to the stamped snapshot only when no pointer is deployed", async () => {
      const { fetcher, seen } = serve(null);
      await loadMillReceiptReadiness(fetcher);
      expect(seen).toEqual([MILL_RECEIPT_POINTER, MILL_RECEIPT_SNAPSHOT]);
    });

    it("rejects bytes the pointer did not name, and a pointer outside the versioned set", async () => {
      await expect(loadMillReceiptReadiness(serve(pointerFor(), bytes + " ").fetcher)).rejects.toThrow(/sha256/);
      for (const bad of [pointerFor({ index_url: "/interop/other.json" }), pointerFor({ index_url: "/interop/../secrets.json" }),
                         pointerFor({ schema: "csoai.mill-receipt-readiness-pointer/0" }), pointerFor({ index_sha256: "x" }), "<html>"]) {
        await expect(loadMillReceiptReadiness(serve(bad).fetcher)).rejects.toThrow(/pointer/);
      }
    });
  });
});
