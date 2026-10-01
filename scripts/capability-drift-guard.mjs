/**
 * One registry, N doors — and the doors must agree with it.
 *
 * Measured 2026-09-04, before this guard existed: openapi.json carried 67 paths, /mcp advertised
 * 12 tools of which 10 appeared in no other door, and the A2A agent-card declared 5 skills that
 * appeared in none. 84 capabilities, and every one of them was reachable through exactly ONE
 * door. An agent's view of the estate depended entirely on which door it knocked on, which is the
 * opposite of interoperability.
 *
 * This guard compares each live door against capabilities/registry.json and fails on drift.
 *   node scripts/capability-drift-guard.mjs --selftest
 *   node scripts/capability-drift-guard.mjs [--base https://councilof.ai] [--warn]
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const BASE = (
  args.includes("--base")
    ? args[args.indexOf("--base") + 1]
    : "https://councilof.ai"
).replace(/\/$/, "");
const WARN_ONLY = args.includes("--warn");

const idOf = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s.]/g, "_")
    .replace(/^api_/, "");

const HTTP_METHODS = new Set([
  "get", "post", "put", "patch", "delete", "options", "head",
]);

const httpKey = (method, endpoint) => {
  const verb = String(method ?? "").trim().toUpperCase();
  let path = String(endpoint ?? "").trim();
  if (!verb || !path) return "";
  if (!path.startsWith("/")) path = "/" + path;
  return verb + " " + path;
};

/** Registry truth: HTTP is method+path+lifecycle; MCP/A2A expose LIVE names only. */
export function expected(registry) {
  const out = { http: new Map(), mcp: new Set(), a2a: new Set() };
  for (const c of registry.capabilities ?? []) {
    for (const protocol of c.protocols ?? []) {
      if (protocol === "http") {
        const key = httpKey(
          c.method ?? c.probe?.method,
          c.endpoint ?? c.probe?.request,
        );
        const path = String(c.endpoint ?? c.probe?.request ?? "");
        // /.well-known documents are real HTTP surfaces, but they are not
        // operations in /openapi.json and are checked by their own producers.
        if (key && path.startsWith("/api/")) {
          out.http.set(key, String(c.lifecycle ?? "LIVE"));
        }
      } else if (c.lifecycle === "LIVE" && out[protocol]) {
        out[protocol].add(idOf(c.id));
      }
    }
  }
  return out;
}

/** What each door ACTUALLY exposes. HTTP identity includes lifecycle. */
export function observed({ openapi, mcp, agentCard }) {
  const http = new Map();
  for (const [path, operations] of Object.entries(openapi?.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = operations?.[method];
      if (op && typeof op === "object") {
        http.set(
          httpKey(method, path),
          String(op["x-csoai-lifecycle"] ?? "LIVE"),
        );
      }
    }
  }
  return {
    http,
    mcp: new Set((mcp?.result?.tools ?? []).map((t) => idOf(t.name))),
    a2a: new Set((agentCard?.skills ?? []).map((s) => idOf(s.id ?? s.name))),
  };
}

export function diff(exp, obs) {
  const httpMissing = [...exp.http.keys()].filter((x) => !obs.http.has(x));
  const httpExtra = [...obs.http.keys()].filter((x) => !exp.http.has(x));
  const lifecycle = [...exp.http.entries()]
    .filter(([key, state]) => obs.http.has(key) && obs.http.get(key) !== state)
    .map(([key, state]) => ({
      key,
      expected: state,
      observed: obs.http.get(key),
    }));
  const report = {
    http: {
      missing: httpMissing,
      extra: httpExtra,
      lifecycle,
      ok: httpMissing.length === 0 && httpExtra.length === 0 && lifecycle.length === 0,
    },
  };
  for (const door of ["mcp", "a2a"]) {
    const missing = [...exp[door]].filter((x) => !obs[door].has(x));
    const extra = [...obs[door]].filter((x) => !exp[door].has(x));
    report[door] = {
      missing,
      extra,
      lifecycle: [],
      ok: missing.length === 0 && extra.length === 0,
    };
  }
  return report;
}

/** Modern MCP requests return JSON; legacy Streamable HTTP may return SSE. */
export function mcpListRequest() {
  const version = "2026-07-28";
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": version,
      "Mcp-Method": "tools/list",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": version,
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    }),
  };
}

