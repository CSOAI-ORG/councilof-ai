#!/usr/bin/env node
/**
 * Local honesty API stub for vite dev (port 3001).
 * Mirrors UNMEASURED shapes from functions/api/* — no invented MEASURED scores.
 * Production: Cloudflare Pages functions/*.ts
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MEASURED_TOOLS,
  jsonRpcResult,
  jsonRpcError,
  toolPath,
  isDevLocalTool,
} from "./mcp-rpc-dev.mjs";

const PORT = Number(process.env.PORT || 3001);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const labourFixture = JSON.parse(
  readFileSync(join(root, "datasets/labour-economy-unmeasured/labour-economy-unmeasured.json"), "utf8"),
);
const rwaFixture = JSON.parse(
  readFileSync(join(root, "datasets/rwa-testnet-unmeasured/catalog.json"), "utf8"),
);
const mcpRegistry = JSON.parse(
  readFileSync(join(root, "client/src/data/mcpRegistry.json"), "utf8"),
);

const INDICES = labourFixture.indices.map((row) => ({
  slug: row.slug,
  title:
    row.slug === "ai-economy"
      ? "AI Economy Index"
      : row.slug === "human-labour"
        ? "Human Labour Index"
        : "Humanoid Labour Index",
  status: "UNMEASURED",
  path: `/indices/${row.slug}`,
  candidacy:
    row.slug === "ai-economy"
      ? "slot-23-companion"
      : row.slug === "human-labour"
        ? "financial-extension-candidate"
        : "machinery-adjacency + financial-extension-candidate",
  measured_score: null,
  fused_into_gspc: false,
  firewall: "Contextual layer only — never SHA-256/Ed25519 grading input",
  next_gate: "INDEX-METHOD-0.1 → REPORTED → MEASURED after freeze",
}));

function json(res, status, body) {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=60",
  });
  res.end(text);
}

function handleIndices(url, res) {
  const slug = url.pathname.replace(/^\/api\/indices\/?/, "").replace(/\/$/, "");
  if (slug && slug !== "indices") {
    const row = INDICES.find((i) => i.slug === slug);
    if (!row) {
      return json(res, 404, {
        error: "unknown_index",
        slug,
        known: INDICES.map((i) => i.slug),
      });
    }
    return json(res, 200, {
      schema: "csoai.labour-economy-index/0.1",
      as_of: new Date().toISOString().slice(0, 10),
      register: "UNMEASURED",
      index: row,
      note: "No measured_score. Do not treat absence as zero.",
    });
  }
  return json(res, 200, {
    schema: "csoai.labour-economy-index-catalog/0.1",
    as_of: new Date().toISOString().slice(0, 10),
    register: "UNMEASURED",
    count: INDICES.length,
    indices: INDICES,
    doctrine:
      "Measurement, not certification. Scores never sold. Labour/economy indices are contextual firewall layers — never GSPC cell inputs.",
    surfaces: { hub: "/indices", products: "/products", engine_axis: "/engine-axis" },
  });
}

function hiveFromCategory(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("compliance") || c.includes("regulatory")) return "compliance-gateway";
  if (c.includes("agent")) return "governance-engine";
  if (c.includes("payment") || c.includes("commerce")) return "keystone";
  if (c.includes("vertical")) return "verticals";
  if (c.includes("developer") || c.includes("ops")) return "distribution";
  return "api-gateway";
}

function handleMcp(res) {
  const servers = (mcpRegistry.servers || []).map((s) => ({
    name: s.slug || s.name,
    hive: hiveFromCategory(s.category),
    status: s.meokLabs ? "LIVE" : "UNMEASURED",
    description: s.description,
    category: s.category,
  }));
  return json(res, 200, {
    total: mcpRegistry.total ?? servers.length,
    count: servers.length,
    generated_at: mcpRegistry.generatedAt,
    source: "client/src/data/mcpRegistry.json",
    register: "REPORTED",
    note: "Public registry catalogue for local dev — not live gateway probe. Production: functions/api/mcp.ts.",
    servers,
  });
}

function handleRwa(url, res) {
  const slug = url.pathname.replace(/^\/api\/rwa-attestation\/?/, "").replace(/\/$/, "");
  const targets = rwaFixture.targets;
  if (slug && slug !== "rwa-attestation") {
    const row = targets.find((t) => t.slug === slug);
    if (!row) {
      return json(res, 404, { error: "unknown_target", slug, known: targets.map((t) => t.slug) });
    }
    return json(res, 200, {
      schema: "csoai.rwa-attestation/0.1",
      register: "UNMEASURED",
      target: row,
      note: rwaFixture.note,
    });
  }
  return json(res, 200, {
    schema: rwaFixture.schema,
    label: rwaFixture.label,
    register: rwaFixture.status,
    measured_score: rwaFixture.measured_score,
    count: targets.length,
    targets,
    doctrine: "Attestation ≠ tokenization ≠ ownership. measured_score null until custody + counsel.",
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function handleJsonRpc(body, res) {
  let msg;
  try {
    msg = JSON.parse(body);
  } catch {
    return json(res, 400, jsonRpcError(null, -32700, "Parse error"));
  }
  if (msg.jsonrpc !== "2.0" || !msg.method) {
    return json(res, 400, jsonRpcError(msg.id ?? null, -32600, "Invalid Request"));
  }
  const { id, method, params } = msg;
  switch (method) {
    case "initialize":
      return json(res, 200, jsonRpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "csoai-dev-honesty", version: "0.1.0", description: "Local UNMEASURED fixtures only" },
      }));
    case "notifications/initialized":
      res.writeHead(204, { "access-control-allow-origin": "*" });
      return res.end();
    case "tools/list":
      return json(res, 200, jsonRpcResult(id, { tools: MEASURED_TOOLS }));
    case "tools/call": {
      const name = String(params?.name ?? "");
      const args = params?.arguments ?? {};
      if (!isDevLocalTool(name)) {
        return json(res, 200, jsonRpcResult(id, {
          content: [{
            type: "text",
            text: `Tool ${name} not on dev-honesty-api — use https://councilof.ai/api/mcp or branch Pages functions.`,
          }],
          isError: true,
        }));
      }
      const path = toolPath(name, args);
      const payload = path.startsWith("/api/indices")
        ? captureIndices(path)
        : captureRwa(path);
      if (payload.error) {
        return json(res, 200, jsonRpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(payload.error) }],
          isError: true,
        }));
      }
      return json(res, 200, jsonRpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(payload.body, null, 2) }],
      }));
    }
    default:
      return json(res, 200, jsonRpcError(id, -32601, `Method not found: ${method}`));
  }
}

function captureIndices(path) {
  const url = new URL(path, "http://127.0.0.1");
  const slug = url.pathname.replace(/^\/api\/indices\/?/, "").replace(/\/$/, "");
  if (slug && slug !== "indices") {
    const row = INDICES.find((i) => i.slug === slug);
    if (!row) return { error: { error: "unknown_index", slug, known: INDICES.map((i) => i.slug) } };
    return {
      body: {
        schema: "csoai.labour-economy-index/0.1",
        register: "UNMEASURED",
        index: row,
        note: "No measured_score. Do not treat absence as zero.",
      },
    };
  }
  return {
    body: {
      schema: "csoai.labour-economy-index-catalog/0.1",
      register: "UNMEASURED",
      count: INDICES.length,
      indices: INDICES,
    },
  };
}

function captureRwa(path) {
  const url = new URL(path, "http://127.0.0.1");
  const slug = url.pathname.replace(/^\/api\/rwa-attestation\/?/, "").replace(/\/$/, "");
  const targets = rwaFixture.targets;
  if (slug && slug !== "rwa-attestation") {
    const row = targets.find((t) => t.slug === slug);
    if (!row) return { error: { error: "unknown_target", slug } };
    return { body: { schema: "csoai.rwa-attestation/0.1", register: "UNMEASURED", target: row } };
  }
  return {
    body: {
      schema: rwaFixture.schema,
      register: rwaFixture.status,
      measured_score: rwaFixture.measured_score,
      count: targets.length,
      targets,
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, HEAD, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }
  if (url.pathname === "/api/mcp" && req.method === "POST") {
    const body = await readBody(req);
    return handleJsonRpc(body, res);
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { error: "method_not_allowed" });
  }
  if (url.pathname.startsWith("/api/indices")) return handleIndices(url, res);
  if (url.pathname.startsWith("/api/rwa-attestation")) return handleRwa(url, res);
  if (url.pathname === "/api/mcp") return handleMcp(res);
  if (url.pathname === "/api/health") return json(res, 200, { ok: true, lane: "dev-honesty-api" });
  json(res, 404, { error: "not_found", path: url.pathname });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`dev-honesty-api listening on http://127.0.0.1:${PORT}`);
});
