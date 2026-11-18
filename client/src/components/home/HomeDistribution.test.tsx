import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeDistribution, { distributionRead } from "./HomeDistribution";
import type { DistributionArtifact } from "./useHomeReads";

// The published census of 16 Nov 2026 (public/interop/distribution-latest.json), as the home page read it.
// Its totals are the account's every row: MEOK 2,746,597 + CSOAI 890,521 + joint 72,056 + unattributed
// 143,067 = 3,852,241, which the home page printed as its headline on 18 Nov 2026.
const asOf = "2026-11-16T04:40:31Z";
const payload: DistributionArtifact = {
  schema: "csoai.distribution/0.1",
  as_of: asOf,
  max_age_hours: 48,
  totals: {
    downloads_all_time: { state: "PARTIAL", value: 3852241, covered: 908, attempted: 909, as_of: asOf },
    downloads_30d: { state: "PARTIAL", value: 771433, covered: 908, attempted: 909, as_of: asOf },
  },
  by_entity: {
    downloads_all_time: {
      meok: { state: "PARTIAL", value: 2746597, covered: 317, attempted: 318, as_of: asOf },
      csoai: { state: "READ", value: 890521, covered: 212, attempted: 212, as_of: asOf },
      joint: { state: "READ", value: 72056, covered: 32, attempted: 32, as_of: asOf },
      unattributed: { state: "READ", value: 143067, covered: 347, attempted: 347, as_of: asOf },
    },
    downloads_30d: {
      meok: { state: "PARTIAL", value: 228554, covered: 317, attempted: 318, as_of: asOf },
      csoai: { state: "READ", value: 514407, covered: 212, attempted: 212, as_of: asOf },
      joint: { state: "READ", value: 14346, covered: 32, attempted: 32, as_of: asOf },
      unattributed: { state: "READ", value: 14126, covered: 347, attempted: 347, as_of: asOf },
    },
  },
};
const fresh = Date.parse("2026-11-17T12:00:00Z");
const render = (p: DistributionArtifact, now = fresh) =>
  renderToStaticMarkup(<HomeDistribution injected={{ kind: "ready", payload: p }} now={now} />);

describe("homepage distribution evidence", () => {
  it("heads with CSOAI's own figures and gives MEOK its own line, never added in", () => {
    const html = render(payload);
    expect(html).toContain("890,521");
    expect(html).toContain("514,407");
    expect(html).toContain("gross download events since first release, CSOAI packages");
    expect(html).toContain("212 of 212 package counters answered");
    expect(html).toContain("MEOK AI Labs, a separate entity publishing from the same account, is counted on its own");
    expect(html).toContain("≥ 2,746,597 since first release (317 of 318 counters answered)");
    expect(html).toContain("≥ 228,554 in 30-day windows (317 of 318)");
    expect(html).toContain("Packages labelled joint or unattributed are in neither figure.");
    // The account total adds MEOK into CSOAI, so it is not printed in either window.
    expect(html).not.toContain("3,852,241");
    expect(html).not.toContain("771,433");
    expect(html).not.toContain("Of the cumulative total");
    expect(html).toContain("CSOAI and MEOK publishing estate");
    expect(html).toContain("It does not count unique people, active installations, executions or customers");
    expect(html).toContain('href="/interop/distribution-latest.json"');
  });

  it("prints no figure without readable CSOAI rows, and drops only MEOK's line when MEOK's rows fail", () => {
    expect(distributionRead(null)).toBeNull();
    expect(distributionRead({ schema: "wrong" })).toBeNull();
    expect(distributionRead({ ...payload, totals: { ...payload.totals, downloads_all_time: { state: "READ", value: "2 million", covered: 908, attempted: 909, as_of: asOf } } })).toBeNull();
    const { csoai: _all, ...noCsoai } = payload.by_entity!.downloads_all_time!;
    expect(distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_all_time: noCsoai } })).toBeNull();
    const olderCsoai = { ...payload.by_entity!.downloads_30d!, csoai: { state: "READ", value: 514407, covered: 212, attempted: 212, as_of: "2026-11-15T04:40:31Z" } };
    expect(distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_30d: olderCsoai } })).toBeNull();
    const badMeok = { ...payload.by_entity!.downloads_30d!, meok: { state: "PARTIAL", value: null, covered: 317, attempted: 318, as_of: asOf } };
    const read = distributionRead({ ...payload, by_entity: { ...payload.by_entity, downloads_30d: badMeok } });
    expect(read?.meok).toBeNull();
    expect(read?.csoai.lifetime.value).toBe(890521);
    const failed = renderToStaticMarkup(<HomeDistribution injected={{ kind: "failed", reason: "HTTP 503" }} />);
    expect(failed).toContain("distribution feed is unavailable");
    expect(failed).not.toContain("890,521");
  });

  it("marks the figures out of date after the source's 48-hour freshness window", () => {
    expect(render(payload, Date.parse("2026-11-18T04:41:00Z"))).toContain("Out of date — a fresh census is needed");
  });

  it("calls the read partial only when a CSOAI counter is missing, not when MEOK's is", () => {
    const complete = render(payload);
    expect(complete).toContain("All CSOAI package counters answered.");
    expect(complete).not.toContain("Partial read;");
    const partialCsoai = { ...payload.by_entity!.downloads_30d!, csoai: { state: "PARTIAL", value: 514000, covered: 211, attempted: 212, as_of: asOf } };
    const partial = render({ ...payload, by_entity: { ...payload.by_entity, downloads_30d: partialCsoai } });
    expect(partial).toContain("≥ 514,000");
    expect(partial).toContain("Partial read; missing counters are not treated as zero.");
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
