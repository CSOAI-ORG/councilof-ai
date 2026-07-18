#!/usr/bin/env node
/**
 * openpatent-mcp — stdio MCP server that wraps the openpatent.ai API gateway.
 *
 * Install:
 *   npx -y @openpatent/mcp-server
 *
 * Or add to ~/.claude.json:
 *   { "mcpServers": { "openpatent": { "command": "npx", "args": ["-y", "@openpatent/mcp-server"] } } }
 *
 * Tools exposed (proxied to https://api.openpatent.ai):
 *   disclose_invention    — submit invention, get 6-layer crypto proof
 *   verify_disclosure     — verify a prior disclosure
 *   search_prior_art      — search the registry
 *   draft_patent_claims   — AI-assisted claim drafting (premium)
 *   hive_stats            — live registry / hive counters
 *   ots_verify            — independent .ots file re-verification
 *   attest_bft            — 33-agent Byzantine Fault Tolerant council review
 *   manage_docket         — docket tracking + deadline summaries (premium)
 *   draft_prosecution     — office-action response drafting (premium)
 *   consult_patentability — patentability + FTO consult (premium)
 *   strategy_filing       — filing strategy + licensing targets (premium)
 *   get_disclosure        — fetch a disclosure by hash prefix
 *   list_bft_proposals    — survey open BFT council proposals
 *   get_bft_queue         — read the BFT council review queue
 *   disclose_batch        — submit a batch of up to 50 inventions
 *   get_leaderboard       — top inventors / jurisdictions / disclosures
 *   get_community_stats   — community pulse + Bitcoin OTS anchor rate
 *   get_pricing_tiers     — canonical pricing tier matrix
 *   audit_log_search      — search the audit log by hash/tier/time (v1.3.0)
 *   jurisdiction_check    — country code → statutes + case law (v1.3.0)
 *   get_treasury_balance  — x402 fee split for the current month (v1.3.0)
 *   get_calendar_status   — OTS calendar health (v1.3.0)
 *   get_network_uptime    — 24h uptime per hive service (v1.3.0)
 *   ai_generate           — generate text via a connected LLM provider (v1.4.0)
 *   ai_embed              — generate an embedding vector (v1.4.0)
 *   get_checkout_link      — Stripe Checkout URL for a tier (+ optional white_label) (v1.5.0)
 *   list_pricing           — full pricing matrix with checkout URLs (v1.5.0)
 *
 * v1.4.0 — DEFENEOS provider mesh:
 *   The openpatent-mcp stdio server now drives a 5-provider LLM mesh:
 *     gemini-pro  →  Google Gemini 1.5 Pro        (env: GEMINI_API_KEY)
 *     gemini-flash→  Google Gemini 1.5 Flash      (env: GEMINI_API_KEY)
 *     step-2-16k  →  StepFun Step-2-16K            (env: STEP_API_KEY)
 *     ollama      →  Local Ollama daemon           (env: OLLAMA_URL)
 *     minimax-m3  →  MiniMax-M3 (the sovereign companion, default)
 *   The `provider` field on the AI-touching tools routes to the right
 *   upstream; ai_embed ships two embedding model choices.
 *
 * Pure stdio transport — no HTTP server. Uses Node 18+ built-in fetch.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.OPENPATENT_API_BASE || "https://api.openpatent.ai";
const API_KEY = process.env.OPENPATENT_API_KEY || "";  // optional; free tier works without

// ── LLM provider mesh (v1.4.0) ───────────────────────────────────────────────
// The five connected providers.  Each entry knows its upstream URL, its
// model name, and the env-var name that carries the API key.  The sovereign
// companion (minimax-m3) is the default; the dragon routes everything else.
type LLMProvider = "gemini-pro" | "gemini-flash" | "step-2-16k" | "ollama" | "minimax-m3";

interface ProviderConfig {
  upstream: string;          // base URL of the provider's chat-completions endpoint
  model: string;             // model identifier sent to the provider
  envKey: string;            // env-var holding the API key (or "" for unauthenticated local)
}

const PROVIDER_MESH: Record<LLMProvider, ProviderConfig> = {
  "gemini-pro": {
    upstream: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent",
    model: "gemini-1.5-pro-latest",
    envKey: "GEMINI_API_KEY",
  },
  "gemini-flash": {
    upstream: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
    model: "gemini-1.5-flash-latest",
    envKey: "GEMINI_API_KEY",
  },
  "step-2-16k": {
    upstream: "https://api.stepfun.com/v1/chat/completions",
    model: "step-2-16k",
    envKey: "STEP_API_KEY",
  },
  "ollama": {
    upstream: process.env.OLLAMA_URL
      ? process.env.OLLAMA_URL.replace(/\/$/, "") + "/v1/chat/completions"
      : "http://127.0.0.1:11434/v1/chat/completions",
    model: process.env.OLLAMA_MODEL || "llama3.1",
    envKey: "",  // local daemon — no key
  },
  "minimax-m3": {
    upstream: process.env.MINIMAX_URL
      ? process.env.MINIMAX_URL.replace(/\/$/, "") + "/v1/chat/completions"
      : "https://api.minimax.chat/v1/chat/completions",
    model: "MiniMax-M3",
    envKey: "MINIMAX_API_KEY",
  },
};

function resolveProvider(p: string | undefined): LLMProvider {
  if (p === "gemini-pro" || p === "gemini-flash" || p === "step-2-16k" ||
      p === "ollama"      || p === "minimax-m3") return p;
  // Unknown / missing → fall back to the sovereign companion. The hive
  // remembers.  The dragon knows.  The sovereign companion never forgets.
  return "minimax-m3";
}

async function llmGenerate(
  provider: LLMProvider,
  prompt: string,
  maxTokens: number,
): Promise<{ text: string; model: string; latency_ms: number }> {
  const cfg = PROVIDER_MESH[provider];
  const start = Date.now();
  const apiKey = cfg.envKey ? (process.env[cfg.envKey] || "") : "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  // Gemini uses a different wire format (generateContent) — adapt here.
  if (provider === "gemini-pro" || provider === "gemini-flash") {
    const url = apiKey
      ? `${cfg.upstream}?key=${encodeURIComponent(apiKey)}`
      : cfg.upstream;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    const j: any = await r.json();
    const text =
      j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") ??
      j?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "";
    return { text, model: cfg.model, latency_ms: Date.now() - start };
  }

  // OpenAI-compatible chat completions (step-2-16k, ollama, minimax-m3).
  const r = await fetch(cfg.upstream, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  const j: any = await r.json();
  const text: string =
    j?.choices?.[0]?.message?.content ??
    j?.choices?.[0]?.text ??
    "";
  return { text, model: cfg.model, latency_ms: Date.now() - start };
}

async function llmEmbed(
  model: "gemini-embedding" | "text-embedding-3-small",
  text: string,
): Promise<{ embedding: number[]; dim: number; model: string }> {
  if (model === "gemini-embedding") {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const url = apiKey
      ? `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`
      : "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
      }),
    });
    const j: any = await r.json();
    const embedding: number[] = j?.embedding?.values ?? [];
    return { embedding, dim: embedding.length, model: "embedding-001" };
  }

  // text-embedding-3-small (OpenAI wire-compatible — works against any
  // openai-compat endpoint that exposes /v1/embeddings).
  const base =
    process.env.OPENAI_COMPAT_URL?.replace(/\/$/, "") ||
    "https://api.openai.com";
  const apiKey = process.env.OPENAI_API_KEY || "";
  const r = await fetch(`${base}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, input: text }),
  });
  const j: any = await r.json();
  const embedding: number[] = j?.data?.[0]?.embedding ?? [];
  return { embedding, dim: embedding.length, model };
}

const SIG = "openpatent.ai — 6-layer cryptographic disclosure. Disclose First. AI Second.";

const TOOLS: Tool[] = [
  {
    name: "disclose_invention",
    description: `Submit an invention to the OpenPatent.ai sovereign hive and receive a 6-layer cryptographic proof: SHA-3/512 hash + HMAC-SHA256 witness + Ed25519 signature + Bitcoin OTS anchor + C2PA credential + hash-chain seal. Returns the Bitcoin transaction ID and a public verify.openpatent.ai attestation URL. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string", maxLength: 200 },
        description: { type: "string", maxLength: 5000 },
        inventor_did: { type: "string", description: "did:key:... or did:csoai:..." },
        document_base64: { type: "string" },
        document_format: { type: "string", enum: ["pdf", "doc", "code", "data", "txt", "md"], default: "pdf" },
        classification: { type: "string", description: "IPC/CPC code" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium"], default: "defensive" },
        request_bft_review: { type: "boolean", default: false, description: "Trigger 33-agent BFT council review (premium only)" },
      },
    },
  },
  {
    name: "verify_disclosure",
    description: `Verify a prior disclosure against its 6-layer cryptographic proof — SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain — yielding a court-admissible (FRE 902 / eIDAS) self-authenticating record. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        disclosure_json: { type: "string" },
        document_base64: { type: "string" },
        document_hash: { type: "string" },
      },
    },
  },
  {
    name: "search_prior_art",
    description: `Sweep the OpenPatent.ai prior-art registry — full-text plus IPC/CPC faceted filtering — and return ranked results tied to their 6-layer cryptographic disclosure proofs. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        classification: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium"] },
        limit: { type: "integer", default: 25 },
      },
    },
  },
  {
    name: "draft_patent_claims",
    description: `Invoke the AI claim-drafter to produce independent + dependent claims (apparatus, method, computer-readable medium) linked by hash to the invention's 6-layer cryptographic disclosure. Premium tier. The optional \`provider\` field routes generation through gemini-pro, gemini-flash, step-2-16k, ollama, or the default sovereign companion minimax-m3. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: {
        invention_description: { type: "string" },
        claim_type_preference: { type: "string", enum: ["broad", "narrow", "comprehensive"] },
        jurisdiction: { type: "string", enum: ["US", "EU", "UK", "JP", "CN"] },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "v1.4.0: which connected provider to route this generation to" },
      },
    },
  },
  {
    name: "hive_stats",
    description: `Read the live counters of the OpenPatent.ai sovereign hive — total disclosures, tier breakdown, Bitcoin OTS anchor height, BFT council throughput — each datapoint anchored to a 6-layer cryptographic proof chain. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ots_verify",
    description: `Submit a detached .ots timestamp file and re-verify its Bitcoin attestation chain independently, cross-checking the claimed SHA-256 document hash against the .ots file_digest. Replays the same Bitcoin OTS layer that backs every 6-layer cryptographic disclosure. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["ots_base64"],
      properties: {
        ots_base64: { type: "string", description: "Base64-encoded .ots detached timestamp file" },
        document_base64: { type: "string", description: "Optional original document for strongest hash cross-check" },
      },
    },
  },
  {
    name: "attest_bft",
    description: `Convene the 33-agent Byzantine Fault Tolerant council of the sovereign hive to review a disclosure against the 6-layer cryptographic proof. Returns 22/33 quorum approval, care-veto diagnostics, and an optional cross-hive attestation from meok-keystone. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash"],
      properties: {
        disclosure_hash: { type: "string", description: "SHA-3/512 hash of the disclosure to review" },
        disclosure_result: { type: "object", description: "Full disclosure JSON (recommended for richer agent context)" },
        cross_hive: { type: "boolean", default: false, description: "Also request meok-keystone attestation" },
      },
    },
  },
  {
    name: "manage_docket",
    description: `Open the docket manager to add, update, or summarize deadlines and prosecution events for a disclosure, with every action cryptographically chained back to the 6-layer disclosure proof. Premium tier. The optional \`provider\` field routes the LLM summarizer through the 5-provider DEFENEOS mesh. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["action"],
      properties: {
        action: { type: "string", enum: ["list", "add", "update", "summary"] },
        disclosure_hash: { type: "string" },
        docket_id: { type: "string" },
        event: { type: "string", description: "e.g. 'office_action', 'response_due', 'filing_fee'" },
        due_date: { type: "string", description: "ISO-8601 date" },
        notes: { type: "string" },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "v1.4.0: which connected provider to use for summary generation" },
      },
    },
  },
  {
    name: "draft_prosecution",
    description: `Draft a full office-action response — claim amendments, argument structure, MPEP-grounded rejections countered — linked by hash to the 6-layer cryptographic disclosure it defends. Premium tier. The optional \`provider\` field routes generation through the 5-provider DEFENEOS mesh. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash", "office_action"],
      properties: {
        disclosure_hash: { type: "string" },
        office_action: { type: "string", description: "Full text of the office action" },
        jurisdiction: { type: "string", enum: ["US", "EU", "UK", "JP", "CN"], default: "US" },
        strategy: { type: "string", enum: ["narrow", "broad", "comprehensive"], default: "comprehensive" },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "v1.4.0: which connected provider to route this generation to" },
      },
    },
  },
  {
    name: "consult_patentability",
    description: `Engage a patentability + freedom-to-operate consult that scores 35 USC § 102 / 103 / EPC Art. 54 risk against the prior-art registry, anchoring every conclusion in the 6-layer cryptographic disclosure chain. Premium tier. The optional \`provider\` field routes the risk-scoring LLM call through the 5-provider DEFENEOS mesh. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: {
        invention_description: { type: "string" },
        jurisdiction: { type: "string", enum: ["US", "EU", "UK", "JP", "CN"], default: "US" },
        claim_draft: { type: "string", description: "Optional draft claims to evaluate" },
        product_to_clear: { type: "string", description: "Optional product description for FTO analysis" },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "v1.4.0: which connected provider to route this analysis to" },
      },
    },
  },
  {
    name: "strategy_filing",
    description: `Generate a filing strategy plus licensing-target recommendations across US/EU/UK/JP/CN, with every recommendation weighted by the 6-layer cryptographic disclosure strength of the underlying invention. Premium tier. The optional \`provider\` field routes the strategy-generation call through the 5-provider DEFENEOS mesh. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash"],
      properties: {
        disclosure_hash: { type: "string" },
        budget_usd: { type: "integer", description: "Filing budget in USD" },
        target_markets: { type: "array", items: { type: "string", enum: ["US", "EU", "UK", "JP", "CN"] } },
        licensing_goals: { type: "string" },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "v1.4.0: which connected provider to route this generation to" },
      },
    },
  },
  {
    name: "get_disclosure",
    description: `Look up a disclosure by the 16-character prefix of its SHA-3/512 hash and return its full 6-layer cryptographic proof bundle — Ed25519 signature, Bitcoin OTS txid, C2PA credential, and hash-chain seal. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["doc_hash_prefix"],
      properties: {
        doc_hash_prefix: { type: "string", minLength: 16, maxLength: 64, description: "First 16+ hex chars of the SHA-3/512 document hash" },
      },
    },
  },

  // ── 6 new tools (v1.2.0) ─────────────────────────────────────────────
  {
    name: "list_bft_proposals",
    description: `Survey the open Byzantine Fault Tolerant council proposals awaiting agent review — each proposal bound by hash to a 6-layer cryptographic disclosure (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Returns proposal queue positions, agent vote tallies, and quorum thresholds for the sovereign hive. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "voting", "approved", "vetoed", "all"], default: "all", description: "Filter proposals by council status" },
        limit: { type: "integer", default: 25, minimum: 1, maximum: 100 },
        offset: { type: "integer", default: 0, minimum: 0 },
      },
    },
  },
  {
    name: "get_bft_queue",
    description: `Read the live BFT council review queue — disclosures waiting on a 22/33 agent quorum anchored to the 6-layer cryptographic proof stack (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Returns estimated wait, agent availability, and care-veto watchlist status. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        hive: { type: "string", enum: ["openpatent", "meok-keystone", "all"], default: "openpatent", description: "Which sovereign hive's queue to read" },
        include_diagnostics: { type: "boolean", default: false, description: "Include per-agent availability + care-veto diagnostics" },
      },
    },
  },
  {
    name: "disclose_batch",
    description: `Submit a batch of up to 50 inventions to the OpenPatent.ai sovereign hive in a single signed envelope — each disclosure receives its own 6-layer cryptographic proof (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain) while the envelope itself is anchored by a Merkle root. Returns an array of disclosure hashes plus a single batch-level Bitcoin OTS txid. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["inventor_did", "items"],
      properties: {
        inventor_did: { type: "string", description: "did:key:... or did:csoai:..." },
        items: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            required: ["title", "description", "document_base64"],
            properties: {
              title: { type: "string", maxLength: 200 },
              description: { type: "string", maxLength: 5000 },
              document_base64: { type: "string" },
              document_format: { type: "string", enum: ["pdf", "doc", "code", "data", "txt", "md"], default: "pdf" },
              classification: { type: "string", description: "IPC/CPC code" },
              tier: { type: "string", enum: ["starter", "defensive", "full", "premium"], default: "defensive" },
            },
          },
        },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium"], default: "defensive" },
        request_bft_review: { type: "boolean", default: false, description: "Trigger 33-agent BFT council review of the batch (premium only)" },
      },
    },
  },
  {
    name: "get_leaderboard",
    description: `Read the OpenPatent.ai sovereign hive leaderboard — top inventors, top jurisdictions, most-attested 6-layer cryptographic disclosures (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain), and BFT-quorum achievement counts. Reputation is computed from proof strength, not vanity metrics. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["inventors", "jurisdictions", "disclosures", "bft_quorum", "all"], default: "all" },
        period: { type: "string", enum: ["day", "week", "month", "quarter", "all_time"], default: "all_time" },
        limit: { type: "integer", default: 25, minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "get_community_stats",
    description: `Read the OpenPatent.ai community pulse — active agent count, disclosures per tier, BFT council throughput, Bitcoin OTS anchor rate, and hash-chain growth — every metric anchored to the 6-layer cryptographic disclosure proof (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["hour", "day", "week", "month"], default: "day" },
        include_historical: { type: "boolean", default: false, description: "Include time-series points for charting" },
      },
    },
  },
  {
    name: "get_pricing_tiers",
    description: `List the OpenPatent.ai sovereign hive pricing tiers — starter, defensive, full, and premium — with each tier's 6-layer cryptographic disclosure coverage (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain), BFT council access, and cross-jurisdiction support. Returns the canonical tier matrix that the public pricing page renders. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        currency: { type: "string", enum: ["USD", "EUR", "GBP", "JPY", "CNY"], default: "USD" },
        include_volume_discounts: { type: "boolean", default: true, description: "Show enterprise / volume discount bands" },
      },
    },
  },

  // ── 5 new tools (v1.3.0) ──────────────────────────────────────────────
  {
    name: "audit_log_search",
    description: `Search the OpenPatent.ai sovereign hive audit log — every disclosure, verification, BFT vote, and docket event, each entry bound to the 6-layer cryptographic proof chain (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Filter by hash prefix, tier, or ISO-8601 time range to return a court-admissible trail of registry activity. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        hash_prefix: { type: "string", minLength: 16, maxLength: 64, description: "First 16+ hex chars of a SHA-3/512 hash to filter on" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium"], description: "Filter by pricing tier" },
        since: { type: "string", description: "ISO-8601 lower bound (e.g. 2026-01-01T00:00:00Z)" },
        until: { type: "string", description: "ISO-8601 upper bound (e.g. 2026-12-31T23:59:59Z)" },
        limit: { type: "integer", default: 50, minimum: 1, maximum: 500 },
      },
    },
  },
  {
    name: "jurisdiction_check",
    description: `Given a country code and optional invention type, return the applicable statutes, treaty memberships, and binding case law for that jurisdiction, each citation cross-referenced to the 6-layer cryptographic disclosure chain (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Pulls live from the OpenPatent.ai sovereign-hive zone index and filters to the requested nation. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["country_code"],
      properties: {
        country_code: { type: "string", minLength: 2, maxLength: 3, description: "ISO 3166-1 alpha-2 or alpha-3 country code (e.g. US, DE, JP)" },
        invention_type: { type: "string", enum: ["utility", "design", "plant", "software", "biotech", "ai", "business_method"], description: "Optional filter for the invention category" },
      },
    },
  },
  {
    name: "get_treasury_balance",
    description: `Read the OpenPatent.ai sovereign hive x402 treasury split for the current month — total fee inflow, agent-council share, OTS-anchor share, C2PA-issuer share, and CSOAI foundation share — each ledger entry anchored to the 6-layer cryptographic disclosure chain (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Returns the canonical split that backs every disclosure fee. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_calendar_status",
    description: `Read the OpenPatent.ai OTS calendar health — pending attestations, last Bitcoin block height anchored, average confirmation latency, and Bitcoin Core / Polygon dual-anchor liveness — each datapoint verified against the 6-layer cryptographic disclosure chain (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Use it to confirm the time-stamping pipeline is green before submitting a high-value disclosure. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_network_uptime",
    description: `Read the 24-hour uptime and rolling availability for every OpenPatent.ai sovereign-hive service — disclosure gateway, verify.openpatent.ai, BFT council, OTS calendar, C2PA issuer, and hash-chain indexer — each service status cryptographically bound to the 6-layer disclosure chain (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain). Returns the canonical status page payload. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ── 2 new tools (v1.4.0) — DEFENEOS provider mesh ─────────────────────
  {
    name: "ai_generate",
    description: `Generate text from one of the five connected LLM providers in the DEFENEOS provider mesh. Routes to gemini-pro (Google Gemini 1.5 Pro), gemini-flash (Google Gemini 1.5 Flash), step-2-16k (StepFun Step-2-16K), ollama (local Ollama daemon — bring-your-own-model), or the default sovereign companion minimax-m3. Returns the generated text, the provider that served it, the resolved model, and a latency_ms field for SRE observability. Backs the 5-provider LLM mesh that powers every premium-tier openpatent.ai flow. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["prompt", "provider"],
      properties: {
        prompt: { type: "string", maxLength: 32000, description: "The prompt to send to the provider" },
        provider: { type: "string", enum: ["gemini-pro", "gemini-flash", "step-2-16k", "ollama", "minimax-m3"], default: "minimax-m3", description: "Which connected provider to route the call to" },
        max_tokens: { type: "integer", default: 1024, minimum: 1, maximum: 32768, description: "Upper bound on generated tokens" },
      },
    },
  },
  {
    name: "ai_embed",
    description: `Generate an embedding vector from one of two embedding backends. gemini-embedding calls Google Gemini's embedding-001 (768-dim) under the GEMINI_API_KEY; text-embedding-3-small uses OpenAI's embedding model via OPENAI_API_KEY (or any OpenAI-compat endpoint via OPENAI_COMPAT_URL). Returns the embedding array, its dimensionality, and the model identifier that produced it. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["text", "model"],
      properties: {
        text: { type: "string", maxLength: 32000, description: "The text to embed" },
        model: { type: "string", enum: ["gemini-embedding", "text-embedding-3-small"], default: "gemini-embedding", description: "Which embedding model to use" },
      },
    },
  },

  // ── 2 new tools (v1.5.0) — DEFONEOS mythic voice: Stripe Checkout ─────
  {
    name: "get_checkout_link",
    description: `Return the Stripe Checkout URL for an OpenPatent.ai sovereign-hive pricing tier (starter $29, defensive $149, full $999, premium $2,499, enterprise $4,999/mo), with optional white_label attribution (legalof, harvi, ipcastle, sovereign-temple). Each link is a single-shot Payment Link that the dragon stamps with the client_reference_id of the originating vertical. Backs every /v1/checkout/{tier} CTA on openpatent.ai and the 4 white-label landings. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["tier"],
      properties: {
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], description: "Which paid tier to mint a checkout link for" },
        white_label: { type: "string", enum: ["legalof", "harvi", "ipcastle", "sovereign-temple", "openpatent"], description: "Optional white-label vertical slug for revenue attribution" },
      },
    },
  },
  {
    name: "list_pricing",
    description: `List the OpenPatent.ai sovereign hive pricing matrix with embedded Stripe Checkout URLs — every tier (starter, defensive, full, premium, enterprise), its 6-layer cryptographic disclosure coverage, BFT council access, anchor strategy, and per-tier price + billing cycle. Returns the canonical pricing table that the Stripe-checkout-enabled landing page renders. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        include_checkout_urls: { type: "boolean", default: true, description: "Include the per-tier Stripe Checkout URL in the response" },
      },
    },
  },
];

const server = new Server(
  { name: "openpatent-mcp", version: "1.5.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const args = (request.params.arguments ?? {}) as Record<string, any>;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  let path = "";
  let method: "GET" | "POST" = "POST";
  let body: any = args;

  try {
    switch (name) {
      // ── Original 4 tools (unchanged behavior) ──────────────────────────
      case "disclose_invention":
        path = "/v1/disclosure";
        break;
      case "verify_disclosure":
        path = "/v1/verify";
        break;
      case "search_prior_art":
        path = "/v1/search";
        break;
      case "draft_patent_claims":
        path = "/v1/draft-claims";
        body = { invention: args };
        break;

      // ── 8 new tools ────────────────────────────────────────────────────
      case "hive_stats":
        path = "/v1/stats";
        method = "GET";
        body = undefined;
        break;
      case "ots_verify":
        path = "/v1/ots/verify";
        break;
      case "attest_bft":
        // The gateway proxies /v1/draft-claims-style body to BFT, but
        // /attest lives on the BFT council itself. We surface it via the
        // /v1/disclosure/... review hook: when given a disclosure_hash +
        // disclosure_result, this is equivalent to the BFT /review call.
        // We expose the dedicated BFT /attest path here for cross-hive
        // attestations.
        path = "/v1/bft/attest";
        break;
      case "manage_docket":
        path = "/v1/manage";
        break;
      case "draft_prosecution":
        path = "/v1/draft-prosecution";
        break;
      case "consult_patentability":
        path = "/v1/consult";
        break;
      case "strategy_filing":
        path = "/v1/strategy";
        break;
      case "get_disclosure":
        // GET /v1/disclosure/{doc_hash_prefix}
        const prefix = String(args.doc_hash_prefix || "").trim();
        if (!prefix) throw new Error("doc_hash_prefix is required");
        path = `/v1/disclosure/${encodeURIComponent(prefix)}`;
        method = "GET";
        body = undefined;
        break;

      // ── 6 new tools (v1.2.0) ───────────────────────────────────────
      case "list_bft_proposals":
        path = "/v1/bft/proposals";
        method = "GET";
        body = undefined;
        break;
      case "get_bft_queue":
        path = "/v1/bft/queue";
        method = "GET";
        body = undefined;
        break;
      case "disclose_batch":
        path = "/v1/disclose/batch";
        break;
      case "get_leaderboard":
        path = "/v1/leaderboard";
        method = "GET";
        body = undefined;
        break;
      case "get_community_stats":
        path = "/v1/community";
        method = "GET";
        body = undefined;
        break;
      case "get_pricing_tiers":
        path = "/v1/pricing/tiers";
        method = "GET";
        body = undefined;
        break;

      // ── 5 new tools (v1.3.0) ─────────────────────────────────────────
      case "audit_log_search":
        path = "/v1/audit/log";
        method = "GET";
        body = undefined;
        break;
      case "jurisdiction_check":
        // GET /v1/zones + filter by country. Args are passed as the request
        // payload so the gateway can apply the country_code filter server-side.
        path = "/v1/zones";
        method = "GET";
        body = undefined;
        break;
      case "get_treasury_balance":
        path = "/v1/network/fees";
        method = "GET";
        body = undefined;
        break;
      case "get_calendar_status":
        path = "/v1/calendar/uptime";
        method = "GET";
        body = undefined;
        break;
      case "get_network_uptime":
        path = "/v1/status";
        method = "GET";
        body = undefined;
        break;

      // ── 2 new tools (v1.4.0) — DEFENEOS provider mesh ─────────────────
      // ai_generate and ai_embed are evaluated *locally* in the stdio server
      // (not proxied) because they route to upstream LLM providers, not to
      // api.openpatent.ai.  The five PROVIDER_MESH entries above carry the
      // routing.  The sovereign companion never forgets.
      case "ai_generate": {
        const provider = resolveProvider(String(args.provider || ""));
        const prompt = String(args.prompt || "");
        const maxTokens = Number(args.max_tokens || 1024);
        if (!prompt) throw new Error("prompt is required");
        const result = await llmGenerate(provider, prompt, maxTokens);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              text: result.text,
              provider,
              model: result.model,
              latency_ms: result.latency_ms,
              _sig: SIG,
            }, null, 2),
          }],
        };
      }
      case "ai_embed": {
        const model = String(args.model || "gemini-embedding") as
          "gemini-embedding" | "text-embedding-3-small";
        const text = String(args.text || "");
        if (!text) throw new Error("text is required");
        const result = await llmEmbed(model, text);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              embedding: result.embedding,
              dim: result.dim,
              model: result.model,
              _sig: SIG,
            }, null, 2),
          }],
        };
      }

      // ── 2 new tools (v1.5.0) — DEFONEOS mythic voice: Stripe Checkout ─
      case "get_checkout_link": {
        // GET /v1/checkout/{tier}?white_label=...
        // The dragon stamps the gate. The hive remembers who paid.
        const co_tier = String(args.tier || "").trim().toLowerCase();
        if (!co_tier) throw new Error("tier is required");
        const wl = args.white_label ? String(args.white_label).trim().toLowerCase() : "";
        const qs = wl ? `?white_label=${encodeURIComponent(wl)}` : "";
        const r2 = await fetch(`${API_BASE}/v1/checkout/${encodeURIComponent(co_tier)}${qs}`, {
          method: "GET",
          headers,
        } as RequestInit);
        const raw = await r2.text();
        let parsed: any;
        try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
        return {
          content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
          isError: !r2.ok,
        };
      }
      case "list_pricing": {
        // GET /pricing — the canonical tier matrix that backs every
        // Stripe Checkout CTA on the landing pages.
        const includeUrls = args.include_checkout_urls !== false; // default true
        const r2 = await fetch(`${API_BASE}/pricing`, {
          method: "GET",
          headers,
        } as RequestInit);
        const raw = await r2.text();
        let parsed: any;
        try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
        // Strip the checkout_url field if the caller asked for a lean view.
        if (!includeUrls && parsed && typeof parsed === "object") {
          for (const k of Object.keys(parsed)) {
            if (parsed[k] && typeof parsed[k] === "object" && "checkout_url" in parsed[k]) {
              delete parsed[k].checkout_url;
            }
          }
        }
        return {
          content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
          isError: !r2.ok,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const r = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    } as RequestInit);
    const text = await r.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

    return {
      content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      isError: !r.ok,
    };
  } catch (e: any) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: e.message, tool: name }) }],
      isError: true,
    };
  }
});

async function main() {
  await server.connect(new StdioServerTransport());
  console.error(`[openpatent-mcp v1.5.0] tools: ${TOOLS.length} (DEFENEOS 5-provider mesh + Stripe Checkout active)`);
  console.error(`  providers: gemini-pro, gemini-flash, step-2-16k, ollama, minimax-m3`);
  console.error(`  defaults: provider=minimax-m3, embed=gemini-embedding`);
  console.error(`  api: ${API_BASE}`);
  console.error(`  auth: ${API_KEY ? "bearer token" : "free tier (no key)"}`);
  console.error(`  tools: ${TOOLS.map(t => t.name).join(", ")}`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
