import { describe, expect, it } from "vitest";
import { buildSync } from "esbuild";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * A 20 MiB INPUT FITS UNDER A 64 MiB HEAP (20 Nov 2026). The paid MCP tool always sends its input
 * here as bytes_b64 or manifest_b64. The route decoded it with Uint8Array.from(atob(...), map), which
 * needed at least 290 MB of old space to measure 20 MiB through this handler (640–780 MB at its peak
 * with the heap uncapped), whatever the bytes. It now needs 34 MB. A Worker has 128 MB; this is
 * Node's V8 heap, not workerd's, so it shows the decode is linear, not that production fits.
 *
 * The test runs the real handler, bundled, in a child process whose old generation is capped, for
 * 20 MiB of zeros and 20 MiB of random bytes: once on the engine's Uint8Array.fromBase64 where it has
 * one, and once on the portable path. The cap is the child's own command-line flag, not a
 * worker_threads resourceLimit: a heap flag in NODE_OPTIONS is process-wide and silently overrides a
 * worker's limit (it did where this was written), and the child's flag comes last.
 */
const CAP_MB = 64;
const N = 20 * 1024 * 1024; // the route's MAX_BYTES

const ROUTE = buildSync({
  entryPoints: [fileURLToPath(new URL("./marking-evidence.ts", import.meta.url))],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "route",
  platform: "node",
  target: "es2022",
  logLevel: "silent",
}).outputFiles[0].text;

// CommonJS, read from stdin. The body is built as bytes, so the probe itself keeps nothing big on the heap.
const PROBE = `
const { createHash } = require("node:crypto");
${ROUTE}
(async () => {
  const rows = [];
  for (const path of ["engine", "portable"]) {
    if (path === "portable") delete Uint8Array.fromBase64;
    for (const kind of ["zeros", "random"]) {
      let raw = new Uint8Array(${N});
      if (kind === "random") { let x = 0x9e3779b9; for (let i = 0; i < raw.length; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; raw[i] = x; } }
      const sha256 = createHash("sha256").update(raw).digest("hex");
      let body = Buffer.concat([Buffer.from('{"bytes_b64":"'), Buffer.from(Buffer.from(raw.buffer).toString("base64")), Buffer.from('"}')]);
      raw = null;
      const request = new Request("https://councilof.ai/api/art50/marking-evidence?preview=1", { method: "POST", headers: { "content-type": "application/json" }, body });
      body = null;
      const res = await route.onRequestPost({ request, env: {}, params: {} });
      const subject = (await res.json()).measurement?.subject;
      rows.push({ path, kind, status: res.status, bytes: subject?.bytes ?? null, same_sha256: subject?.sha256 === sha256 });
    }
  }
  process.stdout.write(JSON.stringify(rows));
})();
`;

function runCapped(): Promise<{ status: number | null; signal: string | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`--max-old-space-size=${CAP_MB}`, "-"], { env: { ...process.env, NODE_OPTIONS: "" } });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (d: string) => (stdout += d));
    child.stderr.setEncoding("utf8").on("data", (d: string) => (stderr += d));
    child.on("error", reject);
    child.on("close", (status, signal) => resolve({ status, signal, stdout, stderr }));
    child.stdin.end(PROBE);
  });
}

describe("art50 marking-evidence: the largest bytes_b64 input", () => {
  it(`measures 20 MiB of zeros and of random bytes POSTed as bytes_b64 with the old generation capped at ${CAP_MB} MiB`, async () => {
    const run = await runCapped();
    // Out of heap, the child dies with "Reached heap limit" on stderr and no rows.
    expect({ status: run.status, signal: run.signal }, run.stderr.slice(-600)).toEqual({ status: 0, signal: null });
    const ok = { status: 200, bytes: N, same_sha256: true };
    expect(JSON.parse(run.stdout)).toEqual([
      { path: "engine", kind: "zeros", ...ok },
      { path: "engine", kind: "random", ...ok },
      { path: "portable", kind: "zeros", ...ok },
      { path: "portable", kind: "random", ...ok },
    ]);
  }, 60_000);
});
