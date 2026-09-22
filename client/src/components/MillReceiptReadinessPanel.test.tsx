import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MillReceiptReadinessView } from "./MillReceiptReadinessPanel";
import { isMillReceiptReadiness, type MillReceipt, type MillReceiptReadiness } from "@/lib/millReceiptReadiness";

const base: MillReceipt = {
  id: "a".repeat(64),
  card_url: "/interop/mill-cards-signed/signed-art5-aaaaaaaaaaaa.json",
  model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
  axis: "art5-safeguard",
  status: "MEASURED",
  unmeasured: [],
  measured_at: "2026-09-11T05:46:39Z",
  measured_at_absence: null,
  outer_signature: { state: "VALID", alg: "Ed25519", key: "did:web:csoai.org#board-attestation-1" },
  declared_lifecycle: "SIGNED",
  regulatory_linkage: {
    state: "LINKED",
    source_state: "DIRECT",
    refs: ["Regulation (EU) 2024/1689 Article 5"],
    regulation_score_eligible: true,
  },
};

const dateless: MillReceipt = {
  ...structuredClone(base),
  id: "b".repeat(64),
  card_url: "/interop/mill-cards-signed/signed-detector-bbbbbbbbbbbb.json",
  axis: "detector-interop",
  measured_at: null,
  measured_at_absence: "the signed body carries no measured_at field: this card is MEASURED but was signed without a date",
  regulatory_linkage: { state: "UNLINKED", source_state: "UNLINKED", refs: [], regulation_score_eligible: false },
};

const unmeasured: MillReceipt = {
  ...structuredClone(dateless),
  id: "c".repeat(64),
  card_url: "/interop/mill-cards-signed/signed-safety-cccccccccccc.json",
  axis: "safety",
  status: "UNMEASURED",
  unmeasured: ["n<30 unquotable"],
  measured_at_absence: "the signed body carries no measured_at field: this card is UNMEASURED (n<30 unquotable), so there is no measurement date to record",
};

const data: MillReceiptReadiness = {
  schema: "csoai.mill-receipt-readiness/v2",
  truth_rule: "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states.",
  counts: {
    receipts: 3,
    outer_signature_valid: 3,
    declared_staged_unsigned: 0,
    declared_signed: 3,
    regulatory_linked: 1,
    regulatory_unlinked: 2,
    regulation_score_eligible: 1,
  },
  receipts: [base, dateless, unmeasured],
};

describe("mill receipt readiness panel", () => {
  it("renders the receipts the v2 contract admits", () => {
    expect(isMillReceiptReadiness(data)).toBe(true);
    const html = renderToStaticMarkup(<MillReceiptReadinessView data={data} />);
    expect(html).toContain("mill-receipt-readiness");
    expect(html).toContain("2026-09-11T05:46:39Z");
    expect(html).toContain("Declared SIGNED");
    expect(html).toContain("Regulation (EU) 2024/1689 Article 5");
    expect(html).toContain("/interop/mill-cards-signed/signed-safety-cccccccccccc.json");
    expect(html).not.toContain("STAGED_UNSIGNED");
  });

  it("renders the two null dates as different states, and neither as an em dash", () => {
    const html = renderToStaticMarkup(<MillReceiptReadinessView data={data} />);
    expect(html).toContain("UNMEASURED · n&lt;30 unquotable");
    expect(html).toContain("MEASURED · signed without a date");
    expect(html).toContain("so there is no measurement date to record");
    expect(html).toContain("this card is MEASURED but was signed without a date");
    expect(html).not.toContain("—");
  });
});
