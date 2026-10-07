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
 *   - Tool definitions come from gspc-tools.json (free) and paid-tools.json
 *     (x402-metered) — the same two files the HTTP endpoint at councilof.ai/mcp
 *     imports (functions/mcp/*.json).
 *     In a repo checkout that file is read directly; the npm package ships a
 *     byte-identical copy made at pack time (npm run prepack).
 *   - verify_card runs the code in public/signed/verify-card.mjs — the same
 *     module the published CLI verifier is. Same rule: repo file first, packed
 *     copy as fallback.
 */

import { createInterface } from "node:readline";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PACKAGE = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"));
const VERSION = PACKAGE.version;
if (typeof VERSION !== "string" || !VERSION) throw new Error("package.json has no valid version");
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
const FREE_TOOLS = JSON.parse(readFileSync(TOOLS_PATH, "utf8")).tools;

/**
 * The x402-metered tools, from the same definitions file the HTTP door uses.
 *
 * Payment travels as the `x_payment` TOOL ARGUMENT, not as a transport header, so stdio carries
 * these exactly as the HTTP door does: the argument is forwarded verbatim as the X-PAYMENT header
 * on one same-origin request. This server never authenticates, signs or invents a receipt; it only
 * classifies the opaque response's receipt shape. Settlement is the route's job, fail-closed.
 * Without `x_payment` the tool returns the route's own
 * 402 challenge, which is an answer and not a failure — and `preview` is free where a tool offers it.
 */
const PAID_TOOLS_PATH = firstExisting([
  "../../functions/mcp/paid-tools.json", // repo checkout: the canonical file
  "./paid-tools.json", // npm package: the byte-identical pack-time copy
]);
const PAID_TOOLS = PAID_TOOLS_PATH ? JSON.parse(readFileSync(PAID_TOOLS_PATH, "utf8")).tools : [];
const PAID_BY_NAME = new Map(PAID_TOOLS.map((t) => [t.name, t]));
const TOOLS = [...FREE_TOOLS, ...PAID_TOOLS];

/**
 * Axis names: ONE alias table shared with the HTTP door (functions/mcp/axis-aliases.json) and the
 * Python client. `governance`, `GOV` and `gspc-governance` name the same axis on every surface.
 */
const ALIASES_PATH = firstExisting([
  "../../functions/mcp/axis-aliases.json", // repo checkout: the canonical file
  "./axis-aliases.json", // npm package: the byte-identical pack-time copy
]);
const AXIS_TABLE = ALIASES_PATH ? JSON.parse(readFileSync(ALIASES_PATH, "utf8")).axes : {};
const AXIS_CANON = new Map();
for (const [canonical, aliases] of Object.entries(AXIS_TABLE)) {
  AXIS_CANON.set(canonical.toLowerCase(), canonical);
  for (const a of aliases) AXIS_CANON.set(String(a).toLowerCase(), canonical);
}
function canonicalAxis(name) {
  const k = String(name ?? "").trim().toLowerCase();
  return AXIS_CANON.get(k) ?? k;
}
const sameAxis = (a, b) => canonicalAxis(a) === canonicalAxis(b);

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
  const asked = String(args.axis ?? "").trim();
  if (!asked) return { state: "BAD_INPUT", error: "pass an axis name, e.g. governance" };
  const wanted = canonicalAxis(asked);
  let d;
  try {
    d = await fetchJson("/api/gspc");
  } catch (e) {
    return unreachable("/api/gspc", e);
  }
  const rows = d.axes ?? [];
  const row = rows.find((r) => sameAxis(r.axis, wanted));
  if (!row) {
    return {
      state: "NOT_ON_BOARD",
      axis: asked,
      note: "This name is not a row on the live board. That is a fact about the board, not a verdict about the subject.",
      board_carries: rows.map((r) => r.axis),
      as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    };
  }
  const measured = String(row.status ?? "").toUpperCase() === "MEASURED";
  return {
    state: "LIVE",
    axis: row.axis,
    ...(asked.toLowerCase() !== String(row.axis).toLowerCase() ? { resolved_from: asked } : {}),
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
    // Same three door fields the HTTP door returns (functions/mcp/_board.ts): copied from the row,
    // null when the row carries none, never invented.
    kind: row.kind ?? null,
    dataset_url: row.dataset_url ?? null,
    evidence_url: typeof row.evidence_url === "string" && row.evidence_url.startsWith("/")
      ? `${ORIGIN}${row.evidence_url}` : (row.evidence_url ?? null),
    row_url: `${ORIGIN}/api/gspc?axis=${encodeURIComponent(String(row.axis))}`,
    note: row.note ?? null,
    as_of: { board_measured_on: d.measured_on ?? null, fetched_at: new Date().toISOString() },
    source: `${ORIGIN}/api/gspc`,
    not_a_certification: true,
  };
}

