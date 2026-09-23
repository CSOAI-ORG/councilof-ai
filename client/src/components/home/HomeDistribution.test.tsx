import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomeDistribution, { distributionRead } from "./HomeDistribution";
import type { FootprintPayload } from "@/components/liveCountersFormat";

const asOf = "2026-09-22T16:00:59Z";
const payload: FootprintPayload = {
  gross_distribution: {
    state: "PARTIAL",
    downloads_all_time: { state: "PARTIAL", value: 2635813, covered: 832, attempted: 833, as_of: asOf },
    downloads_30d: { state: "PARTIAL", value: 395977, covered: 832, attempted: 833, as_of: asOf },
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
    expect(html).toContain("It does not count unique people, active installations, executions or customers");
    expect(html).toContain('href="/interop/distribution-latest.json"');
  });

  it("does not turn a missing, malformed or mismatched count into an adoption headline", () => {
    expect(distributionRead(null)).toBeNull();
    expect(distributionRead({ gross_distribution: { state: "UNMEASURED" } })).toBeNull();
    expect(distributionRead({ gross_distribution: { ...payload.gross_distribution, downloads_all_time: { state: "READ", value: "2 million", covered: 832, attempted: 833, as_of: asOf } } })).toBeNull();
    expect(distributionRead({ gross_distribution: { ...payload.gross_distribution, downloads_30d: { state: "PARTIAL", value: 395977, covered: 832, attempted: 833, as_of: "2026-09-21T16:00:59Z" } } })).toBeNull();
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
});
