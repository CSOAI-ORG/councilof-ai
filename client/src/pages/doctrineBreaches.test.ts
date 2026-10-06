// Doctrine breaches found live on 6 Oct 2026 (17:15Z) and withdrawn or corrected in one lane:
//   1. /authority handed out embeddable "Council-Verified" badges — a conformity mark.
//   2. /frameworks/uk-ai-bill quoted a fine no enacted UK law sets.
//   3. The Council OS Leaderboard ranked our own models with third-party ones (Leaderboard.test.ts,
//      gspcFleet.test.ts and cardMatrix.kinds.test.ts hold that one).
//   4. /intel, an internal sales-target board, was routed, listed in the catalogue and the sitemap.
// Each check below reads the producer AND the generated artifact, because a claim lives in both.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
// Comments are stripped before matching, so the history written into a file cannot fail a check.
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function redirectRules(text: string): { from: string; to: string; status: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/))
    .filter((p) => p.length >= 3)
    .map(([from, to, status]) => ({ from, to, status }));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|json)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const WITHDRAWN: Record<string, string> = { "/authority": "/gspc-verify/", "/intel": "/" };

describe("withdrawn pages: /authority and /intel", () => {
  const app = read("client/src/App.tsx");

  it("neither route is mounted and neither page module ships", () => {
    expect(app).not.toMatch(/path="\/authority"|path="\/intel"/);
    expect(app).not.toMatch(/\bBadgesPage\b|import\("\.\/pages\/Intel"\)/);
    expect(existsSync(join(ROOT, "client/src/pages/BadgesPage.tsx"))).toBe(false);
    expect(existsSync(join(ROOT, "client/src/pages/Intel.tsx"))).toBe(false);
  });

  it("each 308s from the generator and from the generated _redirects, both slash forms", () => {
    const gen = read("scripts/generate-redirects.mjs");
    const built = redirectRules(read("public/_redirects"));
    for (const [from, to] of Object.entries(WITHDRAWN)) {
      for (const f of [from, `${from}/`]) {
        expect(gen).toMatch(new RegExp(`"${f.replace(/\//g, "\\/")}\\s+${to.replace(/\//g, "\\/")}\\s+308"`));
        const rules = built.filter((r) => r.from === f);
        expect(rules, f).toHaveLength(1);
        expect(rules[0].to).toBe(to);
        expect(rules[0].status).toBe("308");
      }
    }
  });

  it("neither is listed in the sitemap, the route manifest, the head map or any in-app list", () => {
    const sitemap = read("public/sitemap.xml");
    const manifest = read("client/src/data/route-manifest.ts");
    const head = JSON.parse(read("client/src/data/seo-head.json"));
    for (const p of Object.keys(WITHDRAWN)) {
      expect(sitemap).not.toContain(`<loc>https://councilof.ai${p}/</loc>`);
      expect(sitemap).not.toContain(`<loc>https://councilof.ai${p}</loc>`);
      expect(manifest).not.toContain(`"path": "${p}"`);
      expect(head.routes[p]).toBeUndefined();
    }
    expect(head.components.BadgesPage).toBeUndefined();
    expect(head.components.Intel).toBeUndefined();
    expect(read("client/src/components/lobby/tabs.ts")).not.toMatch(/path: "\/intel"/);
    expect(read("client/src/components/CouncilNav.tsx")).not.toContain('"/intel"');
    expect(read("client/src/data/library-ia.ts")).not.toMatch(/"\/intel",/);
    expect(read("scripts/prerender.mjs")).not.toContain('"/intel"');
    // place-end-user-aliases copies HOME into every STRANGER_DIR without a page: /intel/ would serve 200 again.
    const aliases = read("scripts/place-end-user-aliases.mjs");
    const stranger = aliases.slice(aliases.indexOf("export const STRANGER_DIRS"), aliases.indexOf("];", aliases.indexOf("export const STRANGER_DIRS")));
    expect(stranger).not.toMatch(/"intel"/);
    expect(stranger).not.toMatch(/"authority"/);
  });

  it("no client source links the withdrawn paths", () => {
    const hits = walk(join(ROOT, "client/src"))
      .filter((f) => /["'`]\/(intel|authority)\/?["'`?#]/.test(code(readFileSync(f, "utf8"))))
      .map((f) => f.slice(ROOT.length + 1))
      // route-manifest.ts is regenerated from App.tsx and is checked above; seo-head.json likewise.
      .filter((f) => !/route-manifest\.ts$|seo-head\.json$/.test(f));
    expect(hits).toEqual([]);
  });

  it("no client source still offers a Council-Verified badge", () => {
    const hits = walk(join(ROOT, "client/src")).filter((f) => /council[\s-]?verified/i.test(code(readFileSync(f, "utf8"))));
    // Includes client/src/lib/pdfExport.ts, which drew a "COUNCIL VERIFIED" seal on certificate PDFs.
    expect(hits.map((f) => f.slice(ROOT.length + 1))).toEqual([]);
  });
});

describe("UK AI regulation pages quote no invented fine", () => {
  const pages = ["client/src/pages/UKAIBill.tsx", "client/src/pages/UKAIBillCompliance.tsx"];

  it("no £ figure, turnover percentage or enforcement deadline", () => {
    for (const p of pages) {
      const s = code(read(p));
      expect(s, p).not.toMatch(/£\s?\d/);
      expect(s, p).not.toMatch(/\d+%\s+of\s+(global\s+)?turnover/i);
      expect(s, p).not.toMatch(/deadline=|Enforcement deadline/);
      expect(s, p).not.toMatch(/FrameworkLandingPage|certificationInfo/);
    }
  });

  it("both say plainly that no AI-specific statute or penalty regime is in force", () => {
    expect(read(pages[0])).toMatch(/no AI-specific penalty regime/);
    expect(read(pages[1])).toMatch(/no AI-specific penalty regime/);
    expect(read(pages[1])).not.toMatch(/Is it mandatory\?|"Yes, for high-risk/);
  });

  it("the Library labels the page as UK AI rules, not as a bill, from the manifest producer", () => {
    const gen = read("scripts/generate-route-manifest.mjs");
    expect(gen).toMatch(/UKAIBill: "UK AI rules \(no AI statute in force\)"/);
    const manifest = read("client/src/data/route-manifest.ts");
    const row = manifest.slice(manifest.indexOf('"path": "/frameworks/uk-ai-bill"'), manifest.indexOf('"path": "/frameworks/uk-ai-bill"') + 160);
    expect(row).toContain('"title": "UK AI rules (no AI statute in force)"');
    const head = JSON.parse(read("client/src/data/seo-head.json"));
    expect(head.components.UKAIBill.description).not.toMatch(/risk classification/);
  });
});
