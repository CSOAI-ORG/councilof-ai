/**
 * servicesCatalogue — the Services section, read from /.well-known/x402.json.
 *
 * NEVER A TYPED LIST. The doors, their URLs, their free previews and whether they are paid at
 * all come from the rail's own manifest at run time. If a door is added there it appears here;
 * if one is withdrawn it disappears. Nothing about a door is restated in this file.
 *
 * THE ONE THING THAT IS NOT IN THE MANIFEST is the grouping. `/.well-known/x402.json` carries
 * no category field — the union of keys across its resources is
 * {amount, free_preview, indexed_in, method, note, paid_for, url} — so the section's five
 * groups have to be decided from each door's own path.
 *
 * That mapping is the risk, so it is built to fail loudly rather than quietly:
 * `groupFor()` returns null for a path it does not recognise, `buildCatalogue()` collects those
 * into `ungrouped`, and the test asserts `ungrouped` is empty against the LIVE nine. Add a
 * tenth door to the rail and the test goes red naming it — instead of the door silently never
 * appearing on the page, which is the failure mode this whole section exists to avoid.
 *
 * The better home for this is the producer that writes /.well-known/x402.json. Until a
 * category lands there, this is the mapping, in one place, tested. Filed as an owner-ask.
 *
 * Measured 2026-09-06: 9 resources, mode "live", network eip155:8453.
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

/** The path part of a manifest url, without host or query. */
export function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return (url.split("?")[0] || "").replace(/^https?:\/\/[^/]+/, "");
  }
}

export function groupFor(url: string): GroupId | null {
  const path = pathOf(url);
  for (const [prefix, id] of ROUTES) if (path.startsWith(prefix)) return id;
  return null;
}

export interface ManifestResource {
  method?: string;
  url: string;
  paid_for?: string | null;
  amount?: string | number | null;
  note?: string | null;
  free_preview?: string | null;
  indexed_in?: string | null;
}

export interface ServiceCard {
  url: string;
  path: string;
  method: string;
  group: GroupId;
  /** From the manifest's own paid_for/note — never written here. */
  measures: string;
  freePreview: string | null;
  /** True only when the manifest itself says the amount is zero. */
  freeForever: boolean;
  payLine: string;
}

const PAY_LINE = "Pay-as-you-go x402 at the 402.";

export function toCard(r: ManifestResource, group: GroupId): ServiceCard {
  const zero = r.amount === 0 || r.amount === "0";
  return {
    url: r.url,
    path: pathOf(r.url),
    method: r.method || "GET",
    group,
    measures: r.note?.trim() || (r.paid_for ? `Paid for ${r.paid_for}.` : "Free forever."),
    freePreview: r.free_preview ?? null,
    freeForever: zero,
    payLine: zero ? "Free forever — it settles and charges nothing." : PAY_LINE,
  };
}

export interface Catalogue {
  groups: { group: ServiceGroup; cards: ServiceCard[] }[];
  /** Doors the mapping did not recognise. Must be empty; the test enforces it. */
  ungrouped: string[];
  total: number;
  source: string;
  mode: string | null;
}

export function buildCatalogue(manifest: unknown): Catalogue {
  const doc = (manifest ?? {}) as Record<string, unknown>;
  const resources = Array.isArray(doc.resources) ? (doc.resources as ManifestResource[]) : [];
  const ungrouped: string[] = [];
  const byGroup = new Map<GroupId, ServiceCard[]>();

  for (const r of resources) {
    if (!r || typeof r.url !== "string") continue;
    const g = groupFor(r.url);
    if (!g) {
      ungrouped.push(pathOf(r.url));
      continue;
    }
    const list = byGroup.get(g) ?? [];
    list.push(toCard(r, g));
    byGroup.set(g, list);
  }

  return {
    groups: GROUPS.map((group) => ({ group, cards: byGroup.get(group.id) ?? [] })),
    ungrouped,
    total: resources.length,
    source: "/.well-known/x402.json",
    mode: typeof doc.mode === "string" ? doc.mode : null,
  };
}
