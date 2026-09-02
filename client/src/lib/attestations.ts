/**
 * attestations — the pure logic behind the Council OS "Attestations" pane.
 *
 * WHAT THIS IS. The estate publishes ONE signed root (`/root.json`, Ed25519 under
 * did:web:csoai.org#board-attestation-1) and a witness sidecar
 * (`/interop/root-witness-latest.json`) that says, per witness, what state those
 * exact bytes are in: WITNESSED (Rekor), STAMPED_PENDING_BITCOIN (OpenTimestamps),
 * ATTESTED / NOT_YET (EAS on Base), NOT_YET (XRPL memo). This module turns those
 * documents into rails the pane can print, and re-runs — in the browser — the
 * three checks a stranger can run offline: the root signature, an inclusion
 * proof, and the sha256 of the bytes the witnesses name.
 *
 * DOCTRINE, in code:
 *   - states are printed VERBATIM from the sidecar; nothing here promotes a state;
 *   - NOT_YET never gets a tick (`railTone` maps it to "absent");
 *   - every check reports exactly VALID / INVALID / UNCHECKABLE — a check that
 *     could not run is never reported as a failure (see cardVerify.ts for why);
 *   - the deciding key is PINNED (functions/_lib/cardVerify.ts PINNED_ANCHORS),
 *     so a verdict needs no network at check time; did.json is a cross-check.
 *
 * Learned from EAS (docs/LEARN-FROM-EAS.md): one UID-shaped identifier, one
 * search box, decoded-beside-raw, a "how to verify" that is a command not a
 * promise. Not learned: a chain, a wallet, a token, a resolver that gates.
 */

import { PINNED_ANCHORS } from "../../../functions/_lib/cardVerify";

export type Verdict = "VALID" | "INVALID" | "UNCHECKABLE";

export interface Check {
  state: Verdict;
  /** One sentence, always populated. */
  reason: string;
}

export interface PublicRoot {
  kind?: string;
  schema?: string;
  as_of?: string;
  merkle_root?: string;
  card_count?: number;
  did_intended?: string;
  card_sha256?: string[];
  sig_ed25519?: string;
  [k: string]: unknown;
}

export interface WitnessEntry {
  status?: string;
  [k: string]: unknown;
}

export interface WitnessDoc {
  kind?: string;
  as_of?: string;
  note?: string;
  artifact?: {
    url?: string;
    also?: string;
    sha256?: string;
    bytes?: number;
    merkle_root?: string;
    card_count?: number;
    as_of?: string;
  };
  signature?: {
    did?: string;
    preimage_fields?: string[];
    preimage_sha256?: string;
    preimage_bytes?: number;
    verified_against_did_json?: boolean;
  };
  witnesses?: Record<string, WitnessEntry>;
  verify_hints?: string[];
}

export interface PointerDoc {
  kind?: string;
  as_of?: string;
  drift?: { status?: string; match_sha256?: boolean; match_merkle_root?: boolean; reason?: string };
  witnesses?: Record<string, string>;
  hard_stops?: string[];
}

export interface EasDoc {
  kind?: string;
  status?: string;
  reason?: string;
  schema?: string;
  schema_uid?: string;
  attestations?: { sha256?: string; uid?: string; url?: string; at?: string; attester?: string }[];
}

export interface ProofDoc {
  schema?: string;
  kind?: string;
  sha256?: string;
  index?: number;
  proof?: string[];
  merkle_root?: string | null;
  error?: string;
  reason?: string;
}

export interface CardIndexRow {
  card: string;
  card_url?: string;
  axis?: string;
  ts?: string;
  signed?: boolean;
  kid?: string;
}

export interface CardIndexDoc {
  n_cards?: number;
  head?: string;
  packaged_at?: string;
  cards?: CardIndexRow[];
}

export interface Correction {
  id: string;
  date: string;
  what_was_wrong: string;
  how_caught: string;
  fix: string;
  status: string;
}

export interface CorrectionsDoc {
  schema?: string;
  policy?: string;
  license?: string;
  publisher?: string;
  signature_state?: string;
  note?: string;
  corrections?: Correction[];
}

