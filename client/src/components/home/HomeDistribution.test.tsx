import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeDistribution, { distributionRead } from "./HomeDistribution";
import type { DistributionArtifact } from "./useHomeReads";

const asOf = "2026-09-22T16:00:59Z";
const payload: DistributionArtifact = {
  schema: "csoai.distribution/0.1",
  as_of: asOf,
  max_age_hours: 48,
  totals: {
    downloads_all_time: { state: "PARTIAL", value: 2635813, covered: 832, attempted: 833, as_of: asOf },
    downloads_30d: { state: "PARTIAL", value: 395977, covered: 832, attempted: 833, as_of: asOf },
  },
  by_entity: {
    downloads_all_time: {
      meok: { state: "PARTIAL", value: 2317604, covered: 317, attempted: 318, as_of: asOf },
      csoai: { state: "READ", value: 165784, covered: 136, attempted: 136, as_of: asOf },
      joint: { state: "READ", value: 45489, covered: 32, attempted: 32, as_of: asOf },
      unattributed: { state: "READ", value: 106936, covered: 347, attempted: 347, as_of: asOf },
    },
  },
};

describe("homepage distribution evidence", () => {
  it("shows both distinct windows as partial gross events with their population and limits", () => {
    const html = renderToStaticMarkup(
      <HomeDistribution injected={{ kind: "ready", payload }} now={Date.parse("2026-09-23T12:00:00Z")} />,
    );
    expect(html).toContain("≥ 2,635,813");
    expect(html).toContain("≥ 395,977");
    expect(html).toContain("832 of 833 package counters answered");
    expect(html).toContain("CSOAI and MEOK publishing estate");
    expect(html).toContain("MEOK 2,317,604 · CSOAI 165,784 · joint 45,489 · unattributed 106,936");
    expect(html).toContain("It does not count unique people, active installations, executions or customers");
    expect(html).toContain('href="/interop/distribution-latest.json"');
  });

  it("does not turn a missing, malformed or mismatched count into an adoption headline", () => {
    expect(distributionRead(null)).toBeNull();
    expect(distributionRead({ schema: "wrong" })).toBeNull();
    expect(distributionRead({ ...payload, totals: { ...payload.totals, downloads_all_time: { state: "READ", value: "2 million", covered: 832, attempted: 833, as_of: asOf } } })).toBeNull();
    expect(distributionRead({ ...payload, totals: { ...payload.totals, downloads_30d: { state: "PARTIAL", value: 395977, covered: 832, attempted: 833, as_of: "2026-09-21T16:00:59Z" } } })).toBeNull();
    expect(distributionRead({ ...payload, by_entity: { downloads_all_time: { ...payload.by_entity?.downloads_all_time, meok: { state: "READ", value: 1, covered: 317, attempted: 318, as_of: asOf } } } })?.entitySplit).toBeNull();
    const html = renderToStaticMarkup(<HomeDistribution injected={{ kind: "failed", reason: "HTTP 503" }} />);
    expect(html).toContain("distribution feed is unavailable");
    expect(html).not.toContain("2,635,813");
  });

  it("marks the figures out of date after the source's 48-hour freshness window", () => {
    const html = renderToStaticMarkup(
      <HomeDistribution injected={{ kind: "ready", payload }} now={Date.parse("2026-09-25T16:01:00Z")} />,
    );
    expect(html).toContain("Out of date — a fresh census is needed");
  });

  it("does not call a complete future census partial", () => {
    const complete: DistributionArtifact = {
      ...payload,
      totals: {
        downloads_all_time: { state: "READ", value: 2635813, covered: 833, attempted: 833, as_of: asOf },
        downloads_30d: { state: "READ", value: 395977, covered: 833, attempted: 833, as_of: asOf },
      },
    };
    const html = renderToStaticMarkup(<HomeDistribution injected={{ kind: "ready", payload: complete }} now={Date.parse("2026-09-23T12:00:00Z")} />);
    expect(html).toContain("All listed counters answered.");
    expect(html).not.toContain("Partial read;");
  });
});
