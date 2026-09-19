/** First-party Services display projection, not payment verification or a liveness check.
 * Group names are presentation policy. Resources remain source-derived; invalid and duplicate
 * rows are withheld with explicit coverage. A zero declaration is not a permanent promise.
 */
export type GroupId =
  | "finance-rwa"
  | "compliance"
  | "model-measurement"
  | "agent-rails"
  | "legacy-systems";

export interface ServiceGroup {
  id: GroupId;
  title: string;
  /** What the group measures, in one sentence. Never a sales line. */
  measures: string;
}

/** The five groups, in the order the section renders them. */
export const GROUPS: ServiceGroup[] = [
  {
    id: "finance-rwa",
    title: "Finance & RWA",
    measures: "On-chain evidence for tokenised real-world assets, read from public ledgers.",
  },
  {
    id: "compliance",
    title: "Compliance",
    measures: "Evidence assembled against a named obligation — the obligation is cited, never inferred.",
  },
  {
    id: "model-measurement",
    title: "Model measurement",
    measures: "What a model did on a frozen bank, and the signed card behind it.",
  },
  {
    id: "agent-rails",
    title: "Agent rails",
    measures: "The machine doors an agent uses to pay, prove and settle.",
  },
  {
    id: "legacy-systems",
    title: "Legacy systems",
    measures: "Evidence drawn from systems that predate the rails, on their own terms.",
  },
];

/** Path → group. Ordered: the first matching prefix wins. */
const ROUTES: ReadonlyArray<[string, GroupId]> = [
  ["/api/rwa/", "finance-rwa"],
  ["/api/evidence-bundle", "compliance"],
  ["/api/art50/", "compliance"],
  ["/api/eunomia-data", "compliance"],
  ["/api/request-attestation", "model-measurement"],
  ["/api/feeds/provider-diff", "model-measurement"],
  ["/api/proof", "model-measurement"],
  ["/api/free-door", "agent-rails"],
  ["/api/receipts/", "agent-rails"],
  ["/api/cobol", "legacy-systems"],
  ["/api/swift", "legacy-systems"],
];


const DEFAULT_ORIGIN = "https://councilof.ai";
const MAX_ROWS = 1000;
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 4096): v is string => typeof v === "string" && v.length <= max;
const optionalText = (v: unknown) => v === undefined || v === null || text(v);
/** Preserve the original URL text, but permit navigable links only to this catalogue's origin. */
function firstPartyUrl(value: unknown, origin: string): value is string {
  if (!text(value) || !value || /[\x00-\x20\x7f\\]/.test(value)) return false;
  if (!value.startsWith("/") && !/^https:\/\//i.test(value)) return false;
  if (value.startsWith("//")) return false;
  try {
    const base = new URL(origin); const url = new URL(value, base);
    return base.protocol === "https:" && url.protocol === "https:" && url.origin === base.origin && !url.username && !url.password && !url.hash;
  } catch { return false; }
}
export function pathOf(url: string): string {
  try { return new URL(url, DEFAULT_ORIGIN).pathname; } catch { return ""; }
}
export function groupFor(url: string, origin = DEFAULT_ORIGIN): GroupId | null {
  if (!firstPartyUrl(url, origin)) return null;
  const path = pathOf(url);
  for (const [prefix, id] of ROUTES) {
    if (prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix) return id;
  }
  return null;
}
export interface ManifestResource {
  method?: string;
  url: string;
  description?: string | null;
  paid_for?: string | null;
  amount?: string | number | null;
  note?: string | null;
  free_preview?: string | null;
  indexed_in?: string | string[] | null;
}
function identity(value: unknown, origin: string): string | null {
  if (!record(value) || !firstPartyUrl(value.url, origin)) return null;
  const method = value.method === undefined ? "GET" : value.method;
  if (!text(method, 20) || !/^[A-Z]+$/.test(method)) return null;
  return method + " " + new URL(value.url, origin).href;
}
function usable(value: unknown, origin: string): value is ManifestResource {
  if (!record(value) || identity(value, origin) === null) return false;
  if (![value.description, value.note, value.paid_for].every(optionalText)) return false;
  if (value.free_preview !== undefined && value.free_preview !== null && !firstPartyUrl(value.free_preview, origin)) return false;
  const a = value.amount;
  return a === undefined || a === null || (typeof a === "number" && Number.isSafeInteger(a) && a >= 0) || (text(a, 100) && /^\d+$/.test(a));
}
export interface ServiceCard {
  id: string;
  url: string;
  path: string;
  displayPath: string;
  method: string;
  group: GroupId;
  /** Source-reported description, not a verified performance claim. */
  measures: string;
  freePreview: string | null;
  zeroAmountDeclared: boolean;
  payLine: string;
}
const PAY_LINE = "Pay-as-you-go x402 at the 402.";
export function toCard(r: ManifestResource, group: GroupId, origin = DEFAULT_ORIGIN): ServiceCard {
  if (!usable(r, origin)) throw new TypeError("UNREADABLE_RESOURCE_RECORD");
  const zero = r.amount === 0 || r.amount === "0";
  const url = new URL(r.url, origin);
  return {
    id: identity(r, origin)!, url: r.url, path: url.pathname, displayPath: url.pathname + url.search,
    method: r.method ?? "GET", group,
    measures: r.description?.trim() || r.note?.trim() || (r.paid_for?.trim() ? `Paid for ${r.paid_for.trim()}.` : "Purpose not supplied by the manifest."),
    freePreview: r.free_preview ?? null, zeroAmountDeclared: zero,
    payLine: zero ? "Zero amount declared in this manifest. Check the current response before proceeding." : PAY_LINE,
  };
}
export interface Catalogue {
  groups: { group: ServiceGroup; cards: ServiceCard[] }[];
  ungrouped: string[];
  /** Number of source rows, not independent services or a reachable-service census. */
  total: number | null;
  displayed: number;
  withheld: number;
  coverage: "COMPLETE" | "PARTIAL" | "UNREADABLE";
  source: string;
  mode: string | null;
}
export function buildCatalogue(manifest: unknown, origin = DEFAULT_ORIGIN): Catalogue {
  const result: Catalogue = {groups: GROUPS.map(group => ({group, cards: []})), ungrouped: [], total: null,
    displayed: 0, withheld: 0, coverage: "UNREADABLE", source: "/.well-known/x402.json", mode: null};
  if (!record(manifest) || !Array.isArray(manifest.resources) || manifest.resources.length > MAX_ROWS) return result;
  if (manifest.mode !== undefined && manifest.mode !== null && !text(manifest.mode, 200)) return result;
  result.total = manifest.resources.length;
  result.mode = typeof manifest.mode === "string" && manifest.mode.trim() ? manifest.mode : null;
  const rows: unknown[] = manifest.resources;
  const counts = new Map<string, number>();
  for (const row of rows) { const id = identity(row, origin); if (id !== null) counts.set(id, (counts.get(id) ?? 0) + 1); }
  for (const row of rows) {
    const id = identity(row, origin);
    if (!usable(row, origin) || id === null || counts.get(id) !== 1) { result.withheld++; continue; }
    const group = groupFor(row.url, origin);
    if (!group) { result.ungrouped.push((row.method ?? "GET") + " " + new URL(row.url, origin).pathname + new URL(row.url, origin).search); continue; }
    result.groups.find(g => g.group.id === group)!.cards.push(toCard(row, group, origin));
    result.displayed++;
  }
  result.coverage = result.withheld || result.ungrouped.length ? "PARTIAL" : "COMPLETE";
  return result;
}