/* ------------------------------------------------------------------ bytes */

const HEX64 = /^[0-9a-f]{64}$/;

export function bytesToHex(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

export function hexToBytes(h: string): Uint8Array {
  const clean = h.trim().toLowerCase().replace(/^0x/, "");
  if (clean.length % 2 !== 0 || /[^0-9a-f]/.test(clean)) throw new Error("not hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function subtle(): SubtleCrypto | null {
  const c = (globalThis as any).crypto;
  return c && c.subtle ? (c.subtle as SubtleCrypto) : null;
}

export async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const s = subtle();
  if (!s) throw new Error("no WebCrypto in this runtime");
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const d = await s.digest("SHA-256", bytes as unknown as BufferSource);
  return bytesToHex(new Uint8Array(d));
}

/* ------------------------------------------------------------ root signature */

/** The six envelope fields the board signs — HOW-TO-VERIFY-ROOT.md §1. Order is irrelevant: keys are sorted. */
export const ROOT_PREIMAGE_KEYS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"] as const;

export const BOARD_KEY_ID = "did:web:csoai.org#board-attestation-1";

/** The pinned board key (raw Ed25519 hex) — the deciding anchor, no network needed. */
export const BOARD_KEY_HEX: string | null = PINNED_ANCHORS.find((a) => a.id === BOARD_KEY_ID)?.hex ?? null;

/**
 * Canonical preimage: Python json.dumps(sort_keys=True, separators=(',',':'),
 * ensure_ascii=False) over exactly the six fields. For these values (ASCII
 * strings and one integer) JSON.stringify over a key-sorted object produces the
 * identical bytes; the test pins that by hashing to the sidecar's preimage_sha256.
 */
export function rootPreimage(root: PublicRoot): string {
  const o: Record<string, unknown> = {};
  for (const k of [...ROOT_PREIMAGE_KEYS].sort()) o[k] = root[k];
  return JSON.stringify(o);
}

export async function verifyRootSignature(root: PublicRoot | null, keyHex: string | null = BOARD_KEY_HEX): Promise<Check> {
  if (!root || typeof root !== "object") return { state: "UNCHECKABLE", reason: "No root document to check." };
  for (const k of ROOT_PREIMAGE_KEYS) {
    if (root[k] === undefined) return { state: "UNCHECKABLE", reason: `The root has no "${k}" field, so the signed preimage cannot be rebuilt.` };
  }
  if (typeof root.sig_ed25519 !== "string" || !HEX64.test(root.sig_ed25519.slice(0, 64)) || root.sig_ed25519.length !== 128)
    return { state: "UNCHECKABLE", reason: "The root carries no 64-byte sig_ed25519, so there is no signature to check." };
  if (!keyHex) return { state: "UNCHECKABLE", reason: `No pinned key for ${BOARD_KEY_ID} in this build.` };
  if (root.did_intended !== BOARD_KEY_ID)
    return { state: "INVALID", reason: `did_intended is ${String(root.did_intended)}, not ${BOARD_KEY_ID}.` };
  const s = subtle();
  if (!s) return { state: "UNCHECKABLE", reason: "This runtime has no WebCrypto, so the signature could not be checked here." };
  const preimage = new TextEncoder().encode(rootPreimage(root));
  let key: CryptoKey;
  try {
    key = await s.importKey("raw", hexToBytes(keyHex) as unknown as BufferSource, { name: "Ed25519" }, false, ["verify"]);
  } catch {
    return { state: "UNCHECKABLE", reason: "This browser has no Ed25519 in WebCrypto, so the signature could not be checked here. Run HOW-TO-VERIFY-ROOT.md §1 instead." };
  }
  let ok = false;
  try {
    ok = await s.verify({ name: "Ed25519" }, key, hexToBytes(root.sig_ed25519) as unknown as BufferSource, preimage as unknown as BufferSource);
  } catch (e: any) {
    return { state: "UNCHECKABLE", reason: `The signature check could not run: ${e?.message ?? e}.` };
  }
  return ok
    ? { state: "VALID", reason: `Ed25519 over ${preimage.length} canonical bytes of {${ROOT_PREIMAGE_KEYS.join(", ")}} verifies under ${BOARD_KEY_ID} (pinned key).` }
    : { state: "INVALID", reason: `The signature does not verify under the pinned ${BOARD_KEY_ID} key over the six-field preimage.` };
}

/* ------------------------------------------------------------ merkle inclusion */

/**
 * The tree rule from scripts/publish_public_root.py: pairs hashed as sha256(a‖b),
 * an odd last node paired with itself. A proof is the sibling per level, bottom up.
 */
export async function merkleRoot(leafHexes: string[]): Promise<string> {
  let level = leafHexes.map(hexToBytes);
  if (level.length === 0) return sha256Hex(new Uint8Array(0));
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i];
      const b = i + 1 < level.length ? level[i + 1] : level[i];
      const cat = new Uint8Array(a.length + b.length);
      cat.set(a, 0);
      cat.set(b, a.length);
      next.push(hexToBytes(await sha256Hex(cat)));
    }
    level = next;
  }
  return bytesToHex(level[0]);
}