/** A 64-hex card id: a signed-card-index `card` field, and a public-root leaf's sha256. */
const CARD_ID_RE = /^[0-9a-f]{64}$/;
const signedCardPath = (id) => `/signed/cards/${id}.json`;
/** Absolute card_url for a signed-card-index row: its own card_url when it carries one. */
function signedCardUrl(row) {
  const own = typeof row.card_url === "string" ? row.card_url : null;
  if (own) return own.startsWith("/") ? `${ORIGIN}${own}` : own;
  const id = typeof row.card === "string" ? row.card.toLowerCase() : "";
  return CARD_ID_RE.test(id) ? `${ORIGIN}${signedCardPath(id)}` : null;
}

/**
 * Coerce whatever the caller passed into a card object, or say why we could not. A bare 64-hex
 * card id resolves to the signed body at /signed/cards/{id}.json (same rule as the HTTP door,
 * functions/mcp/_handlers.ts).
 */
async function coerceCard(raw) {
  if (raw && typeof raw === "object") return { card: raw };
  if (typeof raw !== "string")
    return { error: "pass the card as an object, a JSON string, a councilof.ai / csoai.org URL, or a 64-hex card id" };
  const s = raw.trim();
  if (CARD_ID_RE.test(s.toLowerCase())) {
    const id = s.toLowerCase();
    const url = `${ORIGIN}${signedCardPath(id)}`;
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (r.status === 404)
        return {
          error: `no signed card body at ${url} (HTTP 404): this id is not in the signed card index. If it is a public-root leaf, use get_card or verify_inclusion.`,
          resolved: { id, url },
        };
      if (!r.ok) return { error: `card fetch returned HTTP ${r.status} for ${url}`, resolved: { id, url } };
      return { card: await r.json(), resolved: { id, url } };
    } catch (e) {
      return { error: `card fetch failed for ${url}: ${e.message}`, resolved: { id, url } };
    }
  }
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
    return { error: "the string is neither valid JSON, a councilof.ai / csoai.org URL, nor a 64-hex card id" };
  }
}

async function verifyCardTool(args) {
  const { card, error, resolved } = await coerceCard(args.card ?? args.record ?? args.json ?? args.url ?? args.input);
  if (error) return { state: "UNCHECKABLE", reason: error, ...(resolved ? { resolved_from: resolved } : {}), not_a_certification: true };
  const v = await verifyCard(card);
  const id = v.id ?? card?.id ?? null;
  // A card fetched by id must BE that id; otherwise nothing was judged about the id asked for.
  const mismatch = resolved && typeof id === "string" && id !== resolved.id
    ? `the file at ${resolved.url} carries id ${id}, not the requested ${resolved.id}` : null;
  return {
    state: mismatch ? "UNCHECKABLE" : v.state, // VALID | INVALID | UNCHECKABLE — three verdicts, never two
    id,
    ...(resolved ? { resolved_from: resolved } : {}),
    axis: v.axis ?? null,
    reason: mismatch ?? v.reason ?? null,
    rule: `${ORIGIN}/signed/HOW-TO-VERIFY.md`,
    pinned_key: "did:web:csoai.org#card-attestation-1",
    not_a_certification: true,
    note:
      !mismatch && v.state === "VALID"
        ? "The body reproduces its own id and the signature verifies under the published card-attestation key. This is a verified measurement card — not a certification of anything."
        : !mismatch && v.state === "INVALID"
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
    const wanted = args.axis ? canonicalAxis(args.axis) : null;
    const limit = Number.isInteger(args.limit) ? args.limit : 10;
    if (wanted) {
      const matched = [...new Set(rows.map((r) => String(r.axis ?? "")).filter((a) => sameAxis(a, wanted)))].sort();
      out.axis_query = {
        asked: String(args.axis),
        canonical: wanted,
        spellings: AXIS_TABLE[wanted] ? [wanted, ...AXIS_TABLE[wanted]] : [wanted],
        index_names_matched: matched,
        note: "rows whose index axis name resolves to the same axis under functions/mcp/axis-aliases.json; each row keeps the index's own spelling",
      };
    }
    out.rows = rows
      .filter((r) => !wanted || sameAxis(r.axis, wanted))
      .slice()
      .sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? "")))
      .slice(0, limit)
      .map((r) => ({ card: r.card, card_url: signedCardUrl(r), axis: r.axis, ts: r.ts, signed: r.signed }));
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

