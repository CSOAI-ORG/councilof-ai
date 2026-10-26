/**
 * Ratchet: every Pages function that answers GET also answers HEAD.
 *
 * WHY. Pages picks a handler by the request's ORIGINAL method. A file that exports onRequestGet but no
 * onRequestHead (or catch-all onRequest) leaves HEAD to fall through: under /api to the catch-all 404,
 * elsewhere to the static 404. On 6 Oct 2026 `curl -I` returned 404 on /api/gspc, /api/state and
 * /api/corrections while GET returned 200, and link checkers and uptime monitors recorded live public
 * data as missing. RFC 9110 §9.3.2: a general-purpose server supports HEAD. The fix in every file is
 * `export const onRequestHead = headFromGet(onRequestGet)` (./_head.ts), which also strips the payment
 * headers so a HEAD can never settle anything.
 *
 * Do not "fix" HEAD centrally in _middleware.ts via next(): the router has already chosen the handler
 * by method, so next() on a HEAD never reaches a GET-only file.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const FUNCTIONS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__fixtures__") continue;
      walk(p, out);
    } else if (/\.(ts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

// A route file: not a `_` helper, not a test, not a declaration file.
const isRoute = (f: string) => {
  const b = basename(f);
  return !b.startsWith("_") && !/\.(test|spec)\./.test(b) && !b.endsWith(".d.ts");
};

/** True when the module text exports `name` — declared, re-exported, or aliased (`x as name`). */
export function exportsHandler(src: string, name: string): boolean {
  const declared = new RegExp(`export\\s+(?:const|let|var|async\\s+function|function)\\s+${name}\\b`);
  const listed = new RegExp(`export\\s*\\{[^}]*?(?:^|[\\s,{])(?:\\w+\\s+as\\s+)?${name}\\s*(?:[,}])`, "m");
  return declared.test(src) || listed.test(src);
}

describe("exportsHandler", () => {
  it("reads declared, listed, re-exported and aliased handlers, and not near-miss names", () => {
    expect(exportsHandler("export const onRequestGet = 1;", "onRequestGet")).toBe(true);
    expect(exportsHandler("export async function onRequestHead() {}", "onRequestHead")).toBe(true);
    expect(exportsHandler('export { onRequestGet, onRequestHead } from "./x";', "onRequestHead")).toBe(true);
    expect(exportsHandler("export { get as onRequestGet };", "onRequestGet")).toBe(true);
    expect(exportsHandler("export const onRequestGet = 1;", "onRequest")).toBe(false);
    expect(exportsHandler("export { onRequestGet };", "onRequest")).toBe(false);
    expect(exportsHandler("export function onRequest() {}", "onRequest")).toBe(true);
  });
});

describe("HEAD coverage", () => {
  it("every functions/** route that exports onRequestGet also exports onRequestHead or onRequest", () => {
    const files = walk(FUNCTIONS).filter(isRoute);
    const withGet = files.filter((f) => exportsHandler(readFileSync(f, "utf8"), "onRequestGet"));
    const missing = withGet
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return !exportsHandler(src, "onRequestHead") && !exportsHandler(src, "onRequest");
      })
      .map((f) => relative(FUNCTIONS, f));
    // Guard the guard: a walk that finds nothing would pass vacuously.
    expect(withGet.length).toBeGreaterThan(100);
    expect(missing, `add \`export const onRequestHead = headFromGet(onRequestGet);\` to:\n${missing.join("\n")}`).toEqual([]);
  });
});
