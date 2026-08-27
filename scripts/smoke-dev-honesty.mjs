#!/usr/bin/env node
/**
 * Local dev honesty API smoke — port 3001 (vite proxies /api/* here).
 */
const BASE = process.env.HONESTY_API_BASE || "http://127.0.0.1:3001";
const checks = [];
const ok = (name, pass, detail = "") => { checks.push({ name, pass, detail }); };
async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  const ct = r.headers.get("content-type") ?? "";
  const body = ct.includes("json") ? await r.json() : await r.text();
  return { status: r.status, ct, body };
}
try {
  const health = await get("/api/health");
  ok("/api/health", health.status === 200 && health.body?.ok === true);
  const indices = await get("/api/indices");
  ok("/api/indices UNMEASURED", indices.body?.register === "UNMEASURED");
} catch (e) { ok("fetch", false, String(e.message ?? e)); }
const failed = checks.filter((c) => !c.pass);
if (failed.length) process.exit(1);
