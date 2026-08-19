// functions/api/catalog.ts — the API catalogue (GROWTH-300 #41 companion).
//
// Serves the OpenAPI contract at /api/catalog so the api-catalog page's link
// resolves. Previously a dead route (404) — the end-user test 2026-08-19 found
// /api/catalog advertised but absent. Now: the machine contract, honest count.
// Inlined spec (no node:fs — worker-compatible; public/openapi.json is the source).
const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Council of AI — GSPC Measurement API",
    version: "1.0.0",
    description: "Independent AI-governance measurement. 13 of 14 GSPC axes measured, every result recomputable (Ed25519). Measurement, not certification.",
  },
  servers: [{ url: "https://councilof.ai" }],
  paths: {
    "/api/gspc": { get: { summary: "The live signed board", operationId: "gspc_axes" } },
    "/api/badge": { get: { summary: "Shields badge endpoint", operationId: "badge" } },
    "/api/health": { get: { summary: "Health probe", operationId: "health" } },
    "/verify": { get: { summary: "Verify a signed card (in-browser)", operationId: "verify" } },
  },
  components: {
    schemas: {
      MeasurementCard: {
        type: "object",
        properties: {
          schema: { type: "string" },
          axis: { type: "string" },
          score: { type: "number" },
          signature: { type: "string", description: "Ed25519 over canonical JSON" },
        },
      },
    },
  },
};

export async function onRequest() {
  return new Response(JSON.stringify(SPEC, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
