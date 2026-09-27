// Pins /crosswalks/owasp-asi.json to its producer, its OWASP ids to the list we fetched, and every
// link it publishes to something this site actually serves.
//
// Offline by default. CROSSWALK_LIVE=1 also re-fetches the OWASP lists and GETs every internal
// link on https://councilof.ai (run it before landing; the page's own URL 404s until deployed).
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { derive, serialise, SOURCE, OUTPUT } from "./build-owasp-asi.mjs";
import { AXES_A } from "../../functions/api/_gspc_axes_a";
import { AXES_B } from "../../functions/api/_gspc_axes_b";
import { AXES_C } from "../../functions/api/_gspc_axes_c";
import { AXES_FIN } from "../../functions/api/_gspc_axes_fin";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p));
const readJson = (p: string) => JSON.parse(read(p).toString("utf8"));
const out = readJson(OUTPUT);
const src = readJson(SOURCE);
const LIVE = process.env.CROSSWALK_LIVE === "1";

const BOARD_AXES = new Set([...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN].map((a: { axis: string }) => a.axis));
const APP = read("client/src/App.tsx").toString("utf8");
const REDIRECT_SOURCES = new Set(
  read("public/_redirects")
    .toString("utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/\s+/)[0]),
);

// Every site-relative link the crosswalk publishes.
function internalLinks(d: typeof out): string[] {
  const links = new Set<string>([new URL(d.url).pathname, new URL(d.json).pathname]);
  for (const c of d.checks) for (const l of c.live) links.add(l);
  for (const a of d.capsule_adapters) links.add(a.record);
  for (const p of d.prior_art) if (p.where.startsWith("/")) links.add(p.where);
  return [...links];
}

const hasRoute = (p: string) => APP.includes(`path="${p.replace(/\/$/, "")}"`);

// Where a site path is served from in this repo, or why it is not.
function resolves(link: string): string | null {
  const [path, query] = link.split("?");
  if (path.startsWith("/api/")) {
    const name = path.slice("/api/".length).replace(/\/$/, "");
    const fn = [`functions/api/${name}.ts`, `functions/api/${name}/index.ts`].find((f) => existsSync(join(ROOT, f)));
    if (!fn) return null;
    const axis = new URLSearchParams(query || "").get("axis");
    if (axis && !BOARD_AXES.has(axis)) return null;
    return fn;
  }
  if (REDIRECT_SOURCES.has(path)) return null; // a redirected path is not the file we meant to cite
  if (path.endsWith("/")) {
    if (existsSync(join(ROOT, "public", path, "index.html"))) return `public${path}index.html`;
    return hasRoute(path) ? "client/src/App.tsx" : null;
  }
  if (!/\.[a-z0-9]+$/i.test(path)) {
    if (existsSync(join(ROOT, "public", `${path}.html`))) return `public${path}.html`;
    return hasRoute(path) ? "client/src/App.tsx" : null;
  }
  return existsSync(join(ROOT, "public", path)) ? `public${path}` : null;
}

describe("OWASP ASI / MCP crosswalk (/crosswalks/owasp-asi/)", () => {
  it("the committed JSON is exactly what the producer derives from the source file", () => {
    const fresh = serialise(derive(read(SOURCE), readJson));
    expect(read(OUTPUT).toString("utf8")).toBe(fresh);
  });

  it("maps exactly the ten ASI ids of the fetched 2026 list, in order, with the fetched titles", () => {
    const ref = src.references.find((r: { id: string }) => r.id === "owasp-asi-2026");
    expect(ref.version).toBe("2026");
    expect(ref.fetched.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
    const ids = ref.items.map((i: { id: string }) => i.id);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => `ASI${String(i + 1).padStart(2, "0")}`));
    const cw = out.crosswalks.find((c: { reference: string }) => c.reference === "owasp-asi-2026");
    expect(cw.items.map((i: { id: string }) => i.id)).toEqual(ids);
    expect(cw.items.map((i: { title: string }) => i.title)).toEqual(ref.items.map((i: { title: string }) => i.title));
  });

  it("maps exactly the ten MCP Top 10 ids of the fetched list, in order", () => {
    const ref = src.references.find((r: { id: string }) => r.id === "owasp-mcp-top10-2025");
    const ids = ref.items.map((i: { id: string }) => i.id);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => `MCP${String(i + 1).padStart(2, "0")}:2025`));
    const cw = out.crosswalks.find((c: { reference: string }) => c.reference === "owasp-mcp-top10-2025");
    expect(cw.items.map((i: { id: string }) => i.id)).toEqual(ids);
  });

  it("counts are derived from the rows and add up to the list", () => {
    for (const cw of out.crosswalks) {
      const tally = { DIRECT: 0, PARTIAL: 0, NOT_MEASURED: 0 } as Record<string, number>;
      for (const it of cw.items) {
        const best = it.rows.some((r: { strength: string }) => r.strength === "DIRECT")
          ? "DIRECT"
          : it.rows.length
            ? "PARTIAL"
            : "NOT_MEASURED";
        expect(it.strength).toBe(best);
        tally[best] += 1;
      }
      expect(cw.counts).toEqual(tally);
      expect(tally.DIRECT + tally.PARTIAL + tally.NOT_MEASURED).toBe(cw.items.length);
    }
  });

  it("every board axis is accounted for exactly once: mapped through a check, or listed as unmapped", () => {
    const mapped = src.checks.filter((c: { axis?: string }) => c.axis).map((c: { axis: string }) => c.axis);
    const unmapped = src.unmapped.filter((u: { axis?: string }) => u.axis).map((u: { axis: string }) => u.axis);
    const all = [...mapped, ...unmapped];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...BOARD_AXES].sort());
  });

  it("every internal link resolves to something this repo serves", () => {
    const missing = internalLinks(out).filter((l) => !resolves(l));
    expect(missing).toEqual([]);
  });

  it("every observed tally names a committed file it was read from", () => {
    // These may be served through a mirror redirect; the bytes must still be in the repo.
    const files = out.checks.filter((c: { observed?: unknown }) => c.observed).map((c: { observed: { source_file: string } }) => c.observed.source_file);
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((f: string) => !existsSync(join(ROOT, "public", f)))).toEqual([]);
  });

  it("carries no grades, scores or certification wording in its own text", () => {
    const own: string[] = [];
    for (const cw of out.crosswalks)
      for (const it of cw.items) {
        if (it.note) own.push(it.note);
        for (const r of it.rows) own.push(r.rationale);
      }
    for (const c of out.checks) own.push(c.observes);
    for (const u of out.unmapped) own.push(u.reason);
    const bad = own.filter((t) => /\b(score[sd]?|scoring|certif\w*|compliant|compliance|endorse\w*|approved?)\b/i.test(t));
    expect(bad).toEqual([]);
  });

  it.runIf(LIVE)("the MCP Top 10 list on GitHub still has these ids and titles", async () => {
    const ref = src.references.find((r: { id: string }) => r.id === "owasp-mcp-top10-2025");
    const md = await (await fetch(ref.urls.index_raw)).text();
    const found = [...md.matchAll(/^\*\s*(MCP\d{2}:2025)\s*-\s*\[\s*([^\]]+?)\s*\]/gm)].map((m) => ({ id: m[1], title: m[2] }));
    expect(found).toEqual(ref.items);
  });

  it.runIf(LIVE)("the ASI announcement still names ASI01 to ASI10", async () => {
    const ref = src.references.find((r: { id: string }) => r.id === "owasp-asi-2026");
    const html = await (await fetch(ref.urls.announcement)).text();
    for (const i of ref.items) expect(html).toContain(i.id);
  });

  it.runIf(LIVE)("every internal link answers 200 on councilof.ai", async () => {
    const bad: string[] = [];
    for (const l of internalLinks(out)) {
      const r = await fetch(`https://councilof.ai${l}`, { redirect: "follow" });
      if (r.status !== 200) bad.push(`${l} ${r.status}`);
    }
    expect(bad).toEqual([]);
  }, 60_000);
});
