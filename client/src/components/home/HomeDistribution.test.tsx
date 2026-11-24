import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeDistribution, { distributionRead } from "./HomeDistribution";
import type { DistributionArtifact, DistributionPackage } from "./useHomeReads";
import SELF_READ_IDS from "@/data/hf-self-read-ids.json";
import { SELF_READ_DATASETS } from "../../../../functions/api/_momentum";

// The published census of 23 Nov 2026 (public/interop/distribution-latest.json, as_of 2026-11-23T19:11:15Z).
// Its totals are the account's every row (MEOK + CSOAI + joint + unattributed). CSOAI's own rows are 218:
// the ten Hugging Face datasets our own services read (484,507 since first release, 298,200 in 30-day
// windows) and 208 others (468,906 and 253,086). The package rows here keep the census's shape and those
// sums; the individual counts are spread evenly, since only the sums are read.
const asOf = "2026-11-23T19:11:15Z";

/** n non-negative whole numbers that add up to total. */
const spread = (total: number, n: number) =>
  Array.from({ length: n }, (_, i) => Math.floor(total / n) + (i < total % n ? 1 : 0));

const selfAll = spread(484507, 10);
const selfRecent = spread(298200, 10);
const otherAll = spread(468906, 208);
const otherRecent = spread(253086, 208);
const packages: DistributionPackage[] = [
  ...(SELF_READ_IDS as string[]).map((name, i) => ({
    registry: "huggingface", name, entity: "csoai", downloads_all_time: selfAll[i], downloads_30d: selfRecent[i],
  })),
  ...otherAll.map((v, i) => ({
    registry: i < 24 ? "pypi" : "huggingface", name: i < 24 ? `csoai-package-${i}` : `csoai/dataset-${i}`,
    entity: "csoai", downloads_all_time: v, downloads_30d: otherRecent[i],
  })),
  { registry: "pypi", name: "meok-example", entity: "meok", downloads_all_time: 1, downloads_30d: 1 },
];

const payload: DistributionArtifact = {
  schema: "csoai.distribution/0.1",
  as_of: asOf,
  max_age_hours: 48,
  totals: {
    downloads_all_time: { state: "PARTIAL", value: 4039720, covered: 914, attempted: 915, as_of: asOf },
    downloads_30d: { state: "PARTIAL", value: 856256, covered: 914, attempted: 915, as_of: asOf },
  },
  by_entity: {
    downloads_all_time: {
      meok: { state: "PARTIAL", value: 2859565, covered: 317, attempted: 318, as_of: asOf },
      csoai: { state: "READ", value: 953413, covered: 218, attempted: 218, as_of: asOf },
      joint: { state: "READ", value: 77450, covered: 32, attempted: 32, as_of: asOf },
      unattributed: { state: "READ", value: 149292, covered: 347, attempted: 347, as_of: asOf },
    },
    downloads_30d: {
      meok: { state: "PARTIAL", value: 272537, covered: 317, attempted: 318, as_of: asOf },
      csoai: { state: "READ", value: 551286, covered: 218, attempted: 218, as_of: asOf },
      joint: { state: "READ", value: 15917, covered: 32, attempted: 32, as_of: asOf },
      unattributed: { state: "READ", value: 16516, covered: 347, attempted: 347, as_of: asOf },
    },
  },
  packages,
};
const fresh = Date.parse("2026-11-24T12:00:00Z");
const render = (p: DistributionArtifact, now = fresh) =>
  renderToStaticMarkup(<HomeDistribution injected={{ kind: "ready", payload: p }} now={now} />);

