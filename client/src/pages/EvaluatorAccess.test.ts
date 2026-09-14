import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "EvaluatorAccess.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(__dirname, "../../../scripts/prerender.mjs"), "utf8");
const signedCardsDir = resolve(__dirname, "../../../public/signed/cards");

describe("/evaluator-access — Conditions for Independent Evaluator Access", () => {
  it("carries all four wirings a new page needs (route, title, prerender MUST, PRIMARY_PATHS) and a nav entry", () => {
    expect(app).toContain('const EvaluatorAccess = lazy(() => import("./pages/EvaluatorAccess"))');
    expect(app).toContain('<Route path="/evaluator-access" component={EvaluatorAccess} />');
    expect(app).toMatch(/"\/evaluator-access": "Conditions for Independent Evaluator Access/);
    expect(prerender).toContain('"/evaluator-access"');
    expect(library).toContain('"/evaluator-access"');
    expect(nav).toContain("href: '/evaluator-access'");
  });

  it("states every condition the work order names", () => {
    for (const s of ["No money from the developer being evaluated", "No gag clauses", "The method goes on the card", "The corrections ledger governs", "Access and redaction terms are visible"]) {
      expect(page).toContain(s);
    }
    expect(page).toContain('checkHref: "/api/corrections"');
  });

  it("claims no endorsement, adoption or partnership, and types no price or verdict", () => {
    expect(page).toContain("does not claim that any developer");
    expect(page).not.toMatch(/\b(endorsed by|adopted by|in partnership with|signed up to|agreed to by)\b/i);
    expect(page).not.toMatch(/\$\s?\d|\b\d+(\.\d+)?\s?USDC\b/);
    expect(page).not.toMatch(/\b(compliant|approved|guaranteed?)\b/i);
    expect(page).not.toMatch(/(?<!UN)MEASURED\b/);
    expect(page).toContain("Measurement, not certification");
  });

  it("uses the route title as the single title authority", () => {
    expect(page).not.toContain("<title>");
  });

  it("does not backdate the new publication requirements onto older card schemas", () => {
    const cards = readdirSync(signedCardsDir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(readFileSync(resolve(signedCardsDir, name), "utf8")))
      .filter((card) => card?.body?.kind === "gspc.measurement-card");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some((card) =>
      card.body.instrument === undefined ||
      card.body.item_bank_version === undefined ||
      card.body.n === undefined ||
      card.body.grading_rule === undefined ||
      card.body.access === undefined
    )).toBe(true);
    expect(page).toContain("Earlier published records use older schemas and may omit some of these fields");
    expect(page).toContain("Earlier published records may not contain these access fields");
    expect(page).toMatch(/it is not evidence that an earlier published result\s+met these conditions/);
  });
});
