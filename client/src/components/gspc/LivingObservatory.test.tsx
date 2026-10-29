import { it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LivingObservatory from "./LivingObservatory";
it("renders framework navigation, disclosure separation and unmeasured cups", () => {
  const html = renderToStaticMarkup(<LivingObservatory axes={[]} boardLoaded />);
  expect(html).toContain("NIST AI RMF 1.0"); expect(html).toContain("EU GPAI Code");
  expect(html).toContain("No composite company ranking"); expect(html).toContain("Unmeasured — not zero trust");
  expect(html).toContain('href="/maternal-covenant"'); expect(html).toContain('type="search"');
  expect(html).not.toContain("100% safe"); expect(html).not.toContain("certified organisation");
});
it("retains unavailable board state instead of fabricating a successful load", () => {
  const html = renderToStaticMarkup(<LivingObservatory axes={[]} boardError="offline" />);
  expect(html).toContain("Board unavailable"); expect(html).not.toContain("0 matching instruments from the board");
});
