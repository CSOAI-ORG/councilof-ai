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

const PORT = Number(process.env.PORT || 3001);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const labourFixture = JSON.parse(
  readFileSync(join(root, "datasets/labour-economy-unmeasured/labour-economy-unmeasured.json"), "utf8"),
);
const rwaFixture = JSON.parse(
  readFileSync(join(root, "datasets/rwa-testnet-unmeasured/catalog.json"), "utf8"),
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

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { error: "method_not_allowed" });
  }
  if (url.pathname.startsWith("/api/indices")) return handleIndices(url, res);
  if (url.pathname.startsWith("/api/rwa-attestation")) return handleRwa(url, res);
  if (url.pathname === "/api/health") return json(res, 200, { ok: true, lane: "dev-honesty-api" });
  json(res, 404, { error: "not_found", path: url.pathname });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`dev-honesty-api listening on http://127.0.0.1:${PORT}`);
});
