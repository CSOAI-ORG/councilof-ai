/**
 * homeReads — the live reads the rebuilt home page makes, and the pure readers over them.
 *
 * WHY THIS FILE. Every figure on the front door is read at render time from the endpoint that
 * owns it. Nothing here types a count, a date or a state. A read that has not landed renders as
 * "—"; a read that failed renders the failure in words with its reason. Absence is never zero.
 *
 * Every reader below is pure and takes the payload as an argument, so a test can pin what the
 * page will say about a given payload without a network, and every component that uses one
 * accepts the same payload as an injected prop.
 */

export type ReadState<T> =
  | { kind: "loading" }
  | { kind: "ready"; payload: T }
  | { kind: "failed"; reason: string };

/* ── /api/state ──────────────────────────────────────────────────────────── */

export interface StatePayload {
  card_chain?: {
    bodies_verified_valid?: { value?: number; kind?: string; note?: string };
    bodies_published?: { value?: number; kind?: string };
  };
  public_root?: { card_count?: { value?: number; kind?: string; as_of?: string } };
  signed_cards?: {
    corpus_relation?: {
      relationship?: string;
      public_root_leaves?: number;
      separately_indexed_signed_cards?: number;
      identifier_overlap?: number;
    };
  };
  [k: string]: unknown;
}

/**
 * The signed card index, corpus 3 of three. Named, never added to the other two.
 * `kind` is printed beside the number because "catalogued" and "measured" are different facts.
 */
export function signedCardsVerified(s: StatePayload | null): { value: number; kind: string } | null {
  const v = s?.card_chain?.bodies_verified_valid;
  return typeof v?.value === "number" ? { value: v.value, kind: String(v.kind ?? "unstated") } : null;
}

/** The public root's leaf count — a DIFFERENT corpus from the signed card index. Never summed. */
export function rootLeafCount(s: StatePayload | null): number | null {
  const v = s?.public_root?.card_count?.value;
  return typeof v === "number" ? v : null;
}

/** The overlap between the two corpora, as the estate's own validator records it. */
export function corpusOverlap(s: StatePayload | null): number | null {
  const v = s?.signed_cards?.corpus_relation?.identifier_overlap;
  return typeof v === "number" ? v : null;
}

/* ── /root.json ──────────────────────────────────────────────────────────── */

export interface RootPayload {
  as_of?: string;
  card_count?: number;
  merkle_root?: string;
  did_intended?: string;
  sig_ed25519?: string;
  [k: string]: unknown;
}

export function rootSummary(
  r: RootPayload | null,
): { asOf: string; leaves: number; root: string; signed: boolean } | null {
  if (!r || typeof r.merkle_root !== "string" || typeof r.card_count !== "number") return null;
  return {
    asOf: typeof r.as_of === "string" ? r.as_of : "not published",
    leaves: r.card_count,
    root: r.merkle_root,
    signed: typeof r.sig_ed25519 === "string" && r.sig_ed25519.length > 0,
  };
}

/** A merkle root, shortened for a line of prose. The full value stays in the title attribute. */
export function shortRoot(root: string): string {
  return root.length > 16 ? `${root.slice(0, 8)}…${root.slice(-8)}` : root;
}

/* ── /api/corrections ────────────────────────────────────────────────────── */

export interface CorrectionsPayload {
  corrections?: { id: string; date?: string; what_was_wrong?: string }[];
  signature_state?: string;
  note?: string;
  [k: string]: unknown;
}

/**
 * The corrections ledger, counted from the rows the endpoint served — never from a declared
 * total, and never from this file. `signatureState` is printed as served: a STALE signature is a
 * published defect and saying so is the point of the ledger.
 */
export function correctionsSummary(
  c: CorrectionsPayload | null,
): { entries: number; signatureState: string; latest: { id: string; date: string }[] } | null {
  if (!c || !Array.isArray(c.corrections)) return null;
  const rows = c.corrections;
  return {
    entries: rows.length,
    signatureState: typeof c.signature_state === "string" ? c.signature_state : "not published",
    latest: rows
      .slice(-3)
      .reverse()
      .map((r) => ({ id: String(r.id), date: String(r.date ?? "undated") })),
  };
}