/**
 * get_card reads the public-root card-v0 leaves only; the signed card index is a separate corpus
 * with zero id overlap (council-os/CARD-CORPORA.md). A signed-index id is NOT_IN_THIS_CORPUS,
 * never INVALID; INVALID needs both the index and the live root's inclusion endpoint to say no.
 * Same rule as functions/mcp/_board.ts getCardTool.
 */
const NOT_IN_THIS_CORPUS_REASON = "This id is in the signed card index, not the public root. Use verify_card.";

async function getCard(args) {
  const sha = String(args.sha256 || "").trim().toLowerCase();
  if (!CARD_ID_RE.test(sha)) {
    return { state: "UNCHECKABLE", reason: "sha256 must be 64 hex", not_a_certification: true };
  }
  const source = `${ORIGIN}/cards/${sha.slice(0, 16)}.json`;
  try {
    const d = await fetchJson(`/cards/${sha.slice(0, 16)}.json`);
    const card = d.card || d;
    const match = String(card.sha256 || "") === sha;
    return {
      state: match ? "VALID" : "INVALID",
      sha256: sha,
      source,
      surface: card.surface ?? null,
      unmeasured: card.unmeasured ?? [],
      sig_ed25519: card.sig_ed25519 ?? null,
      not_a_certification: true,
      not_gspc: true,
    };
  } catch (e) {
    if (!(e && e.status === 404)) {
      return { ...unreachable(`/cards/${sha.slice(0, 16)}.json`, e), state: "UNCHECKABLE", sha256: sha };
    }
  }
  const base = { sha256: sha, source, not_a_certification: true, not_gspc: true };
  let row;
  try {
    const idx = await fetchJson("/signed/card_index.json");
    row = (Array.isArray(idx.cards) ? idx.cards : []).find((r) => String(r.card ?? "").toLowerCase() === sha);
  } catch (e) {
    return { ...base, state: "UNCHECKABLE", reason: `no public-root wrapper at ${source} (HTTP 404), and the signed card index could not be read to rule it out (${e.message}). Could not check is not INVALID.` };
  }
  if (row) {
    return {
      ...base,
      state: "NOT_IN_THIS_CORPUS",
      reason: NOT_IN_THIS_CORPUS_REASON,
      corpus: "signed_card_index",
      card_url: signedCardUrl(row),
      next: { tool: "verify_card", arguments: { card: sha } },
      note: "The public-root leaves and the signed card index are separate sets with no id in common. This tool reads the public-root leaves only, so this answer says which set the id belongs to, not whether the card verifies.",
    };
  }
  let inRoot;
  try {
    const p = await fetchJson(`/api/proof?sha=${sha}`);
    inRoot = p.kind === "inclusion" ? true : p.error === "not_found" ? false : null;
  } catch (e) {
    inRoot = e && e.status === 404 ? false : null;
  }
  if (inRoot === true)
    return { ...base, state: "UNCHECKABLE", reason: `a leaf of the live root, but its wrapper at ${source} answered HTTP 404. The leaf is included; its body could not be fetched. Use verify_inclusion for the proof.` };
  if (inRoot === null)
    return { ...base, state: "UNCHECKABLE", reason: `no public-root wrapper at ${source} (HTTP 404), and the live root's inclusion endpoint could not be read. Could not check is not INVALID.` };
  return { ...base, state: "INVALID", reason: "not a leaf of the live root, and not in the signed card index" };
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

/**
 * Mirror the HTTP MCP tool's public x402-trust contract. The snapshot is the
 * canonical measured artefact; this package delegates to it instead of
 * copying counts or manufacturing a trust verdict locally.
 */
/** partial = the snapshot says so OR its enumeration did not complete (a cap is not completion). Mirrors functions/mcp/_board.ts partialOf. */
function partialOf(d) {
  const e = d.enumeration ?? {};
  if (d.partial === true) return { partial: true, partial_reason: String(e.stop_reason ?? "the snapshot marks itself partial") };
  if (e.complete === false) {
    const seen = e.rows_with_remote ?? e.registry_rows_seen;
    return {
      partial: true,
      partial_reason: `enumeration incomplete: ${String(e.stop_reason ?? "stopped early")}${
        e.unique_hosts != null && seen != null ? ` (${e.unique_hosts} hosts probed of ${seen} registry rows with a remote)` : ""
      }`,
    };
  }
  return { partial: false, partial_reason: null };
}

async function mcpTrust() {
  const path = "/interop/mcp-trust/latest.json";
  try {
    const d = await fetchJson(path);
    return {
      state: "VALID",
      source: `${ORIGIN}${path}`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      // A cap-limited read is PARTIAL — read from the enumeration, not only the flag (2026-09-26).
      ...partialOf(d),
      enumeration: d.enumeration ?? null,
      counts: d.counts ?? null,
      headline: d.headline ?? null,
      diff: d.diff ?? null,
      not_a_certification: true,
    };
  } catch (e) {
    return { ...unreachable(path, e), state: "UNREACHABLE" };
  }
}

async function x402Trust() {
  const path = "/interop/x402-trust/latest.json";
  try {
    const d = await fetchJson(path);
    return {
      state: "VALID",
      source: `${ORIGIN}${path}`,
      kind: d.kind ?? null,
      as_of: d.as_of ?? null,
      counts: d.counts ?? null,
      headline: d.headline ?? null,
      not_a_certification: true,
    };
  } catch (e) {
    return { ...unreachable(path, e), state: "UNREACHABLE" };
  }
}

/* ------------------------------------------------- measurement-capsule readers */

/**
 * measurement_index, verify_capsule and server_evidence are answered by the door's own /mcp
 * (functions/_lib/measurementCapsule.ts): this package forwards the call and returns the door's
 * structuredContent unchanged, so the two implementations cannot disagree about a capsule. The door
 * re-derives everything it returns (capsule ids, Merkle inclusion, the index signature against the
 * pinned key). If the door cannot be reached the answer is UNREACHABLE — never a guess, never
 * NOT_MEASURED (which is a statement about the index, not about the connection).
 */
const MEASUREMENT_DOCTRINE = "measurement, not endorsement";

async function doorTool(name, args) {
  const url = `${ORIGIN}/mcp`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-03-26",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`POST ${url} returned HTTP ${r.status}`);
    const text = await r.text();
    const ct = r.headers.get("content-type") || "";
    let msg;
    if (ct.includes("text/event-stream")) {
      const frames = text
        .replace(/\r\n/g, "\n")
        .split(/\n\n/)
        .map((e) => e.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n"))
        .filter(Boolean);
      msg = JSON.parse(frames[frames.length - 1]);
    } else msg = JSON.parse(text);
    const sc = msg?.result?.structuredContent;
    if (!sc || typeof sc !== "object") throw new Error(msg?.error?.message || "the door returned no structuredContent");
    return { ...sc, answered_by: url };
  } catch (e) {
    return {
      state: "UNREACHABLE",
      doctrine: MEASUREMENT_DOCTRINE,
      reason: `the door that answers ${name} could not be reached: ${e instanceof Error ? e.message : String(e)}`,
      source: url,
    };
  }
}

/* ---------------------------------------------------------------- paid tools */

const PAID_DOCTRINE =
  "measurement, not certification — no tool here carries or awards a trust label of any kind; " +
  "verification stays free";

/** Build the one request a paid tool makes. A caller cannot steer it to another URL. */
function buildPaidRequest(name, args) {
  const tool = PAID_BY_NAME.get(name);
  if (!tool) return { error: `unknown paid tool: ${name}` };
  const route = tool.csoai.route;
  const str = (k) => (typeof args[k] === "string" ? args[k].trim() : "");
  const flag = (k) => args[k] === true || args[k] === "1" || args[k] === "true";
  const headers = { accept: "application/json" };
  const xp = str("x_payment");
  if (xp) headers["x-payment"] = xp;
  const u = new URL(route, ORIGIN);
  let method = "GET";
  let body;

  switch (name) {
    case "commission_card":
      if (!str("subject")) return { error: "subject is required" };
      u.searchParams.set("subject", str("subject"));
      if (str("axis")) u.searchParams.set("axis", str("axis"));
      break;
    case "art50_marking_evidence":
      if (flag("preview")) u.searchParams.set("preview", "1");
      if (str("bytes_b64") || str("manifest_b64")) {
        method = "POST";
        headers["content-type"] = "application/json";
        body = JSON.stringify(
          str("bytes_b64") ? { bytes_b64: str("bytes_b64") } : { manifest_b64: str("manifest_b64") },
        );
      } else if (str("url")) {
        u.searchParams.set("url", str("url"));
      } else {
        return { error: "one of url, bytes_b64 or manifest_b64 is required" };
      }
      break;
    case "rwa_evidence":
      if (!str("asset")) return { error: "asset is required" };
      u.searchParams.set("asset", str("asset"));
      if (flag("preview")) u.searchParams.set("preview", "1");
      break;
    case "receipts_batch":
      if (!str("from")) return { error: "from is required (ISO-8601)" };
      u.searchParams.set("from", str("from"));
      if (str("to")) u.searchParams.set("to", str("to"));
      if (flag("preview")) u.searchParams.set("preview", "1");
      break;
    case "evidence_bundle":
      // Same request as the HTTP door (functions/mcp/_paid.ts): preview=true drops bundle=1 (free).
      if (!str("obligation")) return { error: "obligation is required (article-50, article-53, dora or cra)" };
      u.searchParams.set("obligation", str("obligation"));
      if (str("subject")) u.searchParams.set("subject", str("subject").slice(0, 120));
      if (!flag("preview")) u.searchParams.set("bundle", "1");
      break;
    default:
      return { error: `no request builder for ${name}` };
  }
  return { url: u.toString(), init: { method, headers, ...(body ? { body } : {}) }, route };
}

function inspectReceipt(paymentResponse) {
  if (!paymentResponse) return "ABSENT";
  try {
    const normalized = paymentResponse.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))));
    const receipt = decoded?.extensions?.["offer-receipt"]?.info?.receipt;
    return receipt &&
      typeof receipt === "object" &&
      !Array.isArray(receipt) &&
      receipt.format === "jws" &&
      typeof receipt.signature === "string" &&
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(receipt.signature)
      ? "PRESENT_UNVERIFIED"
      : "MISSING";
  } catch {
    return "UNREADABLE";
  }
}

