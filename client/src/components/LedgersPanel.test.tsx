import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RootLine, isStale } from "./LedgersPanel";

// Read live on 2026-11-17 06:33Z from GET /api/state → ledgers.root: the root was 56 hours old and
// its OTS state CONFIRMED_BITCOIN. The panel then printed "OTS CONFIRMED_BITCOIN(stale: older than
// 48 hours)", which reads as the Bitcoin proof having gone stale. Only the root's as_of ages.
const root = {
  as_of: "2026-11-14T22:23:43Z",
  merkle_root: "510cbc2fc97d6cdc3394296f1c3627e836a3acc68089dc31920abc3860d1aa49",
  card_count: 453,
  rekor: "WITNESSED",
  ots: "CONFIRMED_BITCOIN",
  note: "",
};
const H = 3600 * 1000;
const asOf = Date.parse(root.as_of);

describe("isStale", () => {
  it("is a 48-hour rule on the time it is given, and false for a missing or unparseable time", () => {
    expect(isStale(root.as_of, asOf + 47 * H)).toBe(false);
    expect(isStale(root.as_of, asOf + 49 * H)).toBe(true);
    expect(isStale(null, asOf + 100 * H)).toBe(false);
    expect(isStale("not a time", asOf + 100 * H)).toBe(false);
  });
});

describe("RootLine", () => {
  it("attaches the stale marker to the root's as_of, before the Rekor and OTS states, and says what is stale", () => {
    const html = renderToStaticMarkup(<RootLine root={root} now={asOf + 56 * H} />);
    const stale = html.indexOf("(stale:");
    expect(stale).toBeGreaterThan(html.indexOf(root.as_of));
    expect(stale).toBeLessThan(html.indexOf("Rekor"));
    expect(stale).toBeLessThan(html.indexOf("OTS"));
    expect(html).toContain("this root is older than 48 hours");
    expect(html).not.toMatch(/CONFIRMED_BITCOIN<\/code>\s*<strong/);
  });

  it("prints no stale marker inside 48 hours and still carries every witness state verbatim", () => {
    const html = renderToStaticMarkup(<RootLine root={root} now={asOf + 2 * H} />);
    expect(html).not.toContain("stale");
    expect(html).toContain("WITNESSED");
    expect(html).toContain("CONFIRMED_BITCOIN");
    expect(html).toContain("453 leaves");
  });

  it("renders a missing time as not recorded and never calls it stale", () => {
    const html = renderToStaticMarkup(<RootLine root={{ ...root, as_of: null }} now={asOf + 100 * H} />);
    expect(html).toContain("not recorded");
    expect(html).not.toContain("stale");
  });
});
