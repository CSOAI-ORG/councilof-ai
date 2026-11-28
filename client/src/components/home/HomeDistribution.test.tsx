import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeDistribution, { distributionRead } from "./HomeDistribution";
import type { DistributionArtifact, DistributionPackage } from "./useHomeReads";
import SELF_READ_IDS from "@/data/hf-self-read-ids.json";
import { SELF_READ_DATASETS } from "../../../../functions/api/_momentum";
import committed from "../../../../public/interop/distribution-latest.json";

// Every CSOAI figure expected here is summed from the census's package rows, never typed: CSOAI's
// headline is its rows without the ten Hugging Face datasets our own services read, and those ten are
// printed apart (24 Nov 2026). by_entity's CSOAI pair is rolled up from the same rows with the census
// producer's rule (scripts/distribution-measure.py by_entity()), so the two parts add back up to it.
const nf = new Intl.NumberFormat("en-GB");
const asOf = "2026-11-23T19:11:15Z";
type Field = "downloads_all_time" | "downloads_30d";
const FIELDS: Field[] = ["downloads_all_time", "downloads_30d"];
const SELF = new Set(SELF_READ_IDS as string[]);
const isSelf = (p: DistributionPackage) => p.registry === "huggingface" && SELF.has(p.name as string);
const sum = (rows: DistributionPackage[], f: Field) => rows.reduce((a, p) => a + (typeof p[f] === "number" ? (p[f] as number) : 0), 0);
const rollUp = (rows: DistributionPackage[], f: Field) => {
  const covered = rows.filter((p) => typeof p[f] === "number").length;
  return { state: covered === rows.length ? "READ" : "PARTIAL", value: sum(rows, f), covered, attempted: rows.length, as_of: asOf };
};

// The ten self-read datasets and 208 other CSOAI rows, in the census's shape.
const csoai: DistributionPackage[] = [
  ...(SELF_READ_IDS as string[]).map((name, i) => ({ registry: "huggingface", name, entity: "csoai", downloads_all_time: 40000 + 731 * i, downloads_30d: 25000 + 419 * i })),
  ...Array.from({ length: 208 }, (_, i) => ({
    registry: i < 24 ? "pypi" : "huggingface", name: i < 24 ? `csoai-package-${i}` : `csoai/dataset-${i}`,
    entity: "csoai", downloads_all_time: 1500 + 37 * i, downloads_30d: 800 + 19 * i,
  })),
];
const meokRow = { registry: "pypi", name: "meok-example", entity: "meok", downloads_all_time: 1, downloads_30d: 1 };
const meok = {
  downloads_all_time: { state: "PARTIAL", value: 2859565, covered: 317, attempted: 318, as_of: asOf },
  downloads_30d: { state: "PARTIAL", value: 272537, covered: 317, attempted: 318, as_of: asOf },
};

function census(rows: DistributionPackage[] = csoai): DistributionArtifact {
  const own = rows.filter((p) => p.entity === "csoai");
  return {
    schema: "csoai.distribution/0.1",
    as_of: asOf,
    max_age_hours: 48,
    totals: {
      downloads_all_time: { state: "PARTIAL", value: sum(own, "downloads_all_time") + meok.downloads_all_time.value, covered: 914, attempted: 915, as_of: asOf },
      downloads_30d: { state: "PARTIAL", value: sum(own, "downloads_30d") + meok.downloads_30d.value, covered: 914, attempted: 915, as_of: asOf },
    },
    by_entity: {
      downloads_all_time: { meok: meok.downloads_all_time, csoai: rollUp(own, "downloads_all_time") },
      downloads_30d: { meok: meok.downloads_30d, csoai: rollUp(own, "downloads_30d") },
    },
    packages: [...rows, meokRow],
  };
}
const others = (rows = csoai) => rows.filter((p) => !isSelf(p));
const selfRows = (rows = csoai) => rows.filter(isSelf);
const fresh = Date.parse("2026-11-24T12:00:00Z");
const render = (p: DistributionArtifact, now = fresh) =>
  renderToStaticMarkup(<HomeDistribution injected={{ kind: "ready", payload: p }} now={now} />);

