/**
 * One address per frozen provision: what the ?provision=<provision_id> door of /api/evidence-bundle
 * and the provision MCP tools read.
 *
 * Every value is read from committed bytes, never typed here:
 *   - the frozen manifest (public/interop/frozen-provision-hashes.json): which ids exist, and their hashes;
 *   - the coverage report (public/mechanism/coverage.json, built by scripts/mechanism/build-coverage.mjs):
 *     the ladder state of each provision (PREDICATE, RELATED_MEASURE, CROSSWALK_ONLY, HASH_ONLY), its
 *     predicates, related axes and crosswalk rows, and which published capsules carry a binding;
 *   - the backfill map (public/mechanism/capsule-provision-map.json): which adapter or evidence kind may
 *     cite a provision, and which provisions each existing obligation id (article-50, article-53, dora,
 *     cra) stands for.
 * A ladder state says what tests a provision today. It is never a finding that anyone complies with it.
 */
import COVERAGE from "../../public/mechanism/coverage.json";
import MAP from "../../public/mechanism/capsule-provision-map.json";
import { frozenManifest, PROVISION_ID_RE } from "../_lib/provisionBinding";
import { OBLIGATIONS, resolveObligation, type Obligation } from "./_obligations";

export const LADDER = ["PREDICATE", "RELATED_MEASURE", "CROSSWALK_ONLY", "HASH_ONLY"] as const;
export type Ladder = (typeof LADDER)[number];

type Json = Record<string, unknown>;
type Touched = {
  provision_id: string;
  status: string;
  predicates: string[];
  related_axes: string[];
  crosswalk_rows: unknown[];
};
type Predicate = { id: string; name: string; scope: string; provision_id: string; free_route?: string; binding_today?: string };
type CapsuleAdapter = { batch: string; adapter: string; kind: string; provision_ids_bound: string[]; provision_ids_bound_by_sidecar?: string[]; record: string };
type Mapping = { source: string; kind: string; code: string; predicate: string; provision_id: string; relation: string; scope: string; capsule_state: string };
type Alias = { celex: string; provisions: string[]; derived_from: string; note?: string };

const coverage = COVERAGE as unknown as {
  corpus: Json & { corpus_root: string; source_database_state: string; source_texts?: { path: string } | null };
  instruments: { celex: string; name: string; source_url: string }[];
  provisions_touched: Touched[];
  predicates: Predicate[];
  capsule_adapters: CapsuleAdapter[];
};
const map = MAP as unknown as { mappings: Mapping[]; obligation_aliases: Record<string, Alias>; corpus_root: string };

const touched = new Map(coverage.provisions_touched.map((p) => [p.provision_id, p]));
const instruments = new Map(coverage.instruments.map((i) => [i.celex, i]));

/** The obligation id whose alias list holds this provision, if any (first in OBLIGATIONS order). */
export function obligationForProvision(provisionId: string): Obligation | null {
  for (const [id, a] of Object.entries(map.obligation_aliases)) if (a.provisions.includes(provisionId)) return OBLIGATIONS[id] ?? null;
  return null;
}

export type Resolved = {
  /** "provision" when an id was given, "obligation_alias" when an existing obligation id was. */
  via: "provision" | "obligation_alias";
  provision_ids: string[];
  obligation: Obligation | null;
  alias_note: string | null;
};

/**
 * A provision id of the frozen manifest, or an existing obligation id as an alias. Anything else is
 * null, including a well-formed id the manifest does not hold.
 */
export function resolveProvision(raw: string): Resolved | null {
  const k = (raw || "").trim();
  if (!k) return null;
  if (PROVISION_ID_RE.test(k)) {
    if (!frozenManifest().anchors[k]) return null;
    return { via: "provision", provision_ids: [k], obligation: obligationForProvision(k), alias_note: null };
  }
  const ob = resolveObligation(k);
  if (!ob) return null;
  const alias = map.obligation_aliases[ob.id];
  return { via: "obligation_alias", provision_ids: alias ? [...alias.provisions] : [], obligation: ob, alias_note: alias?.note ?? null };
}

