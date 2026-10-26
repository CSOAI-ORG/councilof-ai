#!/usr/bin/env node
/**
 * CSOAI Governance MCP
 * ---------------------
 * Exposes the CSOAI Sovereign's governance layer to ANY MCP client — Claude
 * Science, Claude Code, Cursor, or your own agent. Four tools:
 *   csoai_sign     — Ed25519-seal an artifact to CSOAI Layer 0 (auditable + reproducible)
 *   csoai_verify   — verify a seal offline against its public key
 *   csoai_govern   — ask the CSOAI Sovereign a governance / cybersecurity question (role-guarded)
 *   csoai_catalog  — search the published governed CSOAI tools / MCPs
 *
 * Gateway is the live Sovereign brain; override with CSOAI_GATEWAY.
 * No API key required for the public governance surface.
 */
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
const SITE = GW.replace(/\/api$/, "");
const STOP = new Set("the a an of to for in on and or is are what which who how does do my our under with by be it this that apply applies".split(" "));
const words = (x) => String(x || "").toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => w.length > 1 && !STOP.has(w)) || [];
async function govClock(q) {
  try {
    const r = await fetch(SITE + "/regulatory-clock.json", { headers: { "user-agent": UA } });
    if (!r.ok) return { matches: [] };
    const d = await r.json();
    const qw = new Set(words(q));
    const rows = [...(d.events || []), ...(d.already_live || []).map((e) => ({ ...e, status: "already live" }))];
    const scored = rows.map((e) => {
      const hay = words([e.instrument, e.provision, e.binds, e.requires, e.jur].join(" "));
      let s = 0; for (const w of new Set(hay)) if (qw.has(w)) s++;
      return { s, e };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6);
    return { matches: scored.map(({ e }) => ({ date: e.date, jurisdiction: e.jur, instrument: e.instrument, provision: e.provision, binds: e.binds, requires: e.requires, confidence: e.confidence, status: e.status })) };
  } catch { return { matches: [] }; }
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
    description: "Verify a CSOAI Layer-0 Ed25519 seal offline: confirm the signature matches the artifact and public key. Use to check provenance of anything previously sealed with csoai_sign.",
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
    description: "Search the CSOAI catalog of published governed tools / MCPs (framework-compliance, cyber, evidence, identity, and more). Returns matching governed tools with their cluster and install hint.",
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
      const q = String(a.question || "").trim();
      if (!q) return err("question is required");
      // 1) The live grounded answerer, asked the bare question (a prepended persona prompt only
      //    pushed the router into its help text). Use it only when it actually grounded.
      const r = await api("/chat", { message: q });
      const j = r.json || {};
      const t = String(j.answer || j.response || j.reply || "").trim();
      const grounded = t && j.state && j.state !== "ungrounded" && j.model !== "idle" && !BAD.test(t);
      // 2) The published regulatory clock: dated obligations with instrument, provision, who it
      //    binds, what it requires and a confidence grade. Ranked by word overlap with the question.
      const clock = await govClock(q);
      if (!grounded && !clock.matches.length) {
        return out({ answer: "No published CSOAI source matches this question. Not legal advice.", sources: [SITE + "/regulatory-clock.json"], measured_answer: t || null });
      }
      return out({
        answer: grounded ? t : null,
        obligations: clock.matches,
        sources: [grounded ? GW + "/chat" : null, SITE + "/regulatory-clock.json"].filter(Boolean),
        note: "Quoted from CSOAI published data. Confidence A = primary text, B = multiple expert sources, C = single source. Informative only; not legal advice; measures, never certifies.",
      });
    }
    if (name === "csoai_catalog") {
      const r = await api("/tools?q=" + encodeURIComponent(String(a.query || "")));
      if (!r.json) return err("catalog gateway unreachable (status " + r.status + ")");
      const j = r.json;
      const probed = Array.isArray(j.tools) ? j.tools : null;
      const raw = probed || j.matches || j.mcps || j.distinct_tools || j.tools || (Array.isArray(j) ? j : []);
      const matches = raw.slice(0, 25).map((m) => typeof m === "string" ? { name: m } : ({ name: m.name, cluster: m.clusterLabel || m.cluster, tools: m.tools, install: m.connect }));
      return out({ total: j.total ?? j.catalogue_total ?? matches.length, showing: matches.length, matches });
    }
    return err("unknown tool: " + name);
  } catch (e) {
    return err(String((e && e.message) || e));
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("CSOAI Governance MCP running (gateway " + GW + ")");
