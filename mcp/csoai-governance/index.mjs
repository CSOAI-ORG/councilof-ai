#!/usr/bin/env node
/**
 * CSOAI Governance MCP
 * ---------------------
 * Exposes the CSOAI Sovereign's governance layer to ANY MCP client — Claude
 * Science, Claude Code, Cursor, or your own agent. Four tools:
 *   csoai_sign     — Ed25519-seal an artifact to CSOAI Layer 0 (auditable + reproducible)
 *   csoai_verify   — request verification through /api/verify against the supplied public key
 *   csoai_govern   — ask the CSOAI Sovereign a governance / cybersecurity question (role-guarded)
 *   csoai_catalog  — search the published governed CSOAI tools / MCPs
 *
 * Gateway is the live Sovereign brain; override with CSOAI_GATEWAY.
 * No API key required for the public governance surface.
 */
import { catalogResult } from "./catalog.mjs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const GW = (process.env.CSOAI_GATEWAY || "https://councilof.ai/api").replace(/\/$/, "");
const UA = "csoai-governance-mcp/0.1";

async function api(path, body) {
  const r = await fetch(GW + path, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "text/plain", "user-agent": UA },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  try { return { ok: r.ok, status: r.status, json: JSON.parse(text) }; }
  catch { return { ok: r.ok, status: r.status, json: null, text }; }
}
const out = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });
const err = (msg) => ({ isError: true, content: [{ type: "text", text: "CSOAI MCP error: " + msg }] });

const TOOLS = [
  {
    name: "csoai_sign",
    description:
      "Seal an AI artifact (a decision, figure, report, dataset hash, or any text) to CSOAI Layer 0 with an Ed25519 signature — making it auditable, tamper-evident and reproducible. Use this on the OUTPUT of a science/code/analysis task so it carries a governance seal. Returns the signature, public key and a human-readable fingerprint (SOV:…).",
    inputSchema: {
      type: "object",
      properties: { artifact: { type: "string", description: "The exact content/text to seal (e.g. a conclusion, a manuscript section, a JSON result, or a SHA-256 of a large file)." } },
      required: ["artifact"],
    },
  },
  {
    name: "csoai_verify",
    description: "Request verification through /api/verify: confirm whether the signature matches the artifact and supplied public key. This client uses a network request; signature validity alone does not establish issuer identity. Use to check provenance of anything previously sealed with csoai_sign.",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "string", description: "The original sealed content (the 'canonical' string)." },
        signature: { type: "string", description: "The hex signature returned by csoai_sign." },
        publicKey: { type: "string", description: "The hex public key returned by csoai_sign." },
      },
      required: ["artifact", "signature", "publicKey"],
    },
  },
  {
    name: "csoai_govern",
    description:
      "Ask the CSOAI Sovereign a governance or cybersecurity question and get a concise, role-locked answer (EU AI Act, NIST AI RMF, ISO 42001, NIS2, DORA, GDPR, risk tiers, controls, deadlines). Use to check whether an AI system/output is compliant, what obligations apply, or how to remediate. Governance/cyber scope only.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string", description: "The governance/compliance/cyber question." } },
      required: ["question"],
    },
  },
  {
    name: "csoai_catalog",
    description: "Search the CSOAI catalog of published governed tools / MCPs (framework-compliance, cyber, evidence, identity, and more). Returns matching probed server-tool rows and their query total; inventory counts are separate.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Optional keyword (e.g. 'eu ai act', 'nist', 'evidence')." } },
    },
  },
];

const BAD = /travell?er|companion|walks beside|i'?m sorry|can'?t help|as an ai language model|on your journey|dear friend|kindred/i;

const server = new Server({ name: "csoai-governance", version: "0.1.1" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a = {} } = req.params;
  try {
    if (name === "csoai_sign") {
      const r = await api("/sign", { message: String(a.artifact || "") });
      if (r.status === 404) return err("Sealing route /api/sign is not in the published councilof.ai API contract (OpenAPI: 12 paths) — sealing is unavailable until deployed. csoai_verify, csoai_govern and csoai_catalog are live at " + GW + ".");
      if (!r.ok || !r.json) return err("signing gateway unreachable (status " + r.status + ")");
      const j = r.json;
      return out({ sealed: true, alg: j.alg || "ed25519", fingerprint: j.fingerprint, signature: j.signature, publicKey: j.publicKey, canonical: j.canonical, verify: GW + "/verify", note: "Auditable, reproducible, tamper-evident — anchored to CSOAI Layer 0." });
    }
    if (name === "csoai_verify") {
      const r = await api("/verify", { message: String(a.artifact || ""), signature: String(a.signature || ""), publicKey: String(a.publicKey || "") });
      if (!r.json) return err("verify gateway unreachable (status " + r.status + ")");
      return out(r.json);
    }
    if (name === "csoai_govern") {
      const sys = "You are the CSOAI Sovereign — the AI-governance and cybersecurity assistant. Answer strictly in that role, concise and concrete (regulations, obligations, controls, deadlines, risk tiers). Never a personal companion, never poetic, never name other vendors, never refuse an ordinary governance question.";
      const r = await api("/chat", { message: sys + "\n\nUser question: " + String(a.question || "") });
      const t = String((r.json && (r.json.response || r.json.answer || r.json.reply)) || "").trim();
      if (!t || (r.json && r.json.model === "idle") || BAD.test(t)) return out("The live Sovereign is unavailable or returned an out-of-role reply. Ask again, or consult csoai.org / the CSOAI Regulator Atlas.");
      return out(t);
    }
    if (name === "csoai_catalog") {
      const r = await api("/tools?q=" + encodeURIComponent(String(a.query || "")));
      return out(catalogResult(r));
    }
    return err("unknown tool: " + name);
  } catch (e) {
    return err(String((e && e.message) || e));
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("CSOAI Governance MCP running (gateway " + GW + ")");
