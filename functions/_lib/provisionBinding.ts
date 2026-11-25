/**
 * The optional `provisions` binding on a measurement capsule, as /mechanism/ proposes it:
 * capsule schema csoai.measurement-capsule/0.3 is 0.2 plus one optional field, `provisions`, a list of
 * {provision_id, provision_sha256, corpus_root, relation} with relation PREDICATE or RELEVANT_TO, each
 * pinned to the frozen provision manifest (public/interop/frozen-provision-hashes.json). A capsule
 * without the field stays byte-for-byte a 0.2 capsule; capsule_id, JCS and Merkle rules are unchanged.
 *
 * checkProvisionBinding() answers only whether the binding is well formed and pinned to THIS manifest:
 * the id is in it, the hash is its anchor and the root is its root. It says nothing about whether the
 * capsule measures what the provision requires, and nothing about compliance with it.
 * JSON Schema for the same shape: public/measurement-capsules/capsule-provisions-0.3.schema.json.
 */
import MANIFEST from "../../public/interop/frozen-provision-hashes.json";
import MAP from "../../public/mechanism/capsule-provision-map.json";

export const PROVISION_ID_RE = /^3\d{4}[RLD]\d{4}:-?\d+$/;
export const RELATIONS = ["PREDICATE", "RELEVANT_TO"] as const;
export const BINDING_KEYS = ["provision_id", "provision_sha256", "corpus_root", "relation"] as const;
export const CAPSULE_SCHEMA_WITH_PROVISIONS = "csoai.measurement-capsule/0.3";
export const MAX_BINDINGS = 64;

export type Relation = (typeof RELATIONS)[number];
export type ProvisionBinding = { provision_id: string; provision_sha256: string; corpus_root: string; relation: Relation };
export type Manifest = { corpus_root: string; anchors: Record<string, string> };
export type BindingState = "PINNED" | "NOT_PINNED" | "MALFORMED" | "SCHEMA_MISMATCH";
export type BindingCheck = {
  state: BindingState;
  n: number;
  problems: string[];
  provisions: { provision_id: string; relation: string; pinned: boolean }[];
  manifest_corpus_root: string;
  note: string;
};

const HEX64 = /^[0-9a-f]{64}$/;
export const BINDING_NOTE =
  "A pinned binding says the capsule names this provision of this frozen manifest. It is not a finding that the capsule measures what the provision requires, and never a compliance determination.";

export const frozenManifest = (): Manifest => MANIFEST as Manifest;

