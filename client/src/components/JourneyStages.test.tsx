/**
 * JourneyStages.test.tsx — the honest dead-end, asserted.
 *
 * WP-3: "Missing backends show the exact unavailable capability; never fake a completed fix."
 * The estate satisfied the second half by omission — no surface offered approve/fix/retest, so
 * nothing lied — but a reader had no way to learn what stops the journey or why.
 *
 * The failure mode this guards is the tempting one: rendering the full ten-stage case model so
 * it LOOKS complete, with the blocked stages as greyed-out buttons or spinners. That is the
 * faked completed fix wearing a disabled attribute. A stage with no runtime is described here,
 * never offered.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import JourneyStages from "./JourneyStages";
import registry from "../../../capabilities/registry.json";

const html = renderToStaticMarkup(<JourneyStages />);
const backends: Record<string, any> =
  (registry as any).journey_backends?.backends ?? {};

describe("JourneyStages", () => {
  it("names every stage of the case model, in order", () => {
    for (const s of [
      "Ask", "Scope", "Inspect", "Explain",
      "Propose", "Approve", "Fix", "Retest", "Receipt", "Monitor",
    ]) {
      expect(html, `${s} missing from the case model`).toContain(s);
    }
  });

  it("names the exact endpoint behind each blocked stage", () => {
    // "Unavailable" without the endpoint is not the exact unavailable capability.
    for (const key of ["ras", "remediation", "jobs", "receipts"]) {
      const ep = backends[key]?.endpoint;
      expect(ep, `${key} has no endpoint recorded`).toBeTruthy();
      expect(html, `${ep} is not shown to the reader`).toContain(ep);
    }
  });

  it("gives the producer's reason verbatim rather than a paraphrase", () => {
    const reason = String(backends.ras?.reason ?? "");
    expect(reason.length).toBeGreaterThan(40);
    // React escapes text nodes; compare on a distinctive unescaped fragment.
    expect(html).toContain(reason.slice(0, 30));
  });

  it("offers no control that would fail if pressed", () => {
    // The whole point. A disabled Approve button is still a promise.
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("disabled");
  });

  it("does not present the blocked stages as live", () => {
    // Four stages are reachable today; the count must not silently become ten.
    expect(html).toMatch(/4 of 10 stages/);
    expect(html).toContain("UNAVAILABLE");
  });

  it("says the states are a dated record, not a live check", () => {
    // Implying freshness it does not have would be its own small lie.
    expect(html).toMatch(/not a live check/i);
    expect(html).toMatch(/2026-09-05/);
  });

  it("says who is blocked on whom, without naming a delivery date", () => {
    expect(html).toMatch(/another lane owns/i);
    expect(html).not.toMatch(/\b(soon|shortly|next week|coming)\b/i);
  });
});
