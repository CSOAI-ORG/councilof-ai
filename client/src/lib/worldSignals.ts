/**
 * World Signals — read-only, data-origin-preserving *views*.
 *
 * This is not another event ledger, incident intake, MEOK runtime or signature
 * verifier. Public corrections, fabric rails and oversight state retain their
 * original source and never become an independently observed real-world effect.
 * No private challenges, identities, or proposed action text are ingested.
 */
export const SIGNAL_SOURCES = Object.freeze({
  corrections: "/api/corrections",
  fabric: "/api/fabric",
  oversight: "/api/hitl",
});

type Obj = Record<string, unknown>;
const record = (v: unknown): Obj | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? v as Obj : null;
const plain = (v: unknown, length = 260): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, length) : null;
const count = (v: unknown): number | null =>
  Number.isSafeInteger(v) && typeof v === "number" && v >= 0 && v <= 100000 ? v : null;
const date = (v: unknown): string | null => {
  const s = plain(v, 64);
  return s && /^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?$/.test(s) &&
    !Number.isNaN(Date.parse(s)) ? s : null;
};
const id = (v: unknown): string | null => {
  const s = plain(v, 90);
  return s && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,89}$/.test(s) ? s : null;
};
const safePath = (v: unknown): string | null =>
  typeof v === "string" && /^\/(?!\/)[a-zA-Z0-9/._#?-]{1,240}$/.test(v) ? v : null;

export type CorrectionSignal = {
  id: string;
  date: string;
  publishedAt: string | null;
  error: string;
  change: string;
  state: string;
  source: typeof SIGNAL_SOURCES.corrections;
  geo: null;
  evidenceState: "SOURCE_REPORTED";
};
export type CorrectionView = {
  source: typeof SIGNAL_SOURCES.corrections;
  signatureClaim: string;
  items: CorrectionSignal[];
};
export type FabricSignal = {
  id: string;
  title: string;
  role: string;
  state: "RUNTIME_OBSERVED" | "CATALOGUED" | "UNCHECKABLE" | "UNREACHABLE" | "STALE" | "SIGNED";
  source: typeof SIGNAL_SOURCES.fabric;
  destination: string | null;
  observedAt: string;
  description: string;
  writesBoard: false;
  geo: null;
  evidenceState: "SOURCE_REPORTED";
};
export type FabricView = {
  observedAt: string;
  rails: FabricSignal[];
};
export type OversightView = {
  source: typeof SIGNAL_SOURCES.oversight;
  decisionPath: "open" | "closed" | "unknown";
  storeBound: boolean | null;
  identity: string;
  humanPresence: string;
  professionalCompetence: string;
  executionAuthority: false;
  pending: number | null;
  approved: number | null;
  note: string;
};

export function parseCorrections(raw: unknown): CorrectionView {
  const doc = record(raw), entries = doc?.corrections;
  if (doc?.schema !== "csoai.corrections/0.1" || !Array.isArray(entries) || entries.length > 1000)
    throw new Error("WORLD_CORRECTIONS_UNCHECKABLE");
  const items = entries.map((rawItem: unknown): CorrectionSignal => {
    const v = record(rawItem), key = id(v?.id), when = date(v?.date);
    if (!key || !when || !key.startsWith("C-")) throw new Error("WORLD_CORRECTION_INVALID");
    const reported = plain(v?.what_was_wrong) ?? "No problem description supplied.";
    return {
      id: key, date: when, publishedAt: date(v?.published_at),
      error: reported, change: plain(v?.what_changed) ?? "No correction description supplied.",
      state: plain(v?.status, 90) ?? "NOT_REPORTED",
      source: SIGNAL_SOURCES.corrections, geo: null, evidenceState: "SOURCE_REPORTED",
    };
  });
  if (new Set(items.map(x => x.id)).size !== items.length) throw new Error("WORLD_CORRECTIONS_DUPLICATE");
  return {
    source: SIGNAL_SOURCES.corrections,
    signatureClaim: plain(doc.signature_state, 90) ?? "NOT_REPORTED",
    items,
  };
}

const RAIL_STATES = new Set(["RUNTIME_OBSERVED","CATALOGUED","UNCHECKABLE","UNREACHABLE","STALE","SIGNED"]);

export function parseFabric(raw: unknown): FabricView {
  const doc = record(raw), rails = doc?.rails, at = date(doc?.observed_at);
  if (doc?.schema !== "csoai.capability-fabric/0.1" || !at ||
    !Array.isArray(rails) || rails.length > 250) throw new Error("WORLD_FABRIC_UNCHECKABLE");
  const rows = rails.map((v: unknown): FabricSignal => {
    const rail = record(v), key = id(rail?.id), state = rail?.state;
    if (!rail || !key || !RAIL_STATES.has(String(state)) ||
        rail.writes_board !== false) throw new Error("WORLD_RAIL_UNCHECKABLE");
    return {
      id: key, title: plain(rail.label, 100) ?? key,
      role: plain(rail.role, 140) ?? "Role not supplied.",
      state: state as FabricSignal["state"],
      source: SIGNAL_SOURCES.fabric,
      destination: safePath(rail.endpoint),
      observedAt: date(rail.observed_at) ?? at,
      description: plain(rail.summary, 240) ?? "No observation summary supplied.",
      writesBoard: false,
      geo: null, evidenceState: "SOURCE_REPORTED",
    };
  });
  if (new Set(rows.map(x => x.id)).size !== rows.length) throw new Error("WORLD_RAIL_DUPLICATE");
  return { observedAt: at, rails: rows };
}

export function parseOversight(raw: unknown): OversightView {
  const doc = record(raw), scope = record(doc?.assessment_scope),
    q = record(doc?.review_queue_summary);
  if (doc?.schema !== "csoai.hitl-companion-state/0.1" || !scope ||
    !q || scope.execution_authority !== false) throw new Error("WORLD_OVERSIGHT_UNCHECKABLE");
  const state = doc.decision_path;
  if (state !== "open" && state !== "closed" && state !== "unknown") throw new Error("WORLD_OVERSIGHT_UNKNOWN_GATE");
  return {
    source: SIGNAL_SOURCES.oversight,
    decisionPath: state, storeBound: typeof doc.store_bound === "boolean" ? doc.store_bound : null,
    identity: plain(scope.operator_identity, 90) ?? "NOT_REPORTED",
    humanPresence: plain(scope.human_presence, 90) ?? "NOT_REPORTED",
    professionalCompetence: plain(scope.professional_competence, 90) ?? "NOT_REPORTED",
    executionAuthority: false,
    pending: count(q.PENDING), approved: count(q.APPROVED),
    note: "API records and gate configuration do not establish verified human identity or independent execution authority.",
  };
}