/** Ladder state and bindings of ONE provision of the manifest, read from the committed data. */
export function provisionRecord(provisionId: string, origin: string): Json {
  const manifest = frozenManifest();
  const anchor = manifest.anchors[provisionId];
  if (!anchor) throw new Error(`${provisionId} is not in the frozen manifest`);
  const [celex, number] = provisionId.split(":");
  const t = touched.get(provisionId);
  const state = (t?.status ?? "HASH_ONLY") as Ladder;
  const predicates = coverage.predicates
    .filter((p) => p.provision_id === provisionId)
    .map((p) => ({ id: p.id, name: p.name, scope: p.scope, free_route: p.free_route ? `${origin}${p.free_route}` : null }));
  const inCapsule = coverage.capsule_adapters
    .filter((a) => a.provision_ids_bound.includes(provisionId))
    .map((a) => ({ batch: a.batch, adapter: a.adapter, kind: a.kind, record: `${origin}${a.record}` }));
  const bySidecar = coverage.capsule_adapters
    .filter((a) => (a.provision_ids_bound_by_sidecar ?? []).includes(provisionId))
    .map((a) => ({ batch: a.batch, adapter: a.adapter, kind: a.kind, record: `${origin}${a.record}`, bindings: `${origin}/mechanism/capsule-provision-bindings.json` }));
  const viaMap = map.mappings
    .filter((m) => m.provision_id === provisionId)
    .map((m) => ({ source: m.source, kind: m.kind, predicate: m.predicate, relation: m.relation, scope: m.scope, capsule_state: m.capsule_state }));
  const inst = instruments.get(celex);
  return {
    provision_id: provisionId,
    provision_sha256: anchor,
    instrument: inst?.name ?? null,
    celex,
    number,
    kind: number.startsWith("-") ? "annex" : "article",
    official_source: inst?.source_url ?? null,
    ladder_state: state,
    predicates,
    related_axes: t?.related_axes ?? [],
    crosswalk_rows: t?.crosswalk_rows.length ?? 0,
    bound_capsules: {
      in_capsule: inCapsule,
      by_sidecar: bySidecar,
      via_map: viaMap,
      note: "in_capsule lists published capsule batches whose capsules carry this provision in their provisions binding. by_sidecar lists published batches whose capsules the sidecar binds to it without changing their signed bytes. via_map lists the evidence kinds the backfill map lets cite it; a mapped kind is not a published capsule.",
    },
  };
}

export const CORPUS_VIEW = (origin: string) => ({
  manifest: `${origin}/interop/frozen-provision-hashes.json`,
  corpus_root: coverage.corpus.corpus_root,
  source_bytes: coverage.corpus.source_database_state,
  source_texts: coverage.corpus.source_texts ? `${origin}${coverage.corpus.source_texts.path}` : null,
  coverage: `${origin}/mechanism/coverage.json`,
  map: `${origin}/mechanism/capsule-provision-map.json`,
  capsule_bindings: `${origin}/mechanism/capsule-provision-bindings.json`,
});

/** The free provision view the door and the tools share. */
export function provisionView(r: Resolved, origin: string): Json {
  return {
    requested_via: r.via,
    obligation_id: r.obligation?.id ?? null,
    provisions: r.provision_ids.map((id) => provisionRecord(id, origin)),
    ...(r.alias_note ? { alias_note: r.alias_note } : {}),
    ladder: [...LADDER],
    ladder_meaning:
      "PREDICATE: a deterministic check of one observable the provision names exists. RELATED_MEASURE: a measured axis points to it. CROSSWALK_ONLY: only crosswalk rows reference it. HASH_ONLY: it is an identifier and a hash that nothing tests.",
    corpus: CORPUS_VIEW(origin),
    relation: "what tests a provision today — never a finding that anyone complies with it",
  };
}

export const PROVISION_USAGE =
  "GET /api/evidence-bundle?provision=<CELEX:number> (for example 32024R1689:50), or an existing obligation id (article-50, article-53, dora, cra) as an alias";
