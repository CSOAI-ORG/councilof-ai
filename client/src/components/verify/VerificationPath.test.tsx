/**
 * "Last verified" is printed only when the browser check ran at least one hop (tools audit,
 * 6 Oct 2026). An UNCHECKABLE result (a pasted id, malformed JSON) used to carry a timestamp
 * labelled "Last verified", which read as a pass.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import VerificationPath, { hopsFrom, lastVerifiedApplies } from "./VerificationPath";
import type { RecordVerdict } from "@/lib/recordVerify";

const UNCHECKABLE = {
  valid: false,
  state: "UNCHECKABLE",
  reasons: ["parse_error"],
  family: "unknown",
  lines: [{ label: "Parse", ok: false, code: "parse_error", detail: "Not valid JSON — nothing was checked." }],
} as unknown as RecordVerdict;

const VALID = {
  valid: true,
  state: "VALID",
  reasons: [],
  family: "card-v1",
  lines: [
    { label: "Parse", ok: true, code: "parse_ok", detail: "Valid JSON." },
    { label: "Content id", ok: true, code: "content_id", detail: "sha256 of the canonical body matches the id." },
    { label: "Signature", ok: true, code: "signature_valid", detail: "Ed25519 signature verifies." },
  ],
} as unknown as RecordVerdict;

describe("VerificationPath — Last verified", () => {
  it("no hop runs for an UNCHECKABLE parse error", () => {
    expect(lastVerifiedApplies(hopsFrom(UNCHECKABLE))).toBe(false);
    expect(lastVerifiedApplies(hopsFrom(null))).toBe(false);
  });

  it("a check that ran a hop is what 'Last verified' means", () => {
    expect(lastVerifiedApplies(hopsFrom(VALID))).toBe(true);
  });

  it("prints 'Not checked yet' beside an UNCHECKABLE result, never 'Last verified'", () => {
    const html = renderToStaticMarkup(
      <VerificationPath verdict={UNCHECKABLE} cardId={null} indexIds={null} checkedAt="2026-10-06T12:00:00.000Z" />,
    );
    expect(html).toContain("Not checked yet");
    expect(html).not.toContain("Last verified");
    const ran = renderToStaticMarkup(
      <VerificationPath verdict={VALID} cardId={null} indexIds={null} checkedAt="2026-10-06T12:00:00.000Z" />,
    );
    expect(ran).toContain("Last verified");
    expect(ran).toContain("2026-10-06 12:00:00Z, in this browser");
  });
});
