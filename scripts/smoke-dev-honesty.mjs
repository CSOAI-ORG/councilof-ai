#!/usr/bin/env node
/**
 * Local dev honesty API smoke — port 3001 (vite proxies /api/* here).
 * Run after `npm run dev:server` or full `npm run dev`.
 */
const BASE = process.env.HONESTY_API_BASE || "http://127.0.0.1:3001";

const checks = [];
const ok = (name, pass, detail = "") => {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

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
  ok("/api/indices JSON", indices.ct.includes("json"), indices.ct);
  ok(
    "/api/indices UNMEASURED",
    indices.body?.register === "UNMEASURED" &&
      Array.isArray(indices.body?.indices) &&
      indices.body.indices.every((i) => i.measured_score === null),
    `count=${indices.body?.count}`,
  );

  const ai = await get("/api/indices/ai-economy");
  ok("/api/indices/ai-economy", ai.status === 200 && ai.body?.index?.measured_score === null);

  const rwa = await get("/api/rwa-attestation");
  ok(
    "/api/rwa-attestation UNMEASURED",
    rwa.body?.register === "UNMEASURED" && rwa.body?.measured_score === null,
  );

  const mcp = await get("/api/mcp");
  ok("/api/mcp JSON", mcp.ct.includes("json"));
  ok(
    "/api/mcp registry",
    mcp.body?.register === "REPORTED" && Array.isArray(mcp.body?.servers) && mcp.body.servers.length >= 200,
    `servers=${mcp.body?.servers?.length}`,
  );
} catch (e) {
  ok("fetch", false, String(e.message ?? e));
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} dev-honesty checks passed`);
if (failed.length) {
  console.error("Start dev server: npm run dev:server");
  process.exit(1);
}
