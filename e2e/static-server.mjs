/**
 * Zero-dependency static server for the Council OS shell smoke.
 *
 * Replaces `npx --yes serve@14`, which fetched a package from the npm registry in the
 * middle of the deploy's gating step. On 2026-09-03/04 that step timed out eight runs in
 * a row — "Timed out waiting 120000ms from config.webServer" with not one line of output,
 * because the config discarded the server's stdout. Every deploy since fb419e59f was
 * blocked before the prerender, so nothing reached councilof.ai for eleven hours.
 *
 * This server is committed, so the publish path no longer depends on the registry being
 * reachable, and it prints what it is doing so the next failure is diagnosable rather
 * than silent.
 *
 * Behaviour mirrors `serve -s`: exact file, then dir/index.html, then path.html, then the
 * SPA fallback to index.html.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist/client");
const port = Number(process.argv[3] ?? 4180);
const host = "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
  ".wasm": "application/wasm",
};

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

/** Resolve a URL pathname to a file on disk, or null to fall back to the SPA shell. */
function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  // Contain the resolution inside root: a traversal must not escape dist/client.
  const target = path.resolve(root, "." + decoded);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  for (const candidate of [target, path.join(target, "index.html"), target + ".html"]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

/** Cheap, stable validator: size + mtime is enough for a server that outlives one test run. */
function etagFor(file) {
  const st = fs.statSync(file);
  return `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
}

if (!isFile(path.join(root, "index.html"))) {
  console.error(`[static-server] FATAL: no index.html under ${root} — build:client has not run`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${host}:${port}`).pathname;
  const file = resolveFile(pathname) ?? path.join(root, "index.html");
  const ext = path.extname(file).toLowerCase();
  // Deliberately NO cache-control, matching `serve`: an ETag alone, letting the browser
  // revalidate. Do not put `Cache-Control: no-store` on the HTML document here. Measured
  // 2026-09-04: it drops Chrome onto the uncached load path, the spec's
  // waitForLoadState("networkidle", 15s) then times out on EVERY navigation, and the
  // smoke goes from 14s to 1.2m per test (6 minutes for the suite).
  const etag = etagFor(file);
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { etag });
    res.end();
    return;
  }
  const body = fs.readFileSync(file);
  res.writeHead(200, {
    "content-type": TYPES[ext] ?? "application/octet-stream",
    "content-length": body.length,
    etag,
    "accept-ranges": "bytes",
    vary: "Accept-Encoding",
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

server.on("error", (err) => {
  console.error(`[static-server] listen failed on ${host}:${port}: ${err.message}`);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`[static-server] serving ${root} at http://${host}:${port}`);
});
