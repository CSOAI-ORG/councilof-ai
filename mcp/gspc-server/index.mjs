#!/usr/bin/env node
/**
 * csoai-gspc-mcp — stdio MCP server for the live GSPC board and the signed cards.
 *
 * Zero dependencies. Node >= 20 (WebCrypto Ed25519 and global fetch).
 * Transport: MCP stdio — newline-delimited JSON-RPC 2.0 on stdin/stdout.
 * Logs go to stderr only; stdout carries nothing but protocol messages.
 *
 * DOCTRINE (carried into every tool, not just this comment):
 *   - We measure, never certify. No tool here issues a certification.
 *   - Three-state verdicts: VALID / INVALID (with the reason) / UNCHECKABLE.
 *     "I could not check" is a different claim from "this is forged".
 *   - Unmeasured is first-class. A declared slot with no run behind it is an
 *     honest answer, never an error, never a zero, never rounded up.
 *   - Live means live. A fetch failure returns a distinct UNREACHABLE state;
 *     no cached number is ever presented as a live one.
 *   - Two surfaces that count the same thing are reported as two labelled
 *     numbers. This server never reconciles them.
 *
 * ONE SOURCE OF TRUTH:
 *   - Tool definitions come from gspc-tools.json — the same file the HTTP
 *     endpoint at councilof.ai/mcp imports (functions/mcp/gspc-tools.json).
 *     In a repo checkout that file is read directly; the npm package ships a
 *     byte-identical copy made at pack time (npm run prepack).
 *   - verify_card runs the code in public/signed/verify-card.mjs — the same
 *     module the published CLI verifier is. Same rule: repo file first, packed
 *     copy as fallback.
 */

import { createInterface } from "node:readline";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.1";
const ORIGIN = process.env.GSPC_ORIGIN || "https://councilof.ai";
const FETCH_TIMEOUT_MS = 15000;

/** Card URLs may be fetched only from the estate's own published origins. */
const FETCHABLE_ORIGINS = ["https://councilof.ai/", "https://csoai.org/", "https://www.csoai.org/"];

/* ------------------------------------------------- one-source module loading */

function firstExisting(paths) {
  for (const p of paths) {
    const abs = fileURLToPath(new URL(p, import.meta.url));
    if (existsSync(abs)) return abs;
  }
  return null;
}

const TOOLS_PATH = firstExisting([
  "../../functions/mcp/gspc-tools.json", // repo checkout: the canonical file
  "./gspc-tools.json", // npm package: the byte-identical pack-time copy
]);
if (!TOOLS_PATH) {
  process.stderr.write("csoai-gspc-mcp: gspc-tools.json not found — broken install\n");
  process.exit(1);
}
const TOOLS = JSON.parse(readFileSync(TOOLS_PATH, "utf8")).tools;

const VERIFIER_PATH = firstExisting([
  "../../public/signed/verify-card.mjs", // repo checkout: the canonical file
  "./verify-card.mjs", // npm package: the byte-identical pack-time copy
]);
if (!VERIFIER_PATH) {
  process.stderr.write("csoai-gspc-mcp: verify-card.mjs not found — broken install\n");
  process.exit(1);
}
const { verifyCard } = await import(`file://${VERIFIER_PATH}`);

/* ------------------------------------------------------------------ fetching */

