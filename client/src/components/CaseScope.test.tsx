/**
 * CaseScope tests — the WP-3 intake contract, and the ways it could quietly become a lie.
 *
 * The risk in a scoping form is not that it renders. It is that it grows a submit button over a
 * queue that does not exist, or collapses three consents into one tick-box, or starts telling
 * someone a request was filed. Those are the assertions here.
 *
 * House pattern: renderToStaticMarkup, no testing-library — see JourneyStages.test.tsx. The
 * interactive contract is exercised through the exported pure functions instead of a synthetic
 * DOM, which is the part that would actually be wrong if it broke.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import CaseScope, { ROLES, scopeCompleteness, liveDoorsFor, type CaseScopeValue } from "./CaseScope";

const html = renderToStaticMarkup(<CaseScope />);
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const SRC = readFileSync(
  path.join(process.cwd(), "client/src/components/CaseScope.tsx"),
  "utf8",
);

const BLANK: CaseScopeValue = {
  role: "", subject: "", version: "", jurisdiction: "", purpose: "",
  consentMeasure: false, consentLearning: false,
};
const FULL: CaseScopeValue = {
  role: "provider", subject: "acme-llm", version: "1.4.0", jurisdiction: "EU",
  purpose: "procurement", consentMeasure: true, consentLearning: false,
};

describe("CaseScope asks WP-3's five questions", () => {
  it("renders a control for every one of the five fields", () => {
    for (const id of ["role", "subject", "version", "jurisdiction", "purpose"]) {
      expect(html, `no control for ${id}`).toContain(`data-testid="scope-${id}"`);
    }
  });

  it("offers every audience WP-3 names", () => {
    // Seven audiences, in the brief's own words. Dropping one silently removes a whole user
    // from the case model while the form still looks complete.
    expect(ROLES.length).toBe(7);
    const labels = ROLES.map((r) => r.label.toLowerCase()).join(" | ");
    for (const who of ["public", "gpai", "builder", "regulator", "insurer", "cobol", "ledger"]) {
      expect(labels, `no role covering "${who}"`).toContain(who);
    }
    for (const r of ROLES) expect(html).toContain(`value="${r.id}"`);
  });

  it("keeps consent-to-measure separate from learning participation, neither pre-ticked", () => {
    expect(html).toContain('data-testid="scope-consent-measure"');
    expect(html).toContain('data-testid="scope-consent-learning"');
    // A pre-ticked consent is not a consent. Static markup carries `checked` when it is set.
    const boxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? [];
    expect(boxes.length, "expected exactly the two consent checkboxes").toBe(2);
    for (const b of boxes) expect(b, `a consent box ships pre-ticked: ${b}`).not.toMatch(/\bchecked\b/);
  });

  it("says in words that neither consent is a compliance step or a certificate", () => {
    expect(text).toMatch(/never certifies/i);
    expect(text).toMatch(/not evidence of compliance/i);
  });
});

describe("CaseScope never claims a submission", () => {
  it("has no form, no button and no submit control", () => {
    // THE ASSERTION THAT MATTERS. There is no intake queue behind this. A submit button would
    // be the faked completed fix WP-3 forbids, in its politest possible form.
    expect(html, "a <form> appeared").not.toMatch(/<form[\s>]/);
    expect(html, "a <button> appeared").not.toMatch(/<button[\s>]/);
    expect(html).not.toMatch(/type="submit"/);
  });

  it("its source contains no submit vocabulary and makes no network call", () => {
    const code = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").toLowerCase();
    for (const word of ["onsubmit", "fetch(", "request received", "we will be in touch", "thank you for your request", "we'll get back"]) {
      expect(code, `CaseScope now contains "${word}"`).not.toContain(word);
    }
  });

  it("tells the reader the scope stays in the browser", () => {
    expect(text).toMatch(/nothing is submitted/i);
    expect(text).toMatch(/stay in this browser|held in this browser/i);
  });

  it("an empty scope says what is missing and still offers the live doors", () => {
    expect(text).toMatch(/Not scoped yet/i);
    expect(liveDoorsFor(BLANK).length).toBe(3);
  });
});

describe("scopeCompleteness", () => {
  it("is complete only when all five fields AND consent-to-measure are present", () => {
    expect(scopeCompleteness(FULL).complete).toBe(true);
    expect(scopeCompleteness({ ...FULL, consentMeasure: false }).complete).toBe(false);
    for (const k of ["role", "subject", "version", "jurisdiction", "purpose"] as const) {
      expect(scopeCompleteness({ ...FULL, [k]: "" }).complete, `${k} was not required`).toBe(false);
    }
  });

  it("does not accept whitespace as an answer", () => {
    expect(scopeCompleteness({ ...FULL, subject: "   " }).complete).toBe(false);
    expect(scopeCompleteness({ ...FULL, subject: "   " }).missing).toContain("subject");
  });

  it("learning participation is never required for a complete scope", () => {
    // Separation asserted from the other side: making learning a precondition would couple
    // compliance-shaped work to a research opt-in, which is the conflation WP-3 forbids.
    expect(scopeCompleteness({ ...FULL, consentLearning: false }).complete).toBe(true);
  });
});

describe("liveDoorsFor", () => {
  it("carries the subject into the commission door and URL-encodes it", () => {
    const commission = liveDoorsFor({ ...BLANK, subject: "acme llm/v2" }).find((d) => d.id === "commission")!;
    expect(commission.href).toContain("tab=measured");
    expect(commission.href).toContain("subject=acme%20llm%2Fv2");
  });

  it("omits the parameter rather than sending an empty one", () => {
    expect(liveDoorsFor({ ...BLANK, subject: "   " }).find((d) => d.id === "commission")!.href)
      .not.toContain("subject=");
  });

  it("every door it offers names the endpoint behind it", () => {
    for (const d of liveDoorsFor({ ...BLANK, subject: "x" })) {
      expect(d.note, `${d.id} names no endpoint`).toMatch(/\/api\//);
    }
  });

  it("labels the doors as executable tools rather than guides", () => {
    // WP-3: "Label guides versus executable tools." All three of these answer today.
    expect(text).toMatch(/executable tool/i);
  });
});
