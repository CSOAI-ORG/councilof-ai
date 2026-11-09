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

  // The machine-readable discovery sample must describe what its own preview returns.
  it("matches its Bazaar example to the declared free preview", async () => {
    const challenge = await call();
    const body = (await challenge.json()) as {
      extensions: { bazaar: { info: {
        input: { queryParams: { asset: string; preview: string } };
        output: { example: { asset: unknown; state: string; as_of: string } };
      } } };
    };
    const sample = body.extensions.bazaar.info;
    expect(sample.input.queryParams.preview).toBe("1");
    const preview = await call(
      `https://councilof.ai/api/coverage-evidence?asset=${encodeURIComponent(sample.input.queryParams.asset)}&preview=1`,
    );
    expect(preview.status).toBe(200);
    const actual = (await preview.json()) as { asset: unknown; state: string; as_of: string };
    expect(sample.output.example.asset).toEqual(actual.asset);
    expect(sample.output.example.state).toBe(actual.state);
    expect(sample.output.example.as_of).toBe(actual.as_of);
  });

  it("keeps the requested asset in the challenge preview", async () => {
    const challenge = await call("https://councilof.ai/api/coverage-evidence?asset=373");
    expect(challenge.status).toBe(402);
    const body = (await challenge.json()) as { csoai: { free_preview: string } };
    const preview = await call(body.csoai.free_preview);
    const actual = (await preview.json()) as { asset: { defillama_id: string } };
    expect(preview.status).toBe(200);
    expect(actual.asset.defillama_id).toBe("373");
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