export async function verifyInclusion(p: ProofDoc | null): Promise<Check & { computed?: string }> {
  if (!p || typeof p !== "object") return { state: "UNCHECKABLE", reason: "No proof document." };
  if (p.kind !== "inclusion") return { state: "UNCHECKABLE", reason: `The proof document is kind "${String(p.kind)}", not "inclusion".` };
  if (typeof p.sha256 !== "string" || !HEX64.test(p.sha256)) return { state: "UNCHECKABLE", reason: "The proof names no 64-hex leaf." };
  if (typeof p.merkle_root !== "string" || !HEX64.test(p.merkle_root)) return { state: "UNCHECKABLE", reason: "The proof names no 64-hex merkle_root." };
  if (!Array.isArray(p.proof) || !p.proof.every((h) => typeof h === "string" && HEX64.test(h)))
    return { state: "UNCHECKABLE", reason: "The proof path is not a list of 64-hex siblings." };
  if (!Number.isInteger(p.index) || (p.index as number) < 0) return { state: "UNCHECKABLE", reason: "The proof has no leaf index." };
  if (!subtle()) return { state: "UNCHECKABLE", reason: "This runtime has no WebCrypto, so the path could not be re-hashed here." };

  let cur = hexToBytes(p.sha256);
  let idx = p.index as number;
  for (const sibHex of p.proof) {
    const sib = hexToBytes(sibHex);
    const cat = new Uint8Array(64);
    if (idx % 2 === 0) {
      cat.set(cur, 0);
      cat.set(sib, 32);
    } else {
      cat.set(sib, 0);
      cat.set(cur, 32);
    }
    cur = hexToBytes(await sha256Hex(cat));
    idx = Math.floor(idx / 2);
  }
  const computed = bytesToHex(cur);
  return computed === p.merkle_root
    ? { state: "VALID", reason: `Leaf ${p.index} re-hashes through ${p.proof.length} siblings to merkle_root ${p.merkle_root.slice(0, 16)}….`, computed }
    : { state: "INVALID", reason: `The path re-hashes to ${computed.slice(0, 16)}…, not the published merkle_root ${p.merkle_root.slice(0, 16)}….`, computed };
}

/* ---------------------------------------------------------------- witnesses */

export type RailTone = "done" | "pending" | "absent" | "unknown";

/**
 * A tick is earned only by a state that names a completed external record.
 * NOT_YET is "absent", never green — that is the whole point of printing states
 * verbatim instead of icons.
 */
export function railTone(state: string | undefined | null): RailTone {
  const s = String(state ?? "").toUpperCase();
  if (!s) return "absent";
  if (s === "WITNESSED" || s === "ATTESTED" || s === "STAMPED_BITCOIN" || s === "CONFIRMED") return "done";
  if (s === "STAMPED_PENDING_BITCOIN" || s === "PENDING" || s === "PUBLISHED") return "pending";
  if (s === "NOT_YET" || s === "UNCHECKABLE" || s === "ABSENT") return "absent";
  return "unknown";
}