describe("homepage distribution evidence", () => {
  it("heads with CSOAI's figures without the datasets our own services read, and prints those apart", () => {
    const html = render(payload);
    expect(html).toContain("468,906");
    expect(html).toContain("253,086");
    expect(html).toContain("CSOAI&#x27;s packages and datasets, leaving out the 10 datasets our own services read");
    expect(html).toContain("208 of 208 package counters answered");
    expect(html).toContain("Left out above: the 10 Hugging Face datasets our own services read.");
    expect(html).toContain("484,507 since first release and 298,200 in 30-day windows");
    // CSOAI's total with our own reads inside it, and the account total, are printed nowhere.
    for (const n of ["953,413", "551,286", "4,039,720", "856,256"]) expect(html).not.toContain(n);
  });

  it("gives MEOK AI Labs its own line, never added in", () => {
    const html = render(payload);
    expect(html).toContain("MEOK AI Labs, a separate entity publishing from the same account, is counted on its own");
    expect(html).toContain("≥ 2,859,565 since first release (317 of 318 counters answered)");
    expect(html).toContain("≥ 272,537 in 30-day windows (317 of 318)");
    expect(html).toContain("Packages labelled joint or unattributed are in neither figure.");
    expect(html).toContain("CSOAI and MEOK publishing estate");
    expect(html).toContain("It does not count unique people, active installations, executions or customers");
    expect(html).toContain('href="/interop/distribution-latest.json"');
  });

  it("prints no figure when the parts do not add back up to CSOAI's row, or a row is missing", () => {
    expect(distributionRead(null)).toBeNull();
    expect(distributionRead({ schema: "wrong" })).toBeNull();
    expect(distributionRead({ ...payload, totals: { ...payload.totals, downloads_all_time: { state: "READ", value: "2 million", covered: 914, attempted: 915, as_of: asOf } } })).toBeNull();
    const { csoai: _all, ...noCsoai } = payload.by_entity!.downloads_all_time!;
    expect(distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_all_time: noCsoai } })).toBeNull();
    const olderCsoai = { ...payload.by_entity!.downloads_30d!, csoai: { state: "READ", value: 551286, covered: 218, attempted: 218, as_of: "2026-11-22T19:11:15Z" } };
    expect(distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_30d: olderCsoai } })).toBeNull();
    // Without the package rows the split cannot be made, so CSOAI's own-reads-included figure is not shown instead.
    const { packages: _rows, ...noRows } = payload;
    expect(distributionRead(noRows)).toBeNull();
    // One self-read row one download off: the parts no longer reconcile with by_entity.csoai.
    const drifted = packages.map((p, i) => (i === 0 ? { ...p, downloads_30d: (p.downloads_30d as number) + 1 } : p));
    expect(distributionRead({ ...payload, packages: drifted })).toBeNull();
    const failed = renderToStaticMarkup(<HomeDistribution injected={{ kind: "failed", reason: "HTTP 503" }} />);
    expect(failed).toContain("distribution feed is unavailable");
    expect(failed).not.toContain("468,906");
  });

  it("drops only MEOK's line when MEOK's rows fail", () => {
    const badMeok = { ...payload.by_entity!.downloads_30d!, meok: { state: "PARTIAL", value: null, covered: 317, attempted: 318, as_of: asOf } };
    const read = distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_30d: badMeok } });
    expect(read?.meok).toBeNull();
    expect(read?.csoai.lifetime.value).toBe(468906);
    expect(read?.selfRead?.recent.value).toBe(298200);
  });

  it("marks the figures out of date after the source's 48-hour freshness window", () => {
    expect(render(payload, Date.parse("2026-11-25T19:12:00Z"))).toContain("Out of date — a fresh census is needed");
  });

  it("calls the read partial when one of CSOAI's counters is missing, as the census does", () => {
    expect(render(payload)).toContain("All CSOAI package counters answered.");
    // An "other" row's 30-day counter did not answer: the census's own row says PARTIAL, 217 of 218.
    const gap = packages.map((p, i) => (i === 10 ? { ...p, downloads_30d: null } : p));
    const missing = otherRecent[0];
    const csoai30 = { state: "PARTIAL", value: 551286 - missing, covered: 217, attempted: 218, as_of: asOf };
    const html = render({ ...payload, packages: gap, by_entity: { ...payload.by_entity, downloads_30d: { ...payload.by_entity!.downloads_30d!, csoai: csoai30 } } });
    expect(html).toContain(`≥ ${new Intl.NumberFormat("en-GB").format(253086 - missing)}`);
    expect(html).toContain("207 of 208 package counters answered");
    expect(html).toContain("Partial read; missing counters are not treated as zero.");
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
