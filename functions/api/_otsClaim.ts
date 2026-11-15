// functions/api/_otsClaim.ts — the current public root's OpenTimestamps state, in one sentence,
// DERIVED from public/interop/root-witness-latest.json, never typed. Leading underscore: code,
// never a route.
//
// Why this file exists. Until 2026-11-15 two server surfaces carried a typed sentence saying the
// root's OTS receipt "is STAMPED_PENDING_BITCOIN" (GET /api/evidence-pack → active_controls
// .signing_chain, and the assistant's verify answer in _chatLobby.ts). The witness file those
// surfaces sit beside said CONFIRMED_BITCOIN at a named block, so a machine buyer read a state the
// producers had already superseded. The client already derives its sentence from the same bytes
// (client/src/data/anchoringClaim.ts → CURRENT_ROOT_OTS_CLAIM); this is the server-side twin.
//
// Vocabulary is the witness producers' own (scripts/witness_public_root.py,
// scripts/witness/witness-root.py, scripts/root-witness-release-gate.py), the same two constants
// functions/api/_ledgers.ts answers the per-ledger OTS questions from:
//   CONFIRMED_BITCOIN        the proof carries a Bitcoin block attestation
//   STAMPED_PENDING_BITCOIN  a calendar fragment only — not a Bitcoin proof
//   anything else / absent   no confirmed inclusion is claimed; the state is named as read.
// A pending or missing witness is a first-class state and is said in those words. Nothing here is
// a certification; the witness covers the exact root.json bytes only.
import rootWitness from "../../public/interop/root-witness-latest.json";

export const WITNESS_PATH = "/interop/root-witness-latest.json";
const CONFIRMED = "CONFIRMED_BITCOIN";
const PENDING = "STAMPED_PENDING_BITCOIN";

export type OtsRead = { status: string; block: number | null; observed_at: string | null };

/** Read the OTS witness fields from a root-witness document. Unknown shape → UNCHECKABLE. */
export function readOts(witness: unknown): OtsRead {
  const w = (witness ?? {}) as { witnesses?: { ots?: { status?: unknown; bitcoin_blocks?: unknown; observed_at?: unknown } } };
  const ots = w.witnesses?.ots ?? {};
  const status = typeof ots.status === "string" && ots.status.trim() ? ots.status.trim().toUpperCase() : "UNCHECKABLE";
  const blocks = Array.isArray(ots.bitcoin_blocks) ? ots.bitcoin_blocks.filter((b): b is number => Number.isInteger(b)) : [];
  const block = status === CONFIRMED && blocks.length > 0 ? blocks[0] : null;
  const observed_at = typeof ots.observed_at === "string" && ots.observed_at ? ots.observed_at : null;
  return { status, block, observed_at };
}

/** The one sentence. Call sites quote it; they do not paraphrase it. */
export function otsSentence(read: OtsRead): string {
  const source = `GET ${WITNESS_PATH} → witnesses.ots`;
  const when = read.observed_at ? `witness observed ${read.observed_at}; ` : "";
  const head = "The current public-root envelope is Ed25519-signed and its separate OpenTimestamps";
  if (read.status === CONFIRMED) {
    const at = read.block != null ? ` at Bitcoin block ${read.block}` : "";
    return `${head} proof is ${CONFIRMED}${at} (${when}${source}). That witness covers the exact root.json bytes only, not any card.`;
  }
  if (read.status === PENDING) {
    return `${head} receipt is ${PENDING} — a calendar fragment, not yet a Bitcoin proof (${when}${source}). That is not a confirmed Bitcoin timestamp.`;
  }
  return `${head} state reads ${read.status}; no confirmed inclusion in a Bitcoin block is claimed (${when}${source}).`;
}

/** Derived once from the committed witness bytes this deploy ships. */
export const CURRENT_ROOT_OTS = readOts(rootWitness);
export const CURRENT_ROOT_OTS_SENTENCE = otsSentence(CURRENT_ROOT_OTS);