async function main() {
  if (args.includes("--selftest")) {
    const reg = {
      capabilities: [
        {
          id: "get_root",
          lifecycle: "LIVE",
          protocols: ["mcp", "a2a"],
        },
        {
          id: "api-gspc-get",
          lifecycle: "LIVE",
          protocols: ["http"],
          method: "GET",
          endpoint: "/api/gspc",
        },
        {
          id: "api-draft-post",
          lifecycle: "QUARANTINED_PRE_RELEASE",
          protocols: ["http"],
          method: "POST",
          endpoint: "/api/draft",
        },
        {
          id: "well-known-example",
          lifecycle: "LIVE",
          protocols: ["http"],
          method: "GET",
          endpoint: "/.well-known/example",
        },
      ],
    };
    const d = diff(
      expected(reg),
      observed({
        openapi: {
          paths: {
            "/api/gspc": { get: {} },
            "/api/draft": { post: {} },
            "/api/ghost": { post: {} },
          },
        },
        mcp: {
          result: { tools: [{ name: "get_root" }, { name: "ghost_tool" }] },
        },
        agentCard: { skills: [] },
      }),
    );
    const caught =
      d.mcp.extra.includes("ghost_tool") &&
      d.a2a.missing.includes("get_root") &&
      d.http.extra.includes("POST /api/ghost") &&
      d.http.lifecycle.some(
        (x) =>
          x.key === "POST /api/draft" &&
          x.expected === "QUARANTINED_PRE_RELEASE" &&
          x.observed === "LIVE",
      ) &&
      !d.http.missing.includes("GET /api/gspc") &&
      !d.http.missing.some((x) => x.includes("/.well-known/"));
    if (!caught) {
      console.error("✖ capability-drift-guard selftest FAILED");
      process.exit(1);
    }
    console.log(
      "✓ capability-drift-guard selftest: method/path/lifecycle drift, MCP extras and A2A omissions are caught",
    );
    process.exit(0);
  }


  const registry = JSON.parse(
    readFileSync("capabilities/registry.json", "utf8"),
  );
  const j = async (u, init) => {
    try {
      const r = await fetch(u, init);
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  };

  const [openapi, agentCard, mcp] = await Promise.all([
    j(`${BASE}/openapi.json`),
    j(`${BASE}/.well-known/agent-card.json`),
    j(`${BASE}/mcp`, mcpListRequest()),
  ]);

  // A door that could not be fetched is UNCHECKABLE, not clean. Never report silence as agreement.
  const unreachable = [
    ["openapi.json", openapi],
    ["agent-card.json", agentCard],
    ["/mcp", mcp],
  ]
    .filter(([, v]) => v === null)
    .map(([n]) => n);
  if (unreachable.length) {
    console.error(
      `✖ capability-drift-guard: UNCHECKABLE — could not fetch ${unreachable.join(", ")} from ${BASE}`,
    );
    process.exit(WARN_ONLY ? 0 : 1);
  }

  const report = diff(
    expected(registry),
    observed({ openapi, mcp, agentCard }),
  );
  let bad = 0;
  for (const [door, r] of Object.entries(report)) {
    if (r.ok) {
      console.log(`✓ ${door}: agrees with the registry`);
      continue;
    }
    bad++;
    console.error(`✖ ${door}: drifted from capabilities/registry.json`);
    if (r.missing.length)
      console.error(
        `    registered but NOT served (${r.missing.length}): ${r.missing.slice(0, 12).join(", ")}`,
      );
    if (r.extra.length)
      console.error(
        `    served but NOT registered (${r.extra.length}): ${r.extra.slice(0, 12).join(", ")}`,
      );
    if (r.lifecycle?.length)
      console.error(
        `    lifecycle mismatch (${r.lifecycle.length}): ${r.lifecycle.slice(0, 8).map((x) => `${x.key} expected=${x.expected} observed=${x.observed}`).join("; ")}`,
      );
  }
  if (bad && !WARN_ONLY) {
    console.error(
      "\n  Update capabilities/registry.json, or the door. The registry is the source of truth.",
    );
    process.exit(1);
  }
  if (bad) console.error("\n  (--warn: drift reported, not enforced)");
}

// Importing the pure comparison/request helpers must never probe production.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