function settlementFields(paymentPresented, paymentResponse) {
  if (paymentResponse) {
    return {
      settlement_state: "REPORTED_BY_ROUTE",
      payment_response_header: paymentResponse,
    };
  }
  if (paymentPresented) return { settlement_state: "UNCONFIRMED" };
  return { settlement_state: "NOT_REQUESTED", nothing_charged: true };
}

function deliveryFields(paymentPresented, paymentResponse) {
  const receiptState = paymentResponse
    ? inspectReceipt(paymentResponse)
    : paymentPresented
      ? "ABSENT"
      : "NOT_REQUESTED";
  if (!paymentPresented) {
    return { delivery_kind: "PREVIEW_OR_FREE", receipt_state: receiptState };
  }
  if (!paymentResponse) {
    return { delivery_kind: "DELIVERED_SETTLEMENT_UNCONFIRMED", receipt_state: receiptState };
  }
  if (receiptState === "PRESENT_UNVERIFIED") {
    return { delivery_kind: "DELIVERED_WITH_ROUTE_RECEIPT", receipt_state: receiptState };
  }
  return {
    delivery_kind: "DELIVERED_RECEIPT_GAP",
    receipt_state: receiptState,
    receipt_gap:
      "The route reported settlement, but its opaque response did not carry a readable offer-receipt JWS. Inspect the route, chain and facilitator; do not retry blindly.",
  };
}

