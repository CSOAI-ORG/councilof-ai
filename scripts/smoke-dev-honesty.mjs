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

  const toolsList = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
  ok(
    "POST /api/mcp tools/list",
    toolsList.status === 200 && Array.isArray(toolsList.body?.result?.tools),
    `tools=${toolsList.body?.result?.tools?.length}`,
  );

  const indicesTool = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "indices_catalog", arguments: {} },
    }),
  }).then(async (r) => ({ body: await r.json() }));
  const indicesText = indicesTool.body?.result?.content?.[0]?.text ?? "";
  ok(
    "POST tools/call indices_catalog UNMEASURED",
    indicesText.includes("UNMEASURED") && indicesText.includes('"measured_score": null'),
  );

  const rwaTool = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "rwa_attestation_catalog", arguments: {} },
    }),
  }).then(async (r) => ({ body: await r.json() }));
  const rwaText = rwaTool.body?.result?.content?.[0]?.text ?? "";
  ok(
    "POST tools/call rwa_attestation_catalog UNMEASURED",
    rwaText.includes("UNMEASURED") && rwaText.includes('"measured_score": null'),
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
