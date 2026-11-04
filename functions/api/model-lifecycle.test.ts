import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_LIFECYCLE_SNAPSHOT } from "./_model-lifecycle-snapshot";
import { onRequestGet } from "./model-lifecycle";

/**
 * The model-lifecycle ledger: upstream availability of a model family, joined to the measurement
 * this estate holds for it.
 *
 * The failure this file exists to catch is NOT "the numbers are wrong". It is that a family whose
 * measurement we hold has since been retired by its vendor, and the ledger either says so or does
 * not. MiniMax-M2.7 is the live case: 5 signed cards on 5 axes, and the vendor lists it under
 * "Retired Models" (read 2026-11-03).
 *
 * The second failure is quieter and worse: a family boundary that does not hold. "MiniMax-M2" must
 * NOT inherit "MiniMax-M2.7"'s five cards. A join that matches on a prefix would report a
 * measurement we never made, on a retired family, and publish it.
 *
 * The third is a number attached to something that does not exist. MiniMax-M4 has no identifier,
 * no release date and no entry in the vendor's model list or release notes. It may be listed as
 * NOT_RELEASED; it may not carry a count, a date or a measurement.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEDGER = join(ROOT, "public", "interop", "model-lifecycle.json");
const UPSTREAM = join(ROOT, "public", "interop", "model-lifecycle-upstream.json");
const SOURCE = join(ROOT, "functions", "api", "model-lifecycle.ts");

type Row = {
  model: string;
  released: string | null;
  upstream_status: string;
  estate: {
    state: string;
    cards: number;
    axes: number;
    models: { id: string; cards: number; axes: number }[];
    rule: string;
  };
};

const ledger = JSON.parse(readFileSync(LEDGER, "utf8")) as {
  schema: string;
  title: string;
  as_of: string;
  record_type: string;
  freshness: Record<string, unknown>;
  not_this: string[];
  not_claimed: string[];
  coverage: Record<string, number | string>;
  estate_measurement: { inputs: Record<string, unknown> };
  rows: Row[];
};
const upstream = JSON.parse(readFileSync(UPSTREAM, "utf8")) as {
  as_of: string;
  vendor: string;
  sources: { id: string; url: string; read_on: string }[];
  families: { model: string; upstream_status: string }[];
  status_vocabulary: Record<string, string>;
};
const row = (model: string): Row => {
  const r = ledger.rows.find((x) => x.model === model);
  if (!r) throw new Error(`model-lifecycle: no row for ${model}`);
  return r;
};

describe("GET /api/model-lifecycle — the ledger is what it claims to be", () => {
  it("answers 200 with the ledger and its own schema", async () => {
    const res = await onRequestGet({
      request: new Request("https://councilof.ai/api/model-lifecycle"),
    } as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { schema: string };
    expect(body.schema).toBe("csoai.model-lifecycle/0.1");
  });

  it("the published file and the served bytes are the same document", () => {
    expect(JSON.parse(JSON.stringify(MODEL_LIFECYCLE_SNAPSHOT))).toEqual(ledger);
  });

  it("is reproducible: the builder's own --check passes against the committed bytes", () => {
    // The ledger is DERIVED, not asserted. If the two committed corpora move and the ledger does
    // not, this fails — which is the point of shipping the derivation instead of a typed number.
    const out = execFileSync(process.execPath, ["scripts/build-model-lifecycle.mjs", "--check"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(out).toContain("up to date");
  });

  it("carries a date and no serve-time clock", () => {
    expect(ledger.as_of).toBe(upstream.as_of);
    const src = readFileSync(SOURCE, "utf8");
    expect(src, "a serve-time clock would make as_of move on its own").not.toMatch(/new Date\(|Date\.now\(/);
  });

  it("every row's upstream status comes from the stated vocabulary", () => {
    const allowed = Object.keys(upstream.status_vocabulary);
    for (const r of ledger.rows) {
      expect(allowed, `${r.model} carries an unstated status ${r.upstream_status}`).toContain(
        r.upstream_status,
      );
    }
  });

  it("every row says MEASURED or UNMEASURED, and the counts agree with the state", () => {
    for (const r of ledger.rows) {
      expect(["MEASURED", "UNMEASURED"]).toContain(r.estate.state);
      if (r.estate.state === "MEASURED") {
        expect(r.estate.cards, `${r.model} is MEASURED with no card`).toBeGreaterThan(0);
        expect(r.estate.models.length, `${r.model} is MEASURED with no model id`).toBeGreaterThan(0);
      } else {
        expect(r.estate.cards, `${r.model} is UNMEASURED but carries cards`).toBe(0);
        expect(r.estate.axes, `${r.model} is UNMEASURED but carries axes`).toBe(0);
        expect(r.estate.rule, `${r.model} does not say why it is unmeasured`).toMatch(/no signed/i);
      }
    }
  });

  it("a retired family does not inherit a retireder's measurement (the boundary)", () => {
    // The specific bug the join rule exists to prevent.
    expect(row("MiniMax-M2").estate.state).toBe("UNMEASURED");
    expect(row("MiniMax-M2.7").estate.state).toBe("MEASURED");
    expect(row("MiniMax-M2.7").estate.cards).toBeGreaterThan(0);
    expect(row("MiniMax-M2").estate.cards).toBe(0);
    // And the same for the family whose id is a prefix of another family's id.
    expect(row("MiniMax-M2.1").estate.state).toBe("UNMEASURED");
    expect(row("MiniMax-M2.5").estate.state).toBe("UNMEASURED");
  });

  it("the family we have measured is the one the vendor retired, and the ledger says so", () => {
    const measured = ledger.rows.filter((r) => r.estate.state === "MEASURED");
    expect(measured.length).toBeGreaterThan(0);
    for (const r of measured) {
      expect(
        ["AVAILABLE", "RETIRED"],
        `${r.model} is measured and its upstream status is neither available nor retired`,
      ).toContain(r.upstream_status);
    }
    const retiredAndMeasured = ledger.rows.filter(
      (r) => r.estate.state === "MEASURED" && r.upstream_status === "RETIRED",
    );
    expect(
      retiredAndMeasured.length,
      "no family is both measured and retired — the coverage count would be wrong",
    ).toBe(ledger.coverage.measured_and_retired_upstream);
  });

  it("the current generation is not measured, and that is recorded as absent rather than zero", () => {
    // M3 and M3.1 Flash are AVAILABLE upstream. This estate holds no signed card for them yet.
    // The ledger must say UNMEASURED — not 0, not a score, not a comparison.
    expect(row("MiniMax-M3").upstream_status).toBe("AVAILABLE");
    expect(row("MiniMax-M3").estate.state).toBe("UNMEASURED");
    expect(row("MiniMax-M3.1-Flash").upstream_status).toBe("AVAILABLE");
    expect(row("MiniMax-M3.1-Flash").estate.state).toBe("UNMEASURED");
    expect(ledger.coverage.available_families_without_measurement).toBeGreaterThan(0);
  });

  it("a family that has not been released carries no number", () => {
    const m4 = row("MiniMax-M4");
    expect(m4.upstream_status).toBe("NOT_RELEASED");
    expect(m4.released, "M4 has no release date and must not be given one").toBeNull();
    expect(m4.estate.state).toBe("UNMEASURED");
    expect(m4.estate.cards).toBe(0);
    expect(m4.estate.axes).toBe(0);
  });

  it("the coverage counts are derived, not typed", () => {
    const c = ledger.coverage;
    expect(c.families_listed).toBe(ledger.rows.length);
    expect(c.families_with_signed_measurement).toBe(
      ledger.rows.filter((r) => r.estate.state === "MEASURED").length,
    );
    expect(c.families_not_released).toBe(
      ledger.rows.filter((r) => r.upstream_status === "NOT_RELEASED").length,
    );
  });

  it("is free to verify and never a certification, and says what it is not", () => {
    expect(ledger.verify_free).toBe(true);
    expect((ledger as unknown as { certification: boolean }).certification).toBe(false);
    expect(ledger.not_this.length).toBeGreaterThan(0);
    expect(ledger.not_claimed.length).toBeGreaterThan(0);
    // The ledger may SAY it is not a ranking; it may not BE one. A bare substring scan cannot
    // tell those apart — "No model is ranked, scored, graded, certified or approved here" is the
    // disclaimer, and it trips the same scan as a ranking claim would. So every sentence that
    // mentions a ranking must also deny one.
    for (const sentence of JSON.stringify(ledger).split(/[.;]/)) {
      if (/\b(is|are) ranked\b/i.test(sentence)) {
        expect(
          /\b(no|not|never)\b/i.test(sentence),
          `a sentence ranks without denying it: ${sentence.slice(0, 120)}`,
        ).toBe(true);
      }
    }
    // And no row carries a rank, a score or a grade field at all.
    for (const r of ledger.rows) {
      expect(Object.keys(r)).not.toContain("rank");
      expect(Object.keys(r.estate)).not.toContain("score");
      expect(Object.keys(r.estate)).not.toContain("grade");
    }
  });

  it("the upstream read keeps its source, its date, and the vendor's own wording", () => {
    expect(upstream.sources.length).toBeGreaterThan(0);
    for (const s of upstream.sources) {
      expect(s.url, "a source without a URL cannot be re-read").toMatch(/^https:\/\//);
      expect(s.read_on).toBe(upstream.as_of);
    }
    expect(ledger.freshness.upstream_read_on).toBe(upstream.as_of);
    // The retirement notice is the vendor's own text, not ours.
    expect(ledger.as_of).toBe(upstream.as_of);
  });
});