export interface RailLink {
  href: string;
  label: string;
}

export interface WitnessRail {
  id: "rekor" | "ots" | "eas_base" | "xrpl_memo";
  label: string;
  /** Verbatim from the sidecar (or the EAS log when it exists). */
  state: string;
  tone: RailTone;
  detail: string;
  links: RailLink[];
}

export function isoFromUnix(t: unknown): string | null {
  const n = typeof t === "number" ? t : typeof t === "string" ? Number(t) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Build the four rails. `eas` is the EAS log document when it was served;
 * `easHttp` is the status the fetch returned (404 today) so the rail can say
 * where its state came from instead of pretending the log exists.
 */
export function witnessRails(w: WitnessDoc | null, eas: EasDoc | null, easHttp: number | null): WitnessRail[] {
  const ws = (w && w.witnesses) || {};
  const rekor = (ws.rekor || {}) as Record<string, unknown>;
  const ots = (ws.ots || {}) as Record<string, unknown>;
  const easSide = (ws.eas_base || {}) as Record<string, unknown>;
  const xrpl = (ws.xrpl_memo || {}) as Record<string, unknown>;
  const missing = "no witness sidecar read";

  // Rekor
  const rekorState = String(rekor.status ?? (w ? "" : missing));
  const rekorLinks: RailLink[] = [];
  if (typeof rekor.url === "string") rekorLinks.push({ href: rekor.url, label: "Rekor API entry" });
  if (rekor.logIndex != null) rekorLinks.push({ href: `https://search.sigstore.dev/?logIndex=${rekor.logIndex}`, label: "search.sigstore.dev" });
  if (typeof rekor.entry_file === "string") rekorLinks.push({ href: rekor.entry_file, label: "entry file (our copy)" });
  const rekorDetailParts: string[] = [];
  if (rekor.logIndex != null) rekorDetailParts.push(`logIndex ${rekor.logIndex}`);
  const it = isoFromUnix(rekor.integratedTime);
  if (it) rekorDetailParts.push(`integratedTime ${it}`);
  if (typeof rekor.type === "string") rekorDetailParts.push(String(rekor.type));
  if (typeof rekor.uuid === "string") rekorDetailParts.push(`uuid ${String(rekor.uuid).slice(0, 16)}…`);

  // OTS
  const otsState = String(ots.status ?? (w ? "" : missing));
  const otsLinks: RailLink[] = [];
  if (typeof ots.url === "string") otsLinks.push({ href: ots.url, label: ".ots proof file" });
  otsLinks.push({ href: "https://opentimestamps.org/", label: "opentimestamps.org (drop the .ots to verify)" });

  // EAS on Base — the log file wins when it is served and names a status; else the sidecar.
  let easState = String(easSide.status ?? (w ? "" : missing));
  let easDetail = typeof easSide.reason === "string" ? String(easSide.reason) : "";
  const easLinks: RailLink[] = [];
  if (eas && typeof eas.status === "string") {
    easState = eas.status;
    const latest = Array.isArray(eas.attestations) ? eas.attestations[0] : undefined;
    if (latest && typeof latest.url === "string") easLinks.push({ href: latest.url, label: "base.easscan.org attestation" });
    if (latest && typeof latest.uid === "string") easDetail = `uid ${latest.uid.slice(0, 18)}… · ${latest.at ?? ""}`.trim();
    else if (typeof eas.reason === "string") easDetail = eas.reason;
    if (typeof eas.schema === "string") easDetail = `${easDetail ? easDetail + " · " : ""}schema "${eas.schema}"`;
  } else if (easHttp != null && easHttp !== 200) {
    easDetail = `${easDetail ? easDetail + " · " : ""}interop/eas-root-attestations.json HTTP ${easHttp} — state read from the witness sidecar`;
  }
  easLinks.push({ href: "https://base.easscan.org/", label: "base.easscan.org" });

  // XRPL memo
  const xrplState = String(xrpl.status ?? (w ? "" : missing));
  const xrplDetail = typeof xrpl.reason === "string" ? String(xrpl.reason) : "";
  const xrplLinks: RailLink[] = [];
  if (typeof xrpl.tx === "string") xrplLinks.push({ href: `https://livenet.xrpl.org/transactions/${xrpl.tx}`, label: "XRPL transaction" });

  return [
    { id: "rekor", label: "Rekor (Sigstore transparency log)", state: rekorState, tone: railTone(rekorState), detail: rekorDetailParts.join(" · "), links: rekorLinks },
    { id: "ots", label: "OpenTimestamps (Bitcoin)", state: otsState, tone: railTone(otsState), detail: typeof ots.note === "string" ? String(ots.note) : "", links: otsLinks },
    { id: "eas_base", label: "EAS on Base", state: easState, tone: railTone(easState), detail: easDetail, links: easLinks },
    { id: "xrpl_memo", label: "XRPL memo", state: xrplState, tone: railTone(xrplState), detail: xrplDetail, links: xrplLinks },
  ];
}

/* ------------------------------------------------------------------ search */

export type Query = { kind: "hex64"; value: string } | { kind: "empty" } | { kind: "invalid"; reason: string };

/** A card id and a leaf sha256 are both 64 hex chars; the pane runs both lookups. */
export function classifyQuery(raw: string): Query {
  const q = (raw || "").trim().toLowerCase().replace(/^0x/, "").replace(/^sha256:/, "");
  if (!q) return { kind: "empty" };
  if (HEX64.test(q)) return { kind: "hex64", value: q };
  if (/^[0-9a-f]+$/.test(q)) return { kind: "invalid", reason: `${q.length} hex characters — a sha256 or card id is exactly 64.` };
  return { kind: "invalid", reason: "Not a sha256 or card id (64 hex characters)." };
}

/* ------------------------------------------------------------------- lists */

export function latestSignedCards(index: CardIndexDoc | null, n = 8): CardIndexRow[] {
  const rows = index && Array.isArray(index.cards) ? index.cards.filter((c) => c && typeof c.card === "string") : [];
  return [...rows].sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? ""))).slice(0, n);
}

