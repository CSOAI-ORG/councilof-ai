import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { Router } from "wouter";
import HomeHero from "./HomeHero";
import { HomeWatchdog, HomeLearningJourney, HomeJourneyQuestions, WATCHDOG_JOURNEYS, LEARNING_JOURNEYS, PUBLIC_JOURNEY_FAQS } from "./HomePublicJourney";

const render = (node: React.ReactNode) => new JSDOM(renderToStaticMarkup(<Router ssrPath="/">{node}</Router>)).window.document;

describe("public evidence and learning journeys", () => {
  it("makes the Watchdog a named homepage destination and keeps the primary results CTA", () => {
    const page = render(<><HomeHero /><HomeWatchdog /></>);
    expect(page.querySelector('a[href="#watchdog"]')?.textContent).toContain("Public Watchdog");
    expect(page.querySelector('#watchdog')?.getAttribute("aria-labelledby")).toBe("home-watchdog-h");
    expect(page.querySelectorAll('[data-cta="primary"]')).toHaveLength(1);
    expect(page.querySelector('[data-cta="primary"]')?.getAttribute("href")).toBe("#board");
  });
  it("offers real claim, reference and correction journeys, not an incident form", () => {
    const page = render(<HomeWatchdog />);
    expect(WATCHDOG_JOURNEYS.map((x) => x.href)).toEqual(["/watchdog/", "/watchdog/?view=library", "/dashboard?tab=corrections"]);
    expect(page.querySelectorAll("article")).toHaveLength(3);
    expect(page.querySelectorAll("form, input, textarea")).toHaveLength(0);
    expect(page.body.textContent).toContain("not a staffed incident-response service");
    expect(page.body.textContent).toContain("Do not submit private incident details");
  });
  it("shows Academy, practice and human-review destinations in one workspace", () => {
    const page = render(<HomeLearningJourney />);
    expect(LEARNING_JOURNEYS.map((x) => x.href)).toEqual(["/dashboard?tab=academy", "/dashboard?tab=learn", "/dashboard?tab=staff"]);
    expect(page.querySelector('a[href="/dashboard?tab=him"]')).not.toBeNull();
    expect(page.body.textContent).toContain("Council for the Safety of Artificial Intelligence");
  });
  it("keeps practice separate from authority, benchmark changes and deployed-model training", () => {
    const text = render(<HomeLearningJourney />).body.textContent;
    expect(text).toContain("not a professional qualification");
    expect(text).toContain("does not, by itself, train or improve a deployed AI model");
    expect(text).toContain("still needs the relevant review");
  });
  it("uses native keyboard-operable disclosure elements without hiding the main actions", () => {
    const page = render(<><HomeWatchdog /><HomeLearningJourney /></>);
    expect(page.querySelectorAll("details > summary")).toHaveLength(2);
    expect(page.querySelectorAll("details[open]")).toHaveLength(0);
    expect(page.querySelectorAll("article a")).toHaveLength(6);
    expect(page.querySelectorAll('[tabindex="-1"]')).toHaveLength(0);
  });
  it("generates FAQ schema from exactly the questions and answers a person can read", () => {
    const page = render(<HomeJourneyQuestions />);
    const ld = JSON.parse(page.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(PUBLIC_JOURNEY_FAQS.length);
    const disclosures = [...page.querySelectorAll("details")];
    disclosures.forEach((item, index) => {
      expect(item.querySelector("summary")?.textContent).toBe(ld.mainEntity[index].name);
      expect(item.querySelector("p")?.textContent).toBe(ld.mainEntity[index].acceptedAnswer.text);
    });
    expect(page.querySelectorAll("h1")).toHaveLength(0);
  });
  it("keeps publication time, measurement time and signature meaning distinct", () => {
    const page = render(<HomeJourneyQuestions />);
    expect(page.body.textContent).toContain("not a fresh measurement");
    expect(page.body.textContent).toContain("does not, by itself, establish");
    expect(page.body.textContent).toContain("payment does not change a measurement");
  });
  it("uses only bounded existing routes and never a dead placeholder", () => {
    const page = render(<><HomeWatchdog /><HomeLearningJourney /><HomeJourneyQuestions /></>);
    for (const anchor of page.querySelectorAll("a")) {
      const href = anchor.getAttribute("href")!;
      expect(href).toMatch(/^\/(dashboard\?tab=(watchdog|corrections|academy|learn|staff|him)|watchdog\/(\?view=library)?|faq\/|services\/|contact\?arm=run)$/);
      expect(href).not.toBe("#");
    }
  });
  it("integrates into the actual root page without dropping existing evidence or report bands", () => {
    const source = readFileSync(resolve(__dirname, "../../pages/HomeVerify.tsx"), "utf8");
    for (const name of ["HomeHero", "HomeWatchdog", "HomeResults", "HomeMine", "HomeProducts", "HomeLearningJourney", "HomeEvidence", "HomeDevelopers", "HomeJourneyQuestions", "HomeUpdates"]) expect(source).toContain(`<${name} />`);
    expect(source.indexOf("<HomeWatchdog />")).toBeLessThan(source.indexOf("<HomeResults />"));
    expect(source).toContain("gspcDatasetLd(false)");
    expect(source).not.toContain("contact@council");
  });
  it("keeps all six hero anchors meaningful and unique", () => {
    const page = render(<HomeHero />);
    const links = [...page.querySelectorAll('[data-journey-index] a')];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#board", "#watchdog", "#products", "#learning", "#how-it-works", "#developers"]);
    expect(new Set(links.map((a) => a.getAttribute("href"))).size).toBe(6);
  });
});