describe("homepage distribution evidence", () => {
  it("heads with CSOAI's rows without the datasets our own services read, and prints those apart", () => {
    const p = census();
    const html = render(p);
    for (const f of FIELDS) {
      expect(html).toContain(nf.format(sum(others(), f)));
      expect(html).toContain(nf.format(sum(selfRows(), f)));
      // CSOAI's by_entity figure has our own reads inside it, and the account total adds MEOK in: neither is printed.
      expect(html).not.toContain(nf.format(p.by_entity![f]!.csoai.value as number));
      expect(html).not.toContain(nf.format(p.totals![f]!.value as number));
    }
    expect(html).toContain("CSOAI&#x27;s packages and datasets, leaving out the 10 datasets our own services read");
    expect(html).toContain(`${others().length} of ${others().length} package counters answered`);
    expect(html).toContain("Left out above: the 10 Hugging Face datasets our own services read.");
    expect(html).toContain(`${nf.format(sum(selfRows(), "downloads_all_time"))} since first release and ${nf.format(sum(selfRows(), "downloads_30d"))} in 30-day windows`);
  });

  it("gives MEOK AI Labs its own line, never added in", () => {
    const html = render(census());
    expect(html).toContain("Packages labelled MEOK AI Labs in the same publishing account are counted separately");
    expect(html).toContain(`≥ ${nf.format(meok.downloads_all_time.value)} since first release (317 of 318 counters answered)`);
    expect(html).toContain(`≥ ${nf.format(meok.downloads_30d.value)} in 30-day windows (317 of 318)`);
    expect(html).toContain("Packages labelled joint or unattributed are in neither figure.");
    expect(html).toContain("CSOAI and MEOK publishing estate");
    expect(html).toContain("It does not count unique people, active installations, executions or customers");
    expect(html).toContain('href="/interop/distribution-latest.json"');
  });

  it("prints no figure when the parts do not add back up to CSOAI's row, or a row is missing", () => {
    const p = census();
    expect(distributionRead(null)).toBeNull();
    expect(distributionRead({ schema: "wrong" })).toBeNull();
    expect(distributionRead({ ...p, totals: { ...p.totals, downloads_all_time: { state: "READ", value: "2 million", covered: 914, attempted: 915, as_of: asOf } } })).toBeNull();
    const { csoai: _all, ...noCsoai } = p.by_entity!.downloads_all_time!;
    expect(distributionRead({ ...p, by_entity: { ...p.by_entity, downloads_all_time: noCsoai } })).toBeNull();
    const older = { ...p.by_entity!.downloads_30d!, csoai: { ...p.by_entity!.downloads_30d!.csoai, as_of: "2026-11-22T19:11:15Z" } };
    expect(distributionRead({ ...p, by_entity: { ...p.by_entity, downloads_30d: older } })).toBeNull();
    // Without the package rows the split cannot be made, and the figure with our own reads inside it is not shown instead.
    const { packages: _rows, ...noRows } = p;
    expect(distributionRead(noRows)).toBeNull();
    // One self-read row one download off: the parts no longer add back up to by_entity's CSOAI pair.
    const drifted = p.packages!.map((r, i) => (i === 0 ? { ...r, downloads_30d: (r.downloads_30d as number) + 1 } : r));
    expect(distributionRead({ ...p, packages: drifted })).toBeNull();
    const failed = renderToStaticMarkup(<HomeDistribution injected={{ kind: "failed", reason: "HTTP 503" }} />);
    expect(failed).toContain("distribution feed is unavailable");
    expect(failed).not.toContain(nf.format(sum(others(), "downloads_30d")));
  });

  it("drops only MEOK's line when MEOK's rows fail", () => {
    const p = census();
    const badMeok = { ...p.by_entity!.downloads_30d!, meok: { state: "PARTIAL", value: null, covered: 317, attempted: 318, as_of: asOf } };
    const read = distributionRead({ ...p, by_entity: { ...p.by_entity, downloads_30d: badMeok } });
    expect(read?.meok).toBeNull();
    expect(read?.csoai.lifetime.value).toBe(sum(others(), "downloads_all_time"));
    expect(read?.selfRead?.recent.value).toBe(sum(selfRows(), "downloads_30d"));
  });

  it("marks the figures out of date after the source's 48-hour freshness window", () => {
    expect(render(census(), Date.parse("2026-11-25T19:12:00Z"))).toContain("Out of date — a fresh census is needed");
  });

  it("calls the read partial when one of CSOAI's counters is missing, as the census does", () => {
    expect(render(census())).toContain("All CSOAI package counters answered.");
    // An "other" row's 30-day counter did not answer; by_entity is rolled up from the same rows, so it says PARTIAL too.
    const gap = csoai.map((p, i) => (i === 10 ? { ...p, downloads_30d: null } : p));
    const html = render(census(gap));
    expect(html).toContain(`≥ ${nf.format(sum(others(gap), "downloads_30d"))}`);
    expect(html).toContain(`${others(gap).length - 1} of ${others(gap).length} package counters answered`);
    expect(html).toContain("Partial read; missing counters are not treated as zero.");
  });
});

describe("the committed census, as the home page and /llms.txt read it", () => {
  it("prints the same split as /llms.txt, summed from the census's own rows", async () => {
    const art = committed as unknown as DistributionArtifact;
    const home = distributionRead(art, Date.parse(String(art.as_of)));
    const { distributionRead: llmsRead } = await import("../../../../scripts/llms-txt-distribution.mjs");
    const llms = llmsRead(art);
    expect(home, "the committed census is readable by the home page's rule").toBeTruthy();
    expect(llms.reason).toBeUndefined();
    const rows = (art.packages ?? []).filter((p) => p.entity === "csoai");
    for (const [f, which] of [["downloads_all_time", "lifetime"], ["downloads_30d", "recent"]] as const) {
      expect(home!.csoai[which].value).toBe(sum(others(rows), f));
      expect(home!.selfRead![which].value).toBe(sum(selfRows(rows), f));
      expect(home!.csoai[which].value).toBe(llms.csoai[which].value);
      expect(home!.selfRead![which].value).toBe(llms.selfRead[which].value);
    }
  });
});

describe("the datasets our own services read", () => {
  it("are the ones /api/momentum keeps apart, in the same order", () => {
    expect(SELF_READ_IDS).toEqual(SELF_READ_DATASETS.map((s) => s.id));
  });
});

describe("the census producer's entity rule", () => {
  it("says the CSOAI and MEOK AI Labs figures are never added, in both copies of the producer", () => {
    for (const path of ["../../../../scripts/distribution-measure.py", "../../../../scripts/pod-loops/distribution-measure.py"]) {
      const producer = readFileSync(new URL(path, import.meta.url), "utf8");
      expect(producer).toContain('"are two figures and are never added: quote each under its own label. totals counts "');
      expect(producer).not.toContain("The estate total is every row; each entity's share is printed beside it.");
    }
  });
});