/**
 * Forward one paid tool to its route and report what came back, in the route's own words.
 * 402 is PAYMENT_REQUIRED and not an error; 404 is NOT_DEPLOYED and never a fabricated result.
 */
async function callPaidTool(name, args) {
  const tool = PAID_BY_NAME.get(name);
  const paymentPresented = typeof args.x_payment === "string" && args.x_payment.trim().length > 0;
  const base = {
    tool: name,
    route: tool.csoai.route,
    sku: tool.csoai.sku,
    rail: tool.csoai.rail,
    payment_presented: paymentPresented,
    doctrine: PAID_DOCTRINE,
    not_a_certification: true,
  };
  const built = buildPaidRequest(name, args);
  if (built.error) return { ...base, status: "BAD_ARGUMENTS", reason: built.error };

  let res;
  try {
    res = await fetch(built.url, { ...built.init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (e) {
    return {
      ...base,
      status: "UNREACHABLE",
      reason: e instanceof Error ? e.message : String(e),
      delivery_state: "UNKNOWN",
      ...settlementFields(paymentPresented),
      note: paymentPresented
        ? "The route could not be fetched. Delivery and settlement are unknown; inspect the wallet, chain and facilitator before signing or retrying."
        : "The route could not be fetched. No payment authorization was presented, and no result is invented.",
    };
  }

  let text;
  try {
    text = await res.text();
  } catch {
    return {
      ...base,
      status: "UNREADABLE_RESPONSE",
      http_status: res.status,
      reason: "the evidence route response could not be read",
      delivery_state: "UNKNOWN",
      ...settlementFields(paymentPresented),
      note: paymentPresented
        ? "Delivery and settlement are unknown; inspect the wallet, chain and facilitator before signing or retrying."
        : "No payment authorization was presented, and no result is invented.",
    };
  }
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 2000) };
  }

  if (res.status === 402) {
    // T11 (6 Oct 2026): say a dated amount in words, built from the challenge, so it disappears by itself.
    const endsAt = body?.accepts?.[0]?.csoai_pricing?.ends_at;
    const datedAmount =
      typeof endsAt === "string" && endsAt
        ? ` Launch amount until ${endsAt}; after that this tool asks the standard amount in accepts[0].csoai_pricing.normal_amount_atomic — read accepts[] on every call.`
        : "";
    return {
      ...base,
      status: "PAYMENT_REQUIRED",
      http_status: 402,
      payment_required: body,
      payment_required_header: res.headers.get("payment-required"),
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(paymentPresented),
      note:
        "A challenge is an answer, not a failure. " +
        (paymentPresented
          ? "A payment authorization was presented, but this response does not prove settlement. Inspect the wallet, chain and facilitator before signing or retrying."
          : "Pay from your own wallet against accepts[] and call again with x_payment. No payment authorization was presented; nothing was charged by this request.") +
        datedAmount,
    };
  }
  if (res.status === 404) {
    return {
      ...base,
      status: "NOT_DEPLOYED",
      http_status: 404,
      body,
      delivery_state: "NOT_DELIVERED",
      ...settlementFields(paymentPresented),
      note: paymentPresented
        ? `${tool.csoai.route} is not on ${ORIGIN}. Settlement is unconfirmed; inspect the wallet, chain and facilitator before signing or retrying.`
        : `${tool.csoai.route} is not on ${ORIGIN}. No payment authorization was presented; nothing was charged by this request.`,
    };
  }
  if (res.ok) {
    const settle = res.headers.get("x-payment-response");
    return {
      ...base,
      status: "DELIVERED",
      http_status: res.status,
      body,
      deliverable: body,
      delivery_state: "DELIVERED",
      ...settlementFields(paymentPresented, settle),
      ...deliveryFields(paymentPresented, settle),
      payment_response_header: settle,
      ...(settle ? { x_payment_response: settle } : {}),
    };
  }
  const settle = res.headers.get("x-payment-response");
  return {
    ...base,
    status: `HTTP_${res.status}`,
    http_status: res.status,
    body,
    delivery_state: "NOT_DELIVERED",
    ...settlementFields(paymentPresented, settle),
    note: settle
      ? "Settlement was reported by the route; inspect the receipt before retrying."
      : paymentPresented
        ? "Settlement is unconfirmed; inspect the wallet, chain and facilitator before signing or retrying."
        : "No payment authorization was presented; nothing was charged by this request.",
  };
}

