/**
 * commit-fabric.mjs — /api/fabric as THIS commit's Pages Function would build it, against the
 * board THIS commit serves.
 *
 * WHY. Deploy 38857703670 (273856d2, #3266 33 axes) failed facts-gate with 5 axis-count
 * contradictions: /ecosystem, /governance-commons, /integrations and /safe-space baked
 * "23 axes · 23 measured reported by the historical board endpoint". The prerender proxied
 * /api/fabric to production, so the OLD deployment's fabric code read the OLD live board (23 axes)
 * while the commit's own board reference said 33. That is the same defect commit-board.mjs fixed
 * for /api/gspc on 28 Sep: a number that depends on which deploy is live is not a property of the
 * commit, and any board change deadlocks the deploy that would make it live.
 *
 * WHAT. Bundle functions/api/fabric.ts and call its buildFabricManifest with a fetcher that answers
 * the bare /api/gspc probe with the exact frozen board bytes the prerender serves every other page
 * (the same reference facts-gate checks). Every other probe still goes to the real data origin, so
 * the runtime rails stay observations. No gate is changed or relaxed.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const COMMIT_FABRIC_ENTRY = "functions/api/fabric.ts";
let cached;

async function loadBuilder(repoRoot) {
  if (cached) return cached;
  const esbuild = await import("esbuild");
  const built = await esbuild.build({
    entryPoints: [resolve(repoRoot, COMMIT_FABRIC_ENTRY)], bundle: true, format: "esm",
    platform: "neutral", target: "es2022", mainFields: ["module", "main"], write: false, logLevel: "silent",
  });
  const dir = mkdtempSync(join(tmpdir(), "commit-fabric-"));
  try {
    const file = join(dir, "fabric.mjs");
    writeFileSync(file, built.outputFiles[0].text);
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.buildFabricManifest !== "function") throw Error("COMMIT_FABRIC_NO_BUILDER");
    cached = mod.buildFabricManifest;
    return cached;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Board-pinned fetcher: bare /api/gspc → frozen board bytes; everything else → real fetch. */
export function boardPinnedFetcher(frozenBoard, realFetch = fetch) {
  return async (input, init) => {
    const u = new URL(typeof input === "string" ? input : input.url ?? String(input));
    if (u.pathname === "/api/gspc" && !u.search) {
      return new Response(frozenBoard, { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });
    }
    return realFetch(input, init);
  };
}

/** Returns { status, contentType, raw } for this commit's /api/fabric against the frozen board. */
export async function commitFabric(repoRoot, dataOrigin, frozenBoard, realFetch = fetch) {
  const build = await loadBuilder(repoRoot);
  const body = await build(new URL("/api/fabric", dataOrigin).href, boardPinnedFetcher(frozenBoard, realFetch));
  return { status: 200, contentType: "application/json; charset=utf-8", raw: Buffer.from(JSON.stringify(body, null, 2)) };
}
