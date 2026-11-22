import { describe, it, expect } from "vitest";
import { axisHref } from "./axisHref";
import { OWNER_GATED } from "./ownerGated";

/**
 * The board snapshot this rule is derived from. It is a COPY, not a fetch: the
 * test must not depend on the network, and it must fail if the rule's
 * assumptions about the payload change shape.
 */
const BOARD = [
  { axis: "governance", kind: "model-comparison" },
  { axis: "safety", kind: "model-comparison" },
  { axis: "jail", kind: "model-comparison" },
  { axis: "lab-practice", kind: "measured-subject" },
  { axis: "company-practice", kind: "measured-subject" },
  { axis: "measurer-integrity", kind: "measured-subject" },
  { axis: "harness-fidelity", kind: "measured-subject" },
  { axis: "interop-conformance", kind: "measured-subject" },
  { axis: "humanoid-deployment", kind: "measured-subject" },
  { axis: "interpretability-reproducibility", kind: "measured-subject" },
  { axis: "claim-maintenance", kind: "measured-subject" },
  { axis: "serving-fidelity", kind: "measured-subject" },
  { axis: "effect-binding", kind: "deterministic-facts" },
  { axis: "provenance-controls", kind: "deterministic-facts" },
  { axis: "regulator-transparency", kind: "measured-subject", public_pages: OWNER_GATED },
  { axis: "watchdog-ingest", kind: "measured-subject", public_pages: OWNER_GATED },
];

describe("axisHref", () => {
  it("sends a model-comparison axis to its prerendered deep-dive page", () => {
    expect(axisHref({ axis: "governance", kind: "model-comparison" })).toBe("/gspc/governance/");
  });

  it("sends a measured-subject axis to the axis page the estate publishes", () => {
    // The defect this rule exists to fix: these nine were linked to
    // /gspc/<axis>/, which 404s, because the prerender list was hand-typed.
    for (const a of BOARD.filter((x) => x.kind === "measured-subject" && !x.public_pages)) {
      expect(axisHref(a), a.axis).toBe(`/axis/${a.axis}/`);
    }
  });

  it("sends a deterministic fact to the axis page the estate publishes", () => {
    expect(axisHref({ axis: "effect-binding", kind: "deterministic-facts" })).toBe("/axis/effect-binding/");
  });

  it("gives an owner-gated axis no link at all", () => {
    // The slot has no public page, so a link would point at a 404.
    expect(axisHref({ axis: "regulator-transparency", kind: "measured-subject", public_pages: OWNER_GATED })).toBeNull();
    expect(axisHref({ axis: "watchdog-ingest", kind: "measured-subject", public_pages: OWNER_GATED })).toBeNull();
  });

  it("never returns a /gspc/ route for a non model-comparison axis", () => {
    // The prerender list holds model-comparison axes only. Anything else sent
    // to /gspc/ is a 404 waiting to happen.
    for (const a of BOARD) {
      if (a.kind === "model-comparison") continue;
      const href = axisHref(a);
      if (href) expect(href, a.axis).not.toContain("/gspc/");
    }
  });

  it("returns null for a row with no axis id", () => {
    expect(axisHref({ kind: "model-comparison" })).toBeNull();
    expect(axisHref({ axis: "   ", kind: "model-comparison" })).toBeNull();
    expect(axisHref(null)).toBeNull();
    expect(axisHref(undefined)).toBeNull();
  });

  it("encodes an axis id rather than pasting it into the path", () => {
    expect(axisHref({ axis: "a b/c", kind: "measured-subject" })).toBe("/axis/a%20b%2Fc/");
  });

  it("gives every axis on the board exactly one route", () => {
    const hrefs = BOARD.map((a) => axisHref(a));
    expect(hrefs.filter(Boolean).length).toBe(BOARD.length - 2); // two owner-gated
    expect(new Set(hrefs.filter(Boolean)).size).toBe(hrefs.filter(Boolean).length);
  });
});