export function checkProvisionBinding(value: unknown, capsuleSchema: unknown, manifest: Manifest = frozenManifest()): BindingCheck {
  const out = (state: BindingState, problems: string[], provisions: BindingCheck["provisions"] = []): BindingCheck => ({
    state,
    n: Array.isArray(value) ? value.length : 0,
    problems,
    provisions,
    manifest_corpus_root: manifest.corpus_root,
    note: BINDING_NOTE,
  });
  if (capsuleSchema !== CAPSULE_SCHEMA_WITH_PROVISIONS)
    return out("SCHEMA_MISMATCH", [`a provisions binding is defined only for ${CAPSULE_SCHEMA_WITH_PROVISIONS}, not ${String(capsuleSchema)}`]);
  if (!Array.isArray(value) || value.length === 0) return out("MALFORMED", ["provisions must be a non-empty list"]);
  if (value.length > MAX_BINDINGS) return out("MALFORMED", [`provisions holds ${value.length} entries; at most ${MAX_BINDINGS}`]);
  const shape: string[] = [];
  const pin: string[] = [];
  const seen = new Set<string>();
  const rows: BindingCheck["provisions"] = [];
  value.forEach((b, i) => {
    const at = `provisions[${i}]`;
    if (!b || typeof b !== "object" || Array.isArray(b)) return void shape.push(`${at} is not an object`);
    const o = b as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    if (keys.join() !== [...BINDING_KEYS].sort().join()) shape.push(`${at} must carry exactly ${BINDING_KEYS.join(", ")}`);
    const id = o.provision_id;
    if (typeof id !== "string" || !PROVISION_ID_RE.test(id)) return void shape.push(`${at}.provision_id is not CELEX:number`);
    if (typeof o.provision_sha256 !== "string" || !HEX64.test(o.provision_sha256)) shape.push(`${at}.provision_sha256 is not 64 lowercase hex`);
    if (typeof o.corpus_root !== "string" || !HEX64.test(o.corpus_root)) shape.push(`${at}.corpus_root is not 64 lowercase hex`);
    if (!RELATIONS.includes(o.relation as Relation)) shape.push(`${at}.relation must be ${RELATIONS.join(" or ")}`);
    const key = `${id}|${String(o.relation)}`;
    if (seen.has(key)) shape.push(`${at} repeats ${id} with relation ${String(o.relation)}`);
    seen.add(key);
    const anchor = manifest.anchors[id];
    let pinned = true;
    if (!anchor) {
      pinned = false;
      pin.push(`${at}: ${id} is not in the frozen manifest`);
    } else if (o.provision_sha256 !== anchor) {
      pinned = false;
      pin.push(`${at}: provision_sha256 is not the manifest anchor for ${id}`);
    }
    if (o.corpus_root !== manifest.corpus_root) {
      pinned = false;
      pin.push(`${at}: corpus_root is not the manifest's root`);
    }
    rows.push({ provision_id: id, relation: String(o.relation), pinned });
  });
  if (shape.length) return out("MALFORMED", [...shape, ...pin], rows);
  if (pin.length) return out("NOT_PINNED", pin, rows);
  return out("PINNED", [], rows);
}

/** A binding row for a provision of the frozen manifest, pinned to it. */
export function bindingFor(provisionId: string, relation: Relation, manifest: Manifest = frozenManifest()): ProvisionBinding {
  const anchor = manifest.anchors[provisionId];
  if (!anchor) throw new Error(`${provisionId} is not in the frozen manifest`);
  return { provision_id: provisionId, provision_sha256: anchor, corpus_root: manifest.corpus_root, relation };
}

export type ProvisionMap = {
  corpus_root: string;
  mappings: { source: string; kind: string; provision_id: string; provision_sha256: string; relation: string }[];
};

/**
 * The binding rows the committed backfill map (public/mechanism/capsule-provision-map.json) gives a producer,
 * pinned to the frozen manifest, sorted by provision id then relation. The rule is the capsule library's
 * (packages/venturi-capsule/provision_binding.py) and the sidecar producer's
 * (scripts/mechanism/backfill-capsule-provisions.mjs): a mapping with source "adapter" matches the adapter
 * name, a mapping with source "route" matches the evidence kind. An unmapped producer gets []. Throws when a
 * map row is not pinned to the manifest, so a stale map can never yield a binding.
 */
export function mapBindingsFor(
  adapter: string | null,
  kind: string,
  map: ProvisionMap = MAP as unknown as ProvisionMap,
  manifest: Manifest = frozenManifest(),
): ProvisionBinding[] {
  if (map.corpus_root !== manifest.corpus_root) throw new Error("the capsule-provision map is not pinned to the frozen manifest's root");
  const rows = new Map<string, ProvisionBinding>();
  for (const m of map.mappings) {
    if (!((m.source === "adapter" && adapter !== null && m.kind === adapter) || (m.source === "route" && m.kind === kind))) continue;
    if (manifest.anchors[m.provision_id] !== m.provision_sha256) throw new Error(`map row ${m.provision_id} is not pinned to the frozen manifest`);
    if (!RELATIONS.includes(m.relation as Relation)) throw new Error(`map row ${m.provision_id} has relation ${m.relation}`);
    rows.set(`${m.provision_id}|${m.relation}`, bindingFor(m.provision_id, m.relation as Relation, manifest));
  }
  return [...rows.keys()].sort().map((k) => rows.get(k)!);
}
