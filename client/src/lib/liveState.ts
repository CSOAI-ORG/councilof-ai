/**
 * liveState — reads GET /api/state, the endpoint that exists to be quoted.
 *
 * That payload states its own contract, and this file obeys it rather than
 * restating it:
 *
 *   contract.quote_this
 *     "Every count a lane publishes must come from this endpoint, by field name."
 *   contract.not_here_not_established
 *     "If a number is not in this payload, it is NOT established."
 *   contract.kinds_rule
 *     "These are never collapsed and never summed together."
 *
 * So there is NO total anywhere in this file. Every figure keeps the `kind` the
 * endpoint gave it (declared / catalogued / measured / ...), because collapsing
 * a catalogue entry and a verified measurement into one number is precisely the
 * defect the three card corpora already taught this estate (council-os/CARD-CORPORA.md).
 *
 * An absent field renders as absent. It never becomes 0 — "0 signed cards" is a
 * claim, and a different one from "we did not read the signed-card count".
 *
 * Measured 2026-09-06: schema csoai.live-state/1, 11 reported domains.
 */

/** One quotable figure, exactly as /api/state shapes it. */
export interface StateCell {
  /** Dotted path, e.g. "board.measured_axes" — the name a lane must quote. */
  field: string;
  label: string;
  value: string;
  /** declared | catalogued | measured | ... Never collapsed across cells. */
  kind: string | null;
  as_of: string | null;
  /** The key the as_of was read OUT OF, per contract.freshness. */
  as_of_field: string | null;
  source: string | null;
  note: string | null;
}

export interface StateSection {
  id: string;
  title: string;
  /** The committed artifact the section speaks for. */
  authority: string | null;
  live_endpoint: string | null;
  cells: StateCell[];
  /** Sentences the payload carries to stop a reader conflating things. */
  cautions: string[];
}

/** Something the endpoint deliberately refuses to speak for, and why. */
export interface NotCovered {
  subject: string;
  why_not: string | null;
}

export type StateRead =
  | {
      state: "live";
      schema: string | null;
      sections: StateSection[];
      notCovered: NotCovered[];
      doctrine: string | null;
    }
  | { state: "unread"; reason: string };

/** A cell in /api/state is an object carrying `value`. Anything else is not one. */
function isCell(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && "value" in (v as object);
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

/** Sentences the payload writes to prevent a misreading. Rendered, never dropped. */
const CAUTION_KEYS = [
  "caveat",
  "never_sum",
  "never_conflate",
  "floor_note",
  "kinds_rule",
  "no_timestamp_note",
  "rail_honesty",
  "undeclared_note",
  "index_relationship",
  "status_vocabulary",
  "complete_reason",
  "how_to_challenge",
];

const TITLES: Record<string, string> = {
  board: "The board",
  signed_cards: "Signed card index",
  card_chain: "Card chain",
  public_root: "Public root",
  claims_register: "Claims register",
  rwa_instruments: "RWA instruments",
  mcp_fleet: "MCP fleet",
  council_http_mcp: "Council MCP door",
  hub_census: "Hub census",
  public_count: "Public count",
};

/** Sections in render order. Anything else the payload adds is appended, never dropped. */
const ORDER = [
  "board",
  "signed_cards",
  "card_chain",
  "public_root",
  "claims_register",
  "rwa_instruments",
  "mcp_fleet",
  "council_http_mcp",
  "hub_census",
];

const SKIP = new Set(["schema", "title", "contract", "not_covered", "doctrine", "public_count"]);

export function readState(doc: unknown): StateRead {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return { state: "unread", reason: "no document" };
  }
  const root = doc as Record<string, unknown>;

  const sections: StateSection[] = [];
  const keys = Object.keys(root).filter((k) => !SKIP.has(k) && !!root[k] && typeof root[k] === "object");
  keys.sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib);
  });

  for (const key of keys) {
    const raw = root[key] as Record<string, unknown>;
    const cells: StateCell[] = [];
    const cautions: string[] = [];

    for (const [k, v] of Object.entries(raw)) {
      if (isCell(v)) {
        cells.push({
          field: `${key}.${k}`,
          label: k.replace(/_/g, " "),
          value: str(v.value) ?? "—",
          kind: str(v.kind),
          as_of: str(v.as_of),
          as_of_field: str(v.as_of_field),
          source: str(v.source) ?? str(v.authority),
          note: str(v.note),
        });
      } else if (CAUTION_KEYS.includes(k)) {
        const s = str(v);
        if (s) cautions.push(s);
      }
    }

    // A section with no quotable cell is not rendered as an empty shell — there
    // is nothing established to show, and an empty card reads as a zero.
    if (!cells.length) continue;

    sections.push({
      id: key,
      title: TITLES[key] ?? key.replace(/_/g, " "),
      authority: str(raw.authority),
      live_endpoint: str(raw.live_endpoint),
      cells,
      cautions,
    });
  }

  if (!sections.length) return { state: "unread", reason: "no quotable fields" };

  const notCoveredRaw = (root.not_covered as Record<string, unknown> | undefined)?.items;
  const notCovered: NotCovered[] = Array.isArray(notCoveredRaw)
    ? notCoveredRaw
        .map((i) => {
          if (typeof i === "string") return { subject: i, why_not: null };
          const o = i as Record<string, unknown>;
          const subject = str(o?.subject);
          return subject ? { subject, why_not: str(o?.why_not) } : null;
        })
        .filter((x): x is NotCovered => !!x)
    : [];

  return {
    state: "live",
    schema: str(root.schema),
    sections,
    notCovered,
    doctrine: str((root.doctrine as Record<string, unknown> | undefined)?.one_line),
  };
}

/** The headline sentence — quoted verbatim from public_count, never rebuilt. */
export function headline(doc: unknown): StateCell | null {
  const pc = (doc as Record<string, unknown> | null)?.public_count;
  if (!isCell(pc)) return null;
  return {
    field: "public_count",
    label: "public count",
    value: str(pc.value) ?? "—",
    kind: str(pc.kind),
    as_of: str(pc.as_of),
    as_of_field: str(pc.as_of_field),
    source: str(pc.source),
    note: str(pc.note),
  };
}
