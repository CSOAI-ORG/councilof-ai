/**
 * commit-board.mjs — the GSPC board exactly as THIS commit's Pages Function would serve it,
 * computed offline, with no network.
 *
 * WHY. Until 28 Sep 2026 the prerender froze whatever https://councilof.ai/api/gspc answered at
 * build time and baked it into every static page. That is the board of whichever deployment
 * happens to be live, not the board of the commit being built. On 28 Sep a production deployment
 * whose source is on neither the mirror nor GitHub (f8747b3e, source ee8ff86, older than
 * C-2026-0927-03) was live while d06d09837 built, so deploy 44340409 baked "2 tied, 12 untested"
 * into its pages while its own /api/gspc said 8 TIE · 6 UNTESTED; the next deploy baked 8 again.
 * A number that depends on which deploy is live is not a property of the commit, and the static
 * page could not say which one it had got.
 *
 * WHAT. Bundle functions/api/gspc.ts with esbuild (already a build dependency), import it, and
 * call its own onRequestGet with a stub context. Same code, same data files, same derivation as
 * the Function this commit deploys. The one difference is stated, not hidden: there is no
 * BOARD_SIGN_KEY at build time, so the Function emits no site_attestation (its own rule: "No key
 * → no attestation field"). render-board-reference.mjs decides whether the live, signed bytes may
 * be served instead — only when they are the same board as this one.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const COMMIT_BOARD_ENTRY = "functions/api/gspc.ts";
const handlers = new Map();

async function loadHandler(repoRoot) {
  const entry = resolve(repoRoot, COMMIT_BOARD_ENTRY);
  if (handlers.has(entry)) return handlers.get(entry);
  const esbuild = await import("esbuild");
  const built = await esbuild.build({
    entryPoints: [entry], bundle: true, format: "esm", platform: "neutral", target: "es2022",
    mainFields: ["module", "main"], write: false, logLevel: "silent",
  });
  const dir = mkdtempSync(join(tmpdir(), "commit-board-"));
  try {
    const file = join(dir, "gspc.mjs");
    writeFileSync(file, built.outputFiles[0].text);
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.onRequestGet !== "function") throw Error("COMMIT_BOARD_NO_HANDLER");
    handlers.set(entry, mod.onRequestGet);
    return mod.onRequestGet;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Run this commit's /api/gspc handler for `search` ("" or "?axis=…").
 * Returns { status, contentType, raw } — raw is the exact response body.
 */
export async function commitBoard(repoRoot, search = "") {
  const onRequestGet = await loadHandler(repoRoot);
  // The handler consults the Workers edge cache first; at build time there is none. A cache that
  // never hits and never stores keeps every answer computed, never remembered.
  const had = Object.prototype.hasOwnProperty.call(globalThis, "caches");
  const prev = globalThis.caches;
  globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
  try {
    const res = await onRequestGet({
      request: new Request("https://councilof.ai/api/gspc" + (search || "")),
      env: {}, params: {}, data: {}, functionPath: "/api/gspc",
      waitUntil() {}, passThroughOnException() {}, next: async () => new Response(null, { status: 404 }),
    });
    return {
      status: res.status,
      contentType: res.headers.get("content-type") || "application/json; charset=utf-8",
      raw: Buffer.from(await res.arrayBuffer()),
    };
  } finally {
    if (had) globalThis.caches = prev; else delete globalThis.caches;
  }
}