/* ── /api/pop/<id>?preview=1 ─────────────────────────────────────────────── */

/** The free preview every metered population door serves. Flat, by the door's own schema. */
export interface PopPreview {
  id?: string;
  title?: string;
  population?: string;
  state?: string;
  n?: number | null;
  n_unit?: string;
  as_of?: string;
  reason?: string | null;
  head?: Record<string, unknown>;
  [k: string]: unknown;
}

export const POPULATION_DOORS = [
  "stablecoins",
  "swift",
  "xrpl",
  "x402-bazaar",
  "mcp-registry",
  "a2a",
  "ots-proofs",
  "layer0",
  "corrections",
  "claim-watch",
] as const;

export type PopulationDoorId = (typeof POPULATION_DOORS)[number];

export interface DoorLine {
  id: string;
  title: string;
  /** The count the door's own artifact carries, formatted — or the word for why there is none. */
  figure: string;
  /** Whether `figure` is a number the door published, or an absence. */
  hasFigure: boolean;
  unit: string;
  state: string;
  asOf: string;
  href: string;
}

const nf = new Intl.NumberFormat("en-GB");

/**
 * One door, read into one line. A door that publishes no total (the Bazaar door refuses one,
 * because its two index frames overlap) says so in words rather than showing a number that would
 * be a sum of overlapping frames. Ten doors are ten separate populations: they are listed, never
 * added.
 */
export function doorLine(id: string, p: PopPreview | null, reason?: string): DoorLine {
  const href = `/api/pop/${id}?preview=1`;
  if (!p) {
    return {
      id,
      title: id,
      figure: reason ? "unread" : "—",
      hasFigure: false,
      unit: reason ?? "reading the door",
      state: reason ? "UNREAD" : "reading",
      asOf: "—",
      href,
    };
  }
  const n = typeof p.n === "number" && Number.isFinite(p.n) ? p.n : null;
  return {
    id,
    title: typeof p.title === "string" && p.title ? p.title : id,
    figure: n === null ? "no total published" : nf.format(n),
    hasFigure: n !== null,
    unit: typeof p.n_unit === "string" ? p.n_unit : "",
    state: typeof p.state === "string" ? p.state : "not published",
    asOf: typeof p.as_of === "string" ? p.as_of : "not published",
    href,
  };
}

/**
 * The OpenTimestamps door's own split, read from its artifact head. A calendar-pending proof is a
 * SUBMISSION, not a time: the two are reported separately and the pending one is never called
 * anchored.
 */
export function otsSplit(p: PopPreview | null): { attested: number; pending: number; total: number } | null {
  const head = p?.head as { declared_counts?: Record<string, unknown> } | undefined;
  const d = head?.declared_counts;
  if (!d) return null;
  const a = d.bitcoin_attested;
  const c = d.calendar_pending;
  const t = d.proofs;
  if (typeof a !== "number" || typeof c !== "number" || typeof t !== "number") return null;
  return { attested: a, pending: c, total: t };
}

/* ── /.well-known/x402.json ──────────────────────────────────────────────── */

export interface X402Manifest {
  one_line?: string;
  resources?: { url?: string; description?: string; amount?: string | null }[];
  mcp?: { url?: string; free_tools?: string[]; paid_tools?: string[]; transport?: string };
  [k: string]: unknown;
}

/**
 * What the manifest says about itself: how many doors it publishes, and how the MCP tool surface
 * splits between free and metered. Counted from the arrays the manifest serves, never declared.
 */
export function manifestSummary(
  m: X402Manifest | null,
): { doors: number; freeTools: number; paidTools: number; mcpUrl: string | null } | null {
  if (!m || !Array.isArray(m.resources)) return null;
  const free = Array.isArray(m.mcp?.free_tools) ? m.mcp!.free_tools!.length : 0;
  const paid = Array.isArray(m.mcp?.paid_tools) ? m.mcp!.paid_tools!.length : 0;
  return {
    doors: m.resources.length,
    freeTools: free,
    paidTools: paid,
    mcpUrl: typeof m.mcp?.url === "string" ? m.mcp!.url! : null,
  };
}
