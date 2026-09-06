import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { headline } from "./x402-census/index";
import { entries } from "../feeds/x402-census.xml";
import index from "../../public/interop/x402-census/index.json";
import roundSchema from "../../public/schema/x402-census-round-v1.json";
import deltaSchema from "../../public/schema/x402-census-delta-v1.json";

const REPO = resolve(__dirname, "../..");
const py = (args: string[]) =>
  execFileSync("python3", args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const idx = index as unknown as {
  rounds: { round_id: string; probed: number; outcome: Record<string, number> }[];
  deltas: unknown[];
  ladder: { n_required: number; hosts_at_or_above_n_required: number; hosts_by_observations: Record<string, number> };
  caveats: string[];
};

describe("x402 census producers are deterministic and a planted byte fails --check", () => {
  // The whole surface rests on one claim: a stranger can recompute every number from the committed
  // rows. Each producer proves that about itself in --selftest, which renders twice, compares the
  // bytes, then plants a single byte in the rows and asserts that --check goes red. A gate nobody
  // has watched fail is decoration, so the failing half lives inside the selftest, not in a comment.
  it("round producer: --selftest passes (determinism, counts, schema binds, planted byte fails)", () => {
    const out = py(["scripts/grants/x402_census_round.py", "--selftest"]);
    expect(out).toContain("selftest OK");
    expect(out).toContain("planted change fails --check");
  });

  it("delta producer: --selftest passes (transitions, drift, take-and-refuse, ladder, planted byte)", () => {
    const out = py(["scripts/grants/x402_census_delta.py", "--selftest"]);
    expect(out).toContain("selftest OK");
    expect(out).toContain("ladder UNMEASURED");
  });

  it("card producer: --selftest passes (PAID-only, frozen ladder, 3 KB cap, planted byte)", () => {
    const out = py(["harness/x402-census/build_cards.py", "--selftest"]);
    expect(out).toContain("selftest OK");
    expect(out).toContain("frozen ladder");
  });

  it("the committed round artefacts still recompute from the committed rows", () => {
    expect(py(["scripts/grants/x402_census_round.py", "--check"])).toContain("CHECK OK");
  });
});

describe("the published schemas bind the published artefacts", () => {
  it("names the surfaces and pins the constants they are allowed to carry", () => {
    expect(roundSchema.properties.schema.const).toBe("csoai.x402-census.round/0.1");
    expect(deltaSchema.properties.schema.const).toBe("csoai.x402-census.delta/0.1");
    // The threshold is a ruling, not a knob: a delta may not publish a different one.
    expect(deltaSchema.properties.ladder.properties.n_required.const).toBe(30);
    expect(deltaSchema.properties.ladder.properties.state_of_every_host.enum).toContain("UNMEASURED");
  });

  it("requires the caveats to travel INSIDE the artefact, never in a covering note", () => {
    expect(roundSchema.required).toContain("caveats");
    expect(deltaSchema.required).toContain("caveats");
    expect(deltaSchema.required).toContain("what_this_is_not");
    expect(roundSchema.properties.caveats.minItems).toBeGreaterThanOrEqual(2);
  });
});

describe("/interop/x402-census/ and its feed derive every number", () => {
  it("the headline is read from the newest round, not typed", () => {
    const h = headline(index as never);
    const r = idx.rounds[0];
    expect(h.probed).toBe(r.probed);
    expect(h.refused).toBe(r.outcome.REFUSED);
    expect(h.round_id).toBe(r.round_id);
    expect(h.refused_pct).toBe(Math.round(((r.outcome.REFUSED ?? 0) / r.probed) * 1000) / 10);
  });

  it("the page types no host count of its own", () => {
    const src = readFileSync(resolve(__dirname, "x402-census/index.ts"), "utf8");
    // 316 and 213 are today's numbers. Hard-coded into the page, either would outlive the round
    // that produced it — which is exactly how a surface starts lying by staleness.
    expect(src).not.toMatch(/\b316\b/);
    expect(src).not.toMatch(/\b213\b/);
  });

  it("says 'no delta yet' rather than rendering an empty list as 'nothing changed'", () => {
    if (idx.deltas.length === 0) {
      expect(entries().some((x) => /No delta yet|No delta published/.test(x.title))).toBe(true);
    } else {
      expect(entries().some((x) => /What changed/.test(x.title))).toBe(true);
    }
  });

  it("every feed item carries the refusal caveat, so no item can travel without it", () => {
    for (const e of entries()) {
      expect(e.body).toMatch(/REFUSED is not proof of bad faith|A delta needs two/);
    }
  });

  it("is listed on /feeds, so it is reachable without knowing the path", () => {
    const src = readFileSync(resolve(__dirname, "../feeds/index.ts"), "utf8");
    expect(src).toContain("/feeds/x402-census.xml");
  });
});

describe("no per-host verdict is published below the threshold", () => {
  it("the ladder reports zero hosts at n>=30 and says how far away it is", () => {
    expect(idx.ladder.n_required).toBe(30);
    expect(idx.ladder.hosts_at_or_above_n_required).toBe(0);
    // one observation accrues per host per round, so nothing can exceed the number of rounds
    const maxObs = Math.max(...Object.keys(idx.ladder.hosts_by_observations).map(Number));
    expect(maxObs).toBeLessThanOrEqual(idx.rounds.length);
  });

  it("the bare word MEASURED appears nowhere in the published index", () => {
    const raw = readFileSync(resolve(REPO, "public/interop/x402-census/index.json"), "utf8");
    expect(raw.replace(/UNMEASURED/g, "")).not.toContain("MEASURED");
  });

  it("the caveats a reader needs are in the artefact itself", () => {
    expect(idx.caveats.join(" ")).toMatch(/REFUSED is not proof of bad faith/);
    expect(idx.caveats.join(" ")).toMatch(/One purchase per host, one moment/);
  });
});

describe("the gate that runs the census selftests cannot be masked by its own skip twin", () => {
  // pr-gates.yml and pr-gates-skip.yml both report the check name `gates`; the skip twin exists so
  // branch protection can require `gates` on docs-only PRs. They stay safe only while pr-gates.yml's
  // `paths` and pr-gates-skip.yml's `paths-ignore` are identical. When they drift, a PR touching a
  // path that is gated but NOT ignored fires both, and the two-second skip pass can be the one a
  // reader sees while the real suite is red. This PR widened `paths` to cover harness/x402-census
  // and PRODUCERS.json, so the invariant now has a test instead of a comment asking politely.
  const list = (file: string, key: "paths" | "paths-ignore"): string[] => {
    const lines = readFileSync(resolve(REPO, ".github/workflows", file), "utf8").split("\n");
    const start = lines.findIndex((l) => new RegExp(`^\\s*${key}:\\s*$`).test(l));
    if (start < 0) return [];
    const out: string[] = [];
    for (const line of lines.slice(start + 1)) {
      const m = /^\s+-\s+'([^']+)'\s*$/.exec(line);
      if (!m) break;                    // the list ends at the first line that is not an item
      out.push(m[1]);
    }
    return out;
  };

  it("pr-gates paths and pr-gates-skip paths-ignore are the same list", () => {
    const gated = list("pr-gates.yml", "paths");
    const ignored = list("pr-gates-skip.yml", "paths-ignore");
    expect(gated.length).toBeGreaterThan(5);
    expect(ignored).toEqual(gated);
  });
  it("the census selftests are wired into the real gate, not only into this file", () => {
    const src = readFileSync(resolve(REPO, ".github/workflows/pr-gates.yml"), "utf8");
    for (const p of [
      "scripts/grants/x402_census_round.py --selftest",
      "scripts/grants/x402_census_delta.py --selftest",
      "harness/x402-census/build_cards.py --selftest",
    ]) {
      expect(src).toContain(p);
    }
  });
});