export function latestCorrections(doc: CorrectionsDoc | null, n?: number): Correction[] {
  const rows = doc && Array.isArray(doc.corrections) ? doc.corrections.filter((c) => c && typeof c.id === "string") : [];
  const sorted = [...rows].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || String(b.id).localeCompare(String(a.id)));
  return typeof n === "number" ? sorted.slice(0, n) : sorted;
}

/** The ledger's own declared signature state, verbatim — STALE today, and it says so itself. */
export function ledgerSignatureState(doc: CorrectionsDoc | null): string {
  if (!doc) return "not read";
  return typeof doc.signature_state === "string" && doc.signature_state ? doc.signature_state : "not declared";
}

/* ------------------------------------------------------- how-to-verify links */

export const HOW_TO_VERIFY: RailLink[] = [
  { href: "/signed/HOW-TO-VERIFY-ROOT.md", label: "HOW-TO-VERIFY-ROOT.md — signature, Rekor, OTS, offline" },
  { href: "/signed/HOW-TO-VERIFY.md", label: "HOW-TO-VERIFY.md — a signed measurement card" },
  { href: "/signed/verify-card.mjs", label: "verify-card.mjs — the published Node verifier" },
  { href: "/root.json", label: "root.json — the one signed root" },
  { href: "/interop/root-witness-latest.json", label: "root-witness-latest.json — the witness sidecar" },
  { href: "/interop/root-witness-pointer.json", label: "root-witness-pointer.json — drift: witnessed bytes vs live bytes" },
  { href: "/api/proof?sha=", label: "GET /api/proof?sha=<64-hex> — one free inclusion proof" },
  { href: "/api/corrections", label: "GET /api/corrections — the appended-only ledger" },
  { href: "/.well-known/did.json", label: "did.json — the published keys" },
];