const HANDLERS = {
  board_totals: boardTotals,
  get_axis: getAxis,
  verify_card: verifyCardTool,
  list_cards: listCards,
  get_root: getRoot,
  get_card: getCard,
  verify_inclusion: verifyInclusion,
  x402_trust: x402Trust,
  mcp_trust: mcpTrust,
  measurement_index: (a) => doorTool("measurement_index", a),
  verify_capsule: (a) => doorTool("verify_capsule", a),
  server_evidence: (a) => doorTool("server_evidence", a),
  // The door answers it (functions/mcp/_evidence.ts), so the two implementations cannot disagree.
  evidence_bundle_preview: (a) => doorTool("evidence_bundle_preview", a),
  // GSPC Route (decide-only): the door answers it (functions/_lib/route), so the two cannot disagree.
  route: (a) => doorTool("route", a),
};

/* ----------------------------------------------------------------- transport */

// Oldest first; the LAST entry is the latest this server speaks. An unknown requested version is
// answered with the latest (MCP lifecycle: "the server MUST respond with another protocol version
// it supports. This SHOULD be the latest version supported"), not the oldest as it was until
// 2026-09-26. README.md "stdio" lists exactly this array (tools-match-door.test.ts checks it).
const SUPPORTED_PROTOCOLS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"];

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
      return payload.reason
        ? `${payload.state ?? "?"} — ${payload.reason}`
        : `${payload.state ?? "?"} — card-v0 leaf ${String(payload.sha256 || "").slice(0, 16) || "?"}.`;
    case "verify_inclusion":
      return `${payload.state ?? "?"} — inclusion against live merkle.`;
    case "x402_trust":
      return `${payload.state ?? "?"} — ${payload.headline || "catalog trust counts"}.`;
    case "mcp_trust":
      return `${payload.state ?? "?"} — MCP handshake census${payload.partial ? " (partial round)" : ""}.`;
    case "evidence_bundle_preview":
      return `${payload.state ?? "?"}${payload.reason ? " — " + payload.reason : ""} — ${payload.relevant_signed_cards ?? 0} already-signed card(s) relevant-to the obligation; observations only, never a determination.${payload.review_note ? " " + payload.review_note : ""}`;
    case "route":
      return `${payload.state ?? "?"}${payload.chosen ? " — " + payload.chosen.id + " on basis " + payload.chosen.choice_basis : ""}; separation ${payload.separation ?? "?"}. Unsigned decide-only preview; routing is not ranking.`;
    case "measurement_index":
    case "verify_capsule":
    case "server_evidence":
      return `${payload.state ?? "?"}${payload.reason ? " — " + payload.reason : ""} (${MEASUREMENT_DOCTRINE}).`;
    case "commission_card":
    case "art50_marking_evidence":
    case "rwa_evidence":
    case "receipts_batch":
    case "evidence_bundle":
      return `${payload.status ?? "?"} — ${payload.route ?? name}${
        payload.status === "PAYMENT_REQUIRED" && payload.payment_presented === false ? "; nothing charged" : ""
      }${payload.reason ? " — " + payload.reason : ""}. ${PAID_DOCTRINE}.`;
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
      protocolVersion: SUPPORTED_PROTOCOLS.includes(asked) ? asked : SUPPORTED_PROTOCOLS[SUPPORTED_PROTOCOLS.length - 1],
      capabilities: { tools: {} },
      serverInfo: { name: "csoai-gspc-mcp", version: VERSION },
    });
  }
  if (method === "notifications/initialized" || method === "initialized") return; // notification, no reply
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS });

  if (method === "tools/call") {
    const name = params?.name;
    const fn = PAID_BY_NAME.has(name) ? (a) => callPaidTool(name, a) : HANDLERS[name];
    if (!fn) return replyError(id, -32602, `unknown tool: ${name}`);
    try {
      const payload = await fn(params?.arguments ?? {});
      // x402 MCP transport (x402-foundation/x402 specs/transports-v2/mcp.md): a payment challenge is
      // a tool result with isError:true whose structuredContent IS the PaymentRequired object and
      // whose content[0].text is that object as JSON. Same shape as the HTTP door
      // (functions/mcp/_paid.ts). Payment is still read only from the x_payment argument.
      if (payload?.status === "PAYMENT_REQUIRED") {
        const pr = payload.payment_required && typeof payload.payment_required === "object" && !Array.isArray(payload.payment_required)
          ? payload.payment_required
          : {};
        const sc = { ...pr, ...payload };
        return reply(id, {
          content: [
            { type: "text", text: JSON.stringify(sc) },
            { type: "text", text: summaryLine(name, payload) },
          ],
          structuredContent: sc,
          isError: true,
        });
      }
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
