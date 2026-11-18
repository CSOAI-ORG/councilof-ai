/**
 * One meta description per page: seoHead is the only writer of the tags applyHead owns.
 *
 * WHY (measured live 2026-11-18, 05:31Z): twenty routes, /status/, /traction/, /gpai/, /him/ and
 * /notes/ among them, and the evidence-note pages shipped TWO <meta name="description"> tags.
 * RouteHead wrote the first from client/src/data/seo-head.json; the page's own <Helmet> block added
 * the second, usually with different text. Sixteen of those routes shipped two <title> tags the same
 * way, four routes and the note pages a second og:url, and /evaluator-access/ a second canonical.
 * applyHead upserts the FIRST matching tag, so it can never remove one it did not write. The fix is
 * at the producer: a page does not render these tags, and the page's own wording, where it was the
 * accurate one, now lives in seo-head.json.
 *
 * Everything here reads source or calls resolveHead. No DOM, no React, no network.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, resolveHead, SHELL_DESCRIPTION } from "./seoHead";

const SRC = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(SRC, p), "utf8");

/** Every shipped JSX source under client/src. Test files are not shipped. */
function jsxSources(dir = SRC, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) jsxSources(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name) && !e.name.includes(".test.")) out.push(p);
  }
  return out;
}

// Comments are stripped first, so a file that records this history cannot fail the scan.
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Each <Helmet …>…</Helmet> block, or a self-closing <Helmet …/>, props included. */
function helmetBlocks(code: string): string[] {
  const blocks: string[] = [];
  const open = /<Helmet\b[^>]*?(\/?)>/g;
  for (let m = open.exec(code); m; m = open.exec(code)) {
    if (m[1] === "/") { blocks.push(m[0]); continue; }
    const end = code.indexOf("</Helmet>", open.lastIndex);
    blocks.push(code.slice(m.index, end === -1 ? code.length : end));
  }
  return blocks;
}

// name="description", property="og:description", name={"twitter:description"}, or a props-array
// entry { name: "description" }: the three tags applyHead writes from one description.
const DESCRIPTION_KEY = /\b(?:name|property)\s*[=:]\s*\{?\s*["'`](?:description|og:description|twitter:description)["'`]/;
// A bare JSX <meta> is hoisted into <head> as well, so it is a second tag wherever it is rendered.
const DESCRIPTION_META = /<meta\b[^>]*?\b(?:name|property)\s*=\s*\{?\s*["'`](?:description|og:description|twitter:description)["'`]/;

function rendersDescription(src: string): boolean {
  const code = stripComments(src);
  return DESCRIPTION_META.test(code) || helmetBlocks(code).some((b) => DESCRIPTION_KEY.test(b));
}

// The pages whose <Helmet> blocks carried a description on 2026-11-18 (MergeMe is unrouted).
const FIXED_PAGES = [
  "Art50", "ClaritySpecimen", "CountdownPage", "CustodyDisclosure", "EvaluatorAccess", "EvidenceNotes",
  "FeedLaunchPack", "FrameworkPresence", "GpaiMatrix", "HealthInventory", "Him", "MergeMe",
  "ProofOfReceipt", "ProofReceipt", "Rlusd", "Stablecoins", "Traction", "Wrappers", "YieldDashboard",
  "YieldStatus",
];
// The routes those pages serve, each of which shipped two description tags.
const FIXED_ROUTES = [
  "/art50", "/specimens/clarity", "/countdown", "/custody", "/evaluator-access", "/notes", "/stablewatch",
  "/frameworks", "/gpai", "/health-inventory", "/him", "/proof-receipt", "/receipt", "/rlusd",
  "/stablecoins", "/traction", "/wrappers", "/sovx", "/yield", "/status",
];

describe("one description per page", () => {
  it("no shipped source renders a description, og:description or twitter:description tag", () => {
    const files = jsxSources();
    expect(files.length, "the scan found no pages; it would pass vacuously").toBeGreaterThan(300);
    const hits = files.filter((f) => rendersDescription(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));
    expect(hits).toEqual([]);
  });

  it("the fixed pages leave <title>, og:title, twitter:title, og:url and canonical to the central writer", () => {
    const owned = /<title\b|\b(?:name|property)\s*=\s*["'](?:og:title|twitter:title|og:url|twitter:url)["']|\brel\s*=\s*["']canonical["']/;
    const hits = FIXED_PAGES.filter((p) => helmetBlocks(stripComments(read(`pages/${p}.tsx`))).some((b) => owned.test(b)));
    expect(hits).toEqual([]);
  });

  it("each fixed route resolves a reviewed seo-head.json entry: not the shell's description, not a derived fallback", () => {
    const bad = FIXED_ROUTES.map((p) => [p, resolveHead(p)] as const)
      .filter(([, h]) =>
        !(h.source === "route" || h.source === "component") ||
        h.description === SHELL_DESCRIPTION ||
        h.description.length < DESCRIPTION_MIN ||
        h.description.length > DESCRIPTION_MAX)
      .map(([p, h]) => `${p} → ${h.source}: "${h.description}"`);
    expect(bad).toEqual([]);
  });

  it("an evidence note refines the one head with its own summary, through applyHead", () => {
    // /notes/:slug resolves a family fallback before the record loads; the page then writes the
    // note's summary into the same tags instead of rendering a second set.
    expect(resolveHead("/notes/governance-same-bank-gap").source).toBe("family");
    const page = stripComments(read("pages/EvidenceNotes.tsx"));
    expect(page).toMatch(/applyHead\(\{\s*\.\.\.resolveHead\(notePath\(note\.id\)\)[^}]*\bdescription: note\.summary/);
    expect(page).toMatch(/\bogDescription: note\.summary/);
  });
});