async function fetchJson(path) {
  const url = `${ORIGIN}${path}`;
  const r = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!r.ok) {
    const err = new Error(`GET ${url} returned HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/**
 * The distinct unreachable state. Never a cached number, never a zero that
 * could be mistaken for a measurement.
 */
function unreachable(path, e) {
  return {
    state: "UNREACHABLE",
    reachable: false,
    source: `${ORIGIN}${path}`,
    error: e instanceof Error ? e.message : String(e),
    attempted_at: new Date().toISOString(),
    note:
      "The live source could not be fetched. No cached or remembered number is " +
      "substituted — an unreachable board is a different claim from any count.",
  };
}

/* --------------------------------------------------------------------- tools */

async function boardTotals() {
  let d;
  try {
    d = await fetchJson("/api/gspc");
  } catch (e) {
    return unreachable("/api/gspc", e);
  }
  const t = d.totals ?? {};
  return {
    state: "LIVE",
    reachable: true,
    kind: "live-board-totals",
    source: `${ORIGIN}/api/gspc`,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    counts: [
      {
        name: "axis_slots",
        value: t.axes ?? null,
        kind: "declared slot count — a slot is a position on the board, not evidence anything was measured",
      },
      {
        name: "measured",
        value: t.measured_axes ?? null,
        kind: "measurement count — slots with a real run behind them",
      },
      {
        name: "unmeasured",
        value: t.unmeasured_axes ?? null,
        kind: "declared slots with no run behind them — published so the gap is visible; first-class, not an error",
      },
    ],
    count_grammar: t.count_grammar ?? null,
    public_count: t.public_count ?? null,
    by_family: t.by_family ?? null,
    not_a_certification: true,
  };
}

async function getAxis(args) {
  const wanted = String(args.axis ?? "").trim().toLowerCase();
  if (!wanted) return { state: "BAD_INPUT", error: "pass an axis name, e.g. governance" };
  let d;
  try {
    d = await fetchJson("/api/gspc");
  } catch (e) {
    return unreachable("/api/gspc", e);
  }
  const rows = d.axes ?? [];
  const row = rows.find((r) => String(r.axis ?? "").toLowerCase() === wanted);
  if (!row) {
    return {
      state: "NOT_ON_BOARD",
      axis: wanted,
      note: "This name is not a row on the live board. That is a fact about the board, not a verdict about the subject.",
      board_carries: rows.map((r) => r.axis),
      as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    };
  }
  const measured = String(row.status ?? "").toUpperCase() === "MEASURED";
  return {
    state: "LIVE",
    axis: row.axis,
    family: row.family ?? null,
    status: row.status ?? null,
    measured,
    measured_note: measured
      ? "a real run stands behind this row"
      : "a declared slot with no run behind it — published so the gap is visible; first-class, not an error and not a zero",
    n: row.n ?? null,
    accuracy: row.accuracy ?? null,
    interval: row.interval ?? null,
    leader: row.leader ?? null,
    dataset: row.dataset ?? null,
    note: row.note ?? null,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    source: `${ORIGIN}/api/gspc`,
    not_a_certification: true,
  };
}

/** Coerce whatever the caller passed into a card object, or say why we could not. */
async function coerceCard(raw) {
  if (raw && typeof raw === "object") return { card: raw };
  if (typeof raw !== "string")
    return { error: "pass the card as an object, a JSON string, or a councilof.ai / csoai.org URL" };
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) {
    if (!FETCHABLE_ORIGINS.some((o) => s.startsWith(o)))
      return {
        error:
          "only councilof.ai and csoai.org URLs are fetched by this tool; fetch other URLs yourself and pass the JSON",
      };
    try {
      const r = await fetch(s, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!r.ok) return { error: `card fetch returned HTTP ${r.status}` };
      return { card: await r.json() };
    } catch (e) {
      return { error: `card fetch failed: ${e.message}` };
    }
  }
  try {
    return { card: JSON.parse(s) };
  } catch {
    return { error: "the string is neither valid JSON nor a councilof.ai / csoai.org URL" };
  }
}

async function verifyCardTool(args) {
  const { card, error } = await coerceCard(args.card ?? args.record ?? args.json ?? args.url ?? args.input);
  if (error) return { state: "UNCHECKABLE", reason: error, not_a_certification: true };
  const v = await verifyCard(card);
  return {
    state: v.state, // VALID | INVALID | UNCHECKABLE — three verdicts, never two
    id: v.id ?? card?.id ?? null,
    axis: v.axis ?? null,
    reason: v.reason ?? null,
    rule: `${ORIGIN}/signed/HOW-TO-VERIFY.md`,
    pinned_key: "did:web:csoai.org#card-attestation-1",
    not_a_certification: true,
    note:
      v.state === "VALID"
        ? "The body reproduces its own id and the signature verifies under the published card-attestation key. This is a verified measurement card — not a certification of anything."
        : v.state === "INVALID"
          ? "This card fails the published rule for the stated reason. INVALID is a positive finding, distinct from UNCHECKABLE."
          : "The check could not be completed. 'Could not check' is a different claim from 'forged'.",
  };
}

async function listCards(args) {
  const out = {
    doctrine:
      "Two labelled numbers from two surfaces, reported separately and never reconciled by this tool. If they disagree, the disagreement is the finding.",
    index: null,
    card_store_count_endpoint: null,
    rows: null,
    not_a_certification: true,
  };
  try {
    const idx = await fetchJson("/signed/card_index.json");
    const rows = Array.isArray(idx.cards) ? idx.cards : [];
    out.index = {
      source: `${ORIGIN}/signed/card_index.json`,
      n_cards_declared: idx.n_cards ?? null,
      rows_carried: rows.length,
      head: idx.head ?? null,
      packaged_at: idx.packaged_at ?? null,
      pubkey: idx.pubkey ?? null,
    };
    const wanted = args.axis ? String(args.axis).toLowerCase() : null;
    const limit = Number.isInteger(args.limit) ? args.limit : 10;
    out.rows = rows
      .filter((r) => !wanted || String(r.axis ?? "").toLowerCase() === wanted)
      .slice()
      .sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? "")))
      .slice(0, limit)
      .map((r) => ({ card: r.card, axis: r.axis, ts: r.ts, signed: r.signed }));
  } catch (e) {
    out.index = unreachable("/signed/card_index.json", e);
  }
  try {
    const api = await fetchJson("/api/cards");
    out.card_store_count_endpoint = {
      source: `${ORIGIN}/api/cards`,
      count: api?.cards?.count ?? null,
      signed: api?.cards?.signed ?? null,
    };
  } catch (e) {
    out.card_store_count_endpoint = unreachable("/api/cards", e);
  }
  return out;
}

async function getRoot() {
  try {
    const d = await fetchJson("/root.json");
    return {
      state: "VALID",
      source: `${ORIGIN}/root.json`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      card_count: d.card_count ?? null,
      merkle_root: d.merkle_root ?? null,
      note: d.note ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    return { ...unreachable("/root.json", e), state: "UNREACHABLE", not_gspc: true };
  }
}

async function getCard(args) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  try {
    const d = await fetchJson(`/cards/${sha.slice(0, 16)}.json`);
    const card = d.card || d;
    const match = String(card.sha256 || "") === sha;
    return {
      state: match ? "VALID" : "INVALID",
      sha256: sha,
      source: `${ORIGIN}/cards/${sha.slice(0, 16)}.json`,
      surface: card.surface ?? null,
      unmeasured: card.unmeasured ?? [],
      sig_ed25519: card.sig_ed25519 ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    if (e && e.status === 404) {
      return {
        state: "INVALID",
        sha256: sha,
        reason: "not a leaf of the live root",
        source: `${ORIGIN}/cards/${sha.slice(0, 16)}.json`,
        not_a_certification: true,
        not_gspc: true,
      };
    }
    return { ...unreachable(`/cards/${sha.slice(0, 16)}.json`, e), state: "UNCHECKABLE", sha256: sha };
  }
}

async function verifyInclusion(args) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  try {
    const d = await fetchJson(`/api/proof?sha=${sha}`);
    if (d.kind === "inclusion") {
      return { state: "VALID", sha256: sha, merkle_root: d.merkle_root ?? null, not_a_certification: true };
    }
    if (d.error === "not_found") {
      return { state: "INVALID", sha256: sha, reason: d.reason ?? "not a leaf", not_a_certification: true };
    }
    return { state: "UNCHECKABLE", sha256: sha, reason: d.reason ?? "unexpected proof body", not_a_certification: true };
  } catch (e) {
    if (e && e.status === 404) {
      return { state: "INVALID", sha256: sha, reason: "not a leaf", not_a_certification: true };
    }
    return { ...unreachable(`/api/proof?sha=${sha}`, e), state: "UNCHECKABLE", sha256: sha };
  }
}

const HANDLERS = {
  board_totals: boardTotals,
  get_axis: getAxis,
  verify_card: verifyCardTool,
  list_cards: listCards,
  get_root: getRoot,
  get_card: getCard,
  verify_inclusion: verifyInclusion,
};

/* ----------------------------------------------------------------- transport */

const SUPPORTED_PROTOCOLS = ["2024-11-05", "2025-03-26", "2025-06-18"];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function replyError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function summaryLine(name, payload) {
  if (payload.state === "UNREACHABLE" || payload.index?.state === "UNREACHABLE")
    return `UNREACHABLE — the live source could not be fetched; no cached number is substituted.`;
  switch (name) {
    case "board_totals":
      return `LIVE board totals — ${payload.public_count ?? "see counts"} (slots and measurements are different kinds; never summed).`;
    case "get_axis":
      return payload.state === "NOT_ON_BOARD"
        ? `NOT ON BOARD — "${payload.axis}" is not a row the live board carries.`
        : `${payload.status ?? "?"} — axis "${payload.axis}" (${payload.measured ? "a real run stands behind this row" : "declared slot, no run behind it"}).`;
    case "verify_card":
      return `${payload.state}${payload.reason ? " — " + payload.reason : ""}${payload.state === "VALID" ? ` — ${String(payload.id).slice(0, 16)}… verifies under the published key.` : ""}`;
    case "list_cards": {
      const a = payload.index?.n_cards_declared ?? "?";
      const b = payload.card_store_count_endpoint?.count ?? "?";
      return `index declares ${a} card rows; the store's count endpoint reports ${b}. Two labelled numbers, not reconciled here.`;
    }
    case "get_root":
      return `${payload.state ?? "?"} — public-root merkle ${(String(payload.merkle_root || "")).slice(0, 16) || "none"}. Not GSPC.`;
    case "get_card":
      return `${payload.state ?? "?"} — card-v0 leaf ${String(payload.sha256 || "").slice(0, 16) || "?"}.`;
    case "verify_inclusion":
      return `${payload.state ?? "?"} — inclusion against live merkle.`;
    default:
      return name;
  }
}

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  if (method === "initialize") {
    const asked = params?.protocolVersion;
    return reply(id, {
      protocolVersion: SUPPORTED_PROTOCOLS.includes(asked) ? asked : "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "csoai-gspc-mcp", version: VERSION },
    });
  }
  if (method === "notifications/initialized" || method === "initialized") return; // notification, no reply
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS });

  if (method === "tools/call") {
    const name = params?.name;
    const fn = HANDLERS[name];
    if (!fn) return replyError(id, -32602, `unknown tool: ${name}`);
    try {
      const payload = await fn(params?.arguments ?? {});
      return reply(id, {
        content: [{ type: "text", text: `${summaryLine(name, payload)}\n\n${JSON.stringify(payload, null, 2)}` }],
        structuredContent: payload,
        isError: false,
      });
    } catch (e) {
      return reply(id, {
        content: [{ type: "text", text: `tool error: ${e instanceof Error ? e.message : String(e)}` }],
        isError: true,
      });
    }
  }

  if (isRequest) return replyError(id, -32601, `method not found: ${method}`);
  // Unknown notification: ignore silently, per JSON-RPC.
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  const s = line.trim();
  if (!s) return;
  let msg;
  try {
    msg = JSON.parse(s);
  } catch {
    return replyError(null, -32700, "parse error");
  }
  handle(msg).catch((e) => {
    process.stderr.write(`csoai-gspc-mcp: ${e?.stack ?? e}\n`);
    if (msg?.id !== undefined && msg?.id !== null) replyError(msg.id, -32603, "internal error");
  });
});
rl.on("close", () => process.exit(0));
process.stderr.write(`csoai-gspc-mcp ${VERSION} — stdio MCP server, live source ${ORIGIN}\n`);
