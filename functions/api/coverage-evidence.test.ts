import { describe, expect, it } from "vitest";
import { KIND, onRequestGet } from "./coverage-evidence";
import { COVERAGE } from "./_coverage_rows";

const call = async (u = "https://councilof.ai/api/coverage-evidence?asset=tether") =>
  (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(u),
    env: {},
  });

describe("/api/coverage-evidence — the TUI-2 assembled row as a paid door", () => {
  // A stranger with no payment header gets a priced challenge, not a free row.
  it("answers 402 to a stranger — the listing needs a payable resource", async () => {
    const res = await call();
    expect(res.status).toBe(402);
    const b = (await res.json()) as { resource: { url: string }; accepts: { resource?: string }[] };
    // path-scoped: the buyer's asset query never appears in the challenge
    expect(b.resource.url).not.toContain("asset=");
    expect(b.accepts[0].resource ?? "").not.toContain("asset=");
  });

  // An unresolvable target (what the parity test swaps in) must still challenge — never 404
  // an indexer into recording a dead listing.
  it("challenges, never raw-errors, when the asset cannot be resolved", async () => {
    const res = await call("https://councilof.ai/api/coverage-evidence?asset=BUYER_PRIVATE_VALUE");
    expect(res.status).toBe(402);
    const b = (await res.json()) as { csoai: { input_note?: string } };
    expect(b.csoai.input_note).toContain("not in this coverage record");
  });

  // The free preview is the evaluation surface: identity + state + as_of, no payment header.
  it("serves the free preview with state and provenance header for a real asset", async () => {
    const res = await call("https://councilof.ai/api/coverage-evidence?asset=tether&preview=1");
    expect(res.status).toBe(200);
    const b = (await res.json()) as { state: string; canonical: { sha256: string }; preview: boolean };
    expect(b.preview).toBe(true);
    expect(b.state).toBe("DEEP_MEASURED");
    expect(b.canonical.sha256).toBe(COVERAGE.canonical_sha256);
  });

  // The three states never collapse: the embedded record carries exactly the canonical counts.
  it("embeds the canonical record's counts without collapsing states", async () => {
    const rows = Object.values(COVERAGE.rows);
    const tally = rows.filter((r) => r.st === "DEEP_MEASURED").length;
    const reason = rows.filter((r) => r.st === "UNMEASURED_REASON_DOCUMENTED").length;
    const meta = rows.filter((r) => r.st === "INDEXED_METADATA_ONLY").length;
    expect(tally).toBe(COVERAGE.counts.deep);
    expect(reason).toBe(COVERAGE.counts.reason);
    expect(meta).toBe(COVERAGE.counts.metadata_only);
    expect(tally + reason + meta).toBe(COVERAGE.counts.indexed);
    expect(rows.length).toBe(COVERAGE.counts.indexed);
  });

  // Every UNMEASURED row carries its published reason — an unmeasured row without one is a hole.
  it("gives every UNMEASURED_REASON_DOCUMENTED row its published reason", async () => {
    const holes = Object.entries(COVERAGE.rows)
      .filter(([, r]) => r.st === "UNMEASURED_REASON_DOCUMENTED" && !r.rsn)
      .map(([id]) => id);
    expect(holes, `rows missing a published reason: ${holes.join(",")}`).toEqual([]);
  });

  // Measurement is not certification — the schema says so in every response surface.
  it("declares measurement_not_certification on the record", () => {
    expect(COVERAGE.measurement_not_certification).toBe(true);
    expect(COVERAGE.signed_evidence_packs).toBe(0);
    expect(KIND).toBe("csoai.coverage-evidence/0.1");
  });
});
