/**
 * /reach — the page that carries the stages the front door does not.
 *
 * Pinned:
 *  - every one of the seven funnel stages gets a line, in funnel order, including the commercial
 *    ones and every UNMEASURED one: a stage that quietly disappears is how a funnel flatters
 *    itself, and the ruling was "off the front page, published in full here"
 *  - the "what it would take" line is the row's OWN reason, verbatim off /api/footprint
 *  - the page mounts the funnel variant, never the hero one
 *  - no conversion rate, no price, "users" is never a unit, and the artifact's window adjectives
 *    ("gross", "cumulative") never reach a reader
 *  - it is wired the four ways a new page needs, and it is reachable and escapable in one click
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import Reach, { STAGE_MEANING, stageLines } from "./Reach";
import { FULL_FUNNEL_STAGES } from "@/components/liveCountersFormat";

const here = resolve(__dirname);
const page = readFileSync(resolve(here, "Reach.tsx"), "utf8");
const app = readFileSync(resolve(here, "../App.tsx"), "utf8");
const manifest = readFileSync(resolve(here, "../data/route-manifest.ts"), "utf8");
const libraryIa = readFileSync(resolve(here, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(here, "../../../scripts/prerender.mjs"), "utf8");
const footer = readFileSync(resolve(here, "../components/Footer.tsx"), "utf8");
const reach = readFileSync(resolve(here, "../components/home/HomeReach.tsx"), "utf8");

const payload = {
  registry_listings: { state: "READ", value: 833 },
  gross_distribution: { state: "PARTIAL", value: 395977, reason: "one package 404s on its counter and is named on its own row" },
  qualified_distribution: { state: "UNMEASURED", reason: "No mirror-adjusted counter exists for the fleet. A sample is not a rate to multiply by." },
  observed_execution: { state: "UNMEASURED", reason: "No counter exists behind a verify-page execution, a tool call or an install being run." },
  economic_use: { state: "READ", value: 1 },
  repeat_payers: { state: "UNMEASURED", reason: "No payer has settled twice." },
  institutional_use: { state: "UNMEASURED", reason: "No register of institutions using the estate exists, and a download or a payer wallet does not identify one." },
};

const render = (node: React.ReactNode) => renderToStaticMarkup(<Router ssrPath="/reach">{node}</Router>);

describe("stage lines", () => {
  it("gives every funnel stage a line, in funnel order, commercial and unmeasured included", () => {
    const lines = stageLines(payload);
    expect(lines.map((l) => l.key)).toEqual(FULL_FUNNEL_STAGES);
    expect(lines).toHaveLength(7);
    for (const key of ["economic_use", "repeat_payers", "institutional_use"] as const) {
      expect(lines.find((l) => l.key === key)).toBeTruthy();
    }
    expect(lines.filter((l) => l.state === "UNMEASURED")).toHaveLength(4);
  });

  it("prints each stage's own reason verbatim rather than a summary of it", () => {
    const lines = stageLines(payload);
    expect(lines.find((l) => l.key === "qualified_distribution")!.reason).toBe(
      payload.qualified_distribution.reason,
    );
    expect(lines.find((l) => l.key === "registry_listings")!.reason).toBeNull();
  });

  it("says a stage is absent rather than dropping it, and says 'reading' before the payload lands", () => {
    expect(stageLines({}).every((l) => l.state === "absent from the payload")).toBe(true);
    expect(stageLines(null).every((l) => l.state === "reading")).toBe(true);
    expect(stageLines({}).map((l) => l.key)).toEqual(FULL_FUNNEL_STAGES);
  });

  it("describes what every stage counts, without using people as a unit", () => {
    for (const key of FULL_FUNNEL_STAGES) {
      expect(STAGE_MEANING[key].length).toBeGreaterThan(20);
      expect(STAGE_MEANING[key]).not.toMatch(/\busers\b/i);
    }
  });
});

describe("the page", () => {
  it("mounts the funnel variant, never the short one", () => {
    expect(page).toContain('variant="funnel"');
    expect(page).not.toContain('variant="hero"');
    expect(page).not.toContain('variant="footer"');
  });

  it("renders every stage and the reason each empty one is empty", () => {
    const html = render(<Reach />);
    // Server render: the payload has not landed, so every stage says it is being read — and all
    // seven are still on the page.
    expect(html.match(/data-stage-row="/g)).toHaveLength(7);
    expect(html).toContain("Paying wallets");
    expect(html).toContain("Repeat payers");
    expect(html).toContain("Institutions");
  });

  it("refuses a conversion rate and says why", () => {
    const html = render(<Reach />);
    expect(html).toContain("You will not find a conversion rate");
    expect(page).not.toMatch(/conversion\s*rate\s*[:=]/i);
    // No arithmetic across stages anywhere in this file.
    expect(page).not.toMatch(/value\s*\/\s*\w+\.value/);
  });

  it("carries no price, no accounting adjective, and never uses people as a unit", () => {
    const html = render(<Reach />);
    // Our own copy only. The component's honesty line legitimately contains the sentence
    // "Downloads are not users, and users are not customers" — that is the doctrine being
    // stated, not a unit being used, and it is the line the page was asked to carry.
    const ours = html.replace(/<section data-testid="live-counters-funnel"[\s\S]*?<\/section>/, "");
    expect(ours).not.toContain("live-counters-funnel");
    for (const re of [/\bgross\b/i, /\bcumulative\b/i, /\baggregate\b/i, /\busers\b/i, /[£$€]\s?\d/]) {
      expect(ours).not.toMatch(re);
    }
    // …and the component's line IS on the page.
    expect(html).toContain("Downloads are not users");
  });

  it("lets a reader leave in one click, in both directions", () => {
    const html = render(<Reach />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/methodology"');
    expect(html).toContain('href="/api/footprint"');
    expect(html).toContain('href="/interop/distribution-latest.json"');
    // …and the short views name it.
    expect(reach).toContain('href="/reach"');
    expect(footer).toContain("/reach");
  });
});

describe("wiring — four ways, or it ships marked archived", () => {
  it("has a lazy import and a route", () => {
    expect(app).toContain('lazy(() => import("./pages/Reach"))');
    expect(app).toContain('<Route path="/reach" component={Reach} />');
  });

  it("is in the route manifest", () => {
    expect(manifest).toContain('"path": "/reach"');
  });

  it("is a PRIMARY path, so it never renders the archive banner", () => {
    expect(libraryIa).toContain('"/reach"');
  });

  it("is prerendered, so a cold load is not the SPA shell", () => {
    expect(prerender).toContain('"/reach"');
  });
});
