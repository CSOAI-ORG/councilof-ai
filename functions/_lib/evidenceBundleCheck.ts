import { canonicalBytes, sha256Hex } from "./cardSign";
import { PINNED_ANCHORS, type Anchor } from "./cardVerify";
import { isCardV0, verifyCardV0, WHOLE_CARD_COVERS } from "./cardV0Verify";

export const BUNDLE_CHECK_LIMITS = {
  responseBytes: 10_000_000, cardBytes: 131_072, originalBytes: 10_000_000,
  cards: 256, depth: 40, nodes: 100_000,
} as const;

type ObjectValue = Record<string, unknown>;
type Check = { state: "MATCH" | "MISMATCH" | "UNCHECKABLE" | "NOT_CHECKED"; reason: string };
type SignatureCheck = { state: "VALID" | "INVALID" | "UNCHECKABLE"; reasons: string[] };
export type BundleCheckInput = {
  responseBytes: Uint8Array;
  /** Exact saved leaf or {card, proof} JSON text, keyed by full caller-selected digest. */
  originalCards: Record<string, string>;
  expected: { obligation: string; subject: string | null; cardIds: string[]; resourceUrl?: string };
  expectedResponseSha256?: string;
  /** Retained card timestamp policy, never measurement freshness. No default age or clock. */
  timestampPolicy?: { now: string; maxAgeSeconds: number; maxFutureSkewSeconds?: number };
  /** Retained unsigned server delivery record, not an authenticated payment receipt. */
  deliveryRecord?: unknown;
};
type Options = { anchors?: Anchor[] };
const match = (reason: string): Check => ({ state: "MATCH", reason });
const mismatch = (reason: string): Check => ({ state: "MISMATCH", reason });
const unknown = (reason: string): Check => ({ state: "UNCHECKABLE", reason });
const notChecked = (reason: string): Check => ({ state: "NOT_CHECKED", reason });
const object = (v: unknown): v is ObjectValue => !!v && typeof v === "object" && !Array.isArray(v);
const digest = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const encoder = new TextEncoder();
const same = (a: unknown, b: unknown) => {
  const x = canonicalBytes(a), y = canonicalBytes(b);
  return x.length === y.length && x.every((byte, i) => byte === y[i]);
};

/** Bounded input validation only; the existing verifier owns canonicalization and signatures. */
function parse(text: string): unknown {
  // Native syntax rejection must precede the token scan: malformed escaped quotes
  // otherwise let the global pattern retry from each quote in an unterminated string.
  const result: unknown = JSON.parse(text);
  const stack: (Set<string> | null)[] = [];
  const tokens = /"(?:\\[\s\S]|[^"\\])*"|[{}\[\]]/g;
  for (const token of text.matchAll(tokens)) {
    const value = token[0];
    if (value === "{" || value === "[") {
      stack.push(value === "{" ? new Set() : null);
      if (stack.length > BUNDLE_CHECK_LIMITS.depth) throw Error("JSON depth limit");
    } else if (value === "}" || value === "]") stack.pop();
    else if (/^\s*:/.test(text.slice(token.index! + value.length))) {
      const keys = stack.at(-1), key = JSON.parse(value);
      if (!keys || keys.has(key) || key === "__proto__") throw Error("Ambiguous JSON object key");
      keys.add(key);
    }
  }
  const pending = [result];
  let count = 0;
  while (pending.length) {
    const value = pending.pop();
    if (++count > BUNDLE_CHECK_LIMITS.nodes) throw Error("JSON node limit");
    if (typeof value === "number" && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) throw Error("Non-finite or unsafe integer JSON number");
    if (Array.isArray(value)) pending.push(...value);
    else if (object(value)) pending.push(...Object.values(value));
  }
  return result;
}
function instant(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z") ? ms : null;
}
function timestamp(value: unknown, authenticated: boolean, policy?: BundleCheckInput["timestampPolicy"]) {
  const ms = instant(value);
  const date = { state: ms === null ? "UNCHECKABLE" : "WELL_FORMED", authenticated, as_of: typeof value === "string" ? value : null };
  if (!policy) return { ...date, age_policy: "NOT_CHECKED" };
  if (ms === null) return { ...date, age_policy: "UNCHECKABLE" };
  const age = (instant(policy.now)! - ms) / 1000;
  return { ...date, age_policy: age < -(policy.maxFutureSkewSeconds ?? 0) ? "FUTURE" : age > policy.maxAgeSeconds ? "STALE" : "WITHIN_WINDOW" };
}
async function signature(card: unknown, raw: string, anchors: Anchor[]): Promise<SignatureCheck> {
  if (!isCardV0(card) || !digest(card.sha256) ||
      !(card.sig_ed25519 === null || typeof card.sig_ed25519 === "string" && /^[0-9a-f]{128}$/i.test(card.sig_ed25519))) {
    return { state: "UNCHECKABLE", reasons: ["unsupported_or_malformed_card"] };
  }
  try {
    const v = await verifyCardV0(card, raw, anchors);
    return { state: v.state, reasons: [...new Set([...v.reasons, ...v.checks.filter(c => c.code === "digest_domain_not_issued").map(c => c.code)])] };
  } catch { return { state: "UNCHECKABLE", reasons: ["verifier_did_not_complete"] }; }
}
function leaf(value: unknown): ObjectValue | null {
  return (isCardV0(value) ? value : object(value) && isCardV0(value.card) ? value.card : null) as ObjectValue | null;
}

/** Inspect retained material only. No fetch, payment, signing, storage or acceptance decision. */
export async function checkEvidenceBundle(input: BundleCheckInput, options: Options = {}) {
  const result = {
    schema: "csoai.evidence-bundle-offline-check/0.1",
    input: unknown("Input has not been checked"),
    response: { sha256: null as string | null, bytes: null as number | null, retained_pin: notChecked("No caller-retained response digest supplied") },
    inventory: unknown("Input has not been checked"),
    scope: { comparison: unknown("Input has not been checked"), authenticated_by_manifest: false, outer_metadata_authenticated: false },
    manifest: {
      signature: { state: "UNCHECKABLE", reasons: ["not_checked"] } as SignatureCheck,
      binding: unknown("Input has not been checked"), timestamp: timestamp(null, false),
      identifier_coverage: "FIRST_30_PREFIXES_ONLY; not a full-ID or full-response commitment",
    },
    cards: [] as { id: string; original_sha256: string | null; content: Check; signature: SignatureCheck; outer_metadata_authenticated: boolean; timestamp: ReturnType<typeof timestamp> }[],
    delivery_record: { comparison: notChecked("No retained delivery record supplied"), authenticated: false },
    trust_anchors: options.anchors === undefined ? "SOURCE_PINNED" : "CALLER_SUPPLIED",
    network_calls: 0, payment_verified: false, root_inclusion_verified: false,
    current_revocation_checked: false, source_truth_verified: false,
    measurement_freshness: "NOT_ESTABLISHED", applicability: "NOT_ESTABLISHED",
    customer_acceptance: "NOT_RECORDED",
    limitations: [
      "MATCH means only the named comparison completed; it is not customer acceptance or suitability.",
      "Payload-only signatures do not authenticate outer subject, as_of or other outer metadata.",
      "A card timestamp can be issue, publication or schedule time; age checks do not prove a new measurement.",
      "Payment receipt URLs omit query parameters; payment receipts are not verified here.",
      "Delivery records and outer response metadata are unsigned; replacing all unpinned inputs is not detected.",
      "No current key status, Merkle inclusion, legal applicability, population completeness or source truth is established.",
    ],
  };
  try {
    if (!(input.responseBytes instanceof Uint8Array) || !input.responseBytes.length || input.responseBytes.length > BUNDLE_CHECK_LIMITS.responseBytes) throw Error("Response byte limit or type");
    const supplied = input.expected;
    const expected = object(supplied) ? { ...supplied, cardIds: Array.isArray(supplied.cardIds) ? [...supplied.cardIds] : supplied.cardIds } : supplied;
    if (!object(expected) || typeof expected.obligation !== "string" || !expected.obligation.trim() || expected.obligation.length > 120 ||
        !(expected.subject === null || typeof expected.subject === "string" && expected.subject.length > 0 && expected.subject.length <= 120) ||
        !Array.isArray(expected.cardIds) || expected.cardIds.length > BUNDLE_CHECK_LIMITS.cards ||
        !expected.cardIds.every(digest) || new Set(expected.cardIds).size !== expected.cardIds.length) throw Error("Caller scope/full IDs required");
    if (!object(input.originalCards) || Object.keys(input.originalCards).length > BUNDLE_CHECK_LIMITS.cards) throw Error("Original-card map limit or type");
    const ids = [...expected.cardIds].sort();
    if (Object.keys(input.originalCards).some(id => !ids.includes(id))) throw Error("Unexpected original-card key");
    const rawCards: Record<string, string> = {};
    let total = 0;
    for (const [id, text] of Object.entries(input.originalCards)) {
      if (typeof text !== "string" || text.length > BUNDLE_CHECK_LIMITS.cardBytes) throw Error("Original-card text limit or type");
      const size = encoder.encode(text).length;
      if (size > BUNDLE_CHECK_LIMITS.cardBytes || (total += size) > BUNDLE_CHECK_LIMITS.originalBytes) throw Error("Original-card byte limit");
      rawCards[id] = text;
    }
    if (expected.resourceUrl !== undefined) {
      if (typeof expected.resourceUrl !== "string" || expected.resourceUrl.length > 2048) throw Error("Invalid caller resource URL");
      const url = new URL(expected.resourceUrl);
      if (url.href !== expected.resourceUrl || url.protocol !== "https:" || url.username || url.password || url.hash ||
          url.pathname !== "/api/evidence-bundle" || url.searchParams.get("bundle") !== "1" ||
          url.searchParams.get("obligation") !== expected.obligation || url.searchParams.get("subject") !== expected.subject) throw Error("Caller URL differs from selected bundle scope");
    }
    const responsePin = input.expectedResponseSha256;
    if (responsePin !== undefined && !digest(responsePin)) throw Error("Invalid retained response digest");
    const policy = input.timestampPolicy === undefined ? undefined : { ...input.timestampPolicy };
    if (policy && (instant(policy.now) === null || !Number.isSafeInteger(policy.maxAgeSeconds) || policy.maxAgeSeconds < 0 ||
        policy.maxFutureSkewSeconds !== undefined && (!Number.isSafeInteger(policy.maxFutureSkewSeconds) || policy.maxFutureSkewSeconds < 0))) throw Error("Invalid explicit timestamp policy");
    const retainedDelivery = object(input.deliveryRecord) ? { ...input.deliveryRecord } : input.deliveryRecord;
    const anchors = (options.anchors ?? PINNED_ANCHORS).map(anchor => ({ ...anchor }));
    if (anchors.length > 32 || anchors.some(anchor => typeof anchor.id !== "string" || !anchor.id || anchor.id.length > 256 || !digest(anchor.hex)) ||
        new Set(anchors.map(anchor => anchor.id)).size !== anchors.length) throw Error("Invalid caller trust anchors");
    const bytes = input.responseBytes.slice();
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const bundle = parse(raw);
    if (!object(bundle) || bundle.schema !== "csoai.evidence-bundle/0.1" || bundle.kind !== "bundle" || !object(bundle.cards)) throw Error("Not an evidence-bundle response");
    if (Object.keys(bundle.cards).length > BUNDLE_CHECK_LIMITS.cards) throw Error("Delivered-card count limit");
    const manifest = isCardV0(bundle.manifest_card) ? bundle.manifest_card as ObjectValue : null;
    if (!manifest || !object(manifest.payload)) throw Error("Missing manifest card");
    const payload = manifest.payload;
    result.response.sha256 = await sha256Hex(bytes);
    result.response.bytes = bytes.length;
    if (responsePin !== undefined) result.response.retained_pin = result.response.sha256 === responsePin ? match("Exact retained response bytes match caller pin") : mismatch("Exact response bytes differ from caller pin");
    result.input = match("Bounded input and explicit caller scope read");
    const inventoryOk = same(Object.keys(bundle.cards).sort(), ids);
    result.inventory = inventoryOk ? match("Delivered full card IDs equal caller-selected full IDs") : mismatch("Delivered full card IDs differ from caller selection");
    result.manifest.signature = await signature(manifest, raw, anchors);
    const scopeOk = object(bundle.obligation) && bundle.obligation.id === expected.obligation &&
      bundle.subject === expected.subject && payload.obligation === expected.obligation && payload.subject === expected.subject;
    result.scope.comparison = scopeOk ? match("Outer and manifest scope match caller selection") : mismatch("Response or manifest scope differs from caller selection");
    result.scope.authenticated_by_manifest = scopeOk && result.manifest.signature.state === "VALID";
    const results = object(bundle.oscal) && object(bundle.oscal["assessment-results"]) &&
      Array.isArray(bundle.oscal["assessment-results"].results) ? bundle.oscal["assessment-results"].results : [];
    const rows = results.length === 1 && object(results[0]) && Array.isArray(results[0].observations) ? results[0].observations : null;
    const observationIds = rows?.map(row => object(row) && Array.isArray(row.props) ? row.props.filter(p => object(p) && p.name === "sha256").map(p => (p as ObjectValue).value) : []);
    const oscalOk = !!observationIds && object(results[0]) && Array.isArray(results[0].findings) && results[0].findings.length === 0 &&
      observationIds.every(values => values.length === 1 && digest(values[0])) && same(observationIds.map(values => values[0]).sort(), ids);
    const bindingOk = inventoryOk && oscalOk && manifest.surface === "evidence.bundle" &&
      payload.relation === "relevant-to" && payload.determination === "NONE" &&
      payload.card_count === ids.length && payload.status === (ids.length ? "ASSEMBLED" : "ASSEMBLED-EMPTY") &&
      same(payload.card_sha256, ids.slice(0, 30).map(id => id.slice(0, 16)));
    result.manifest.binding = bindingOk ? match("Count, status, truncated IDs and OSCAL IDs agree; no determination or findings; full cryptographic set binding not provided") : mismatch("Manifest binding, observation inventory or no-determination contract inconsistent");
    result.manifest.timestamp = timestamp(manifest.as_of, manifest.digest_covers === WHOLE_CARD_COVERS && result.manifest.signature.state === "VALID", policy);
    for (const id of ids) {
      const saved = rawCards[id];
      let original: ObjectValue | null = null;
      let content = unknown("Original card bytes missing; no reconstruction attempted");
      let sig: SignatureCheck = { state: "UNCHECKABLE", reasons: ["original_card_bytes_missing"] };
      if (saved !== undefined) {
        try {
          original = leaf(parse(saved));
          const wrapper = bundle.cards[id];
          const delivered = object(wrapper) ? leaf(wrapper.card) : null;
          content = original && delivered && original.sha256 === id && delivered.sha256 === id && same(original, delivered) ?
            match("Delivered card object equals original retained card object; original text hash reported separately") : mismatch("Original/delivered card identity or content differs");
          sig = await signature(original, saved, anchors);
        } catch { content = unknown("Original card could not be read within the input contract"); sig = { state: "UNCHECKABLE", reasons: ["original_card_unreadable"] }; }
      }
      const authenticated = content.state === "MATCH" && original?.digest_covers === WHOLE_CARD_COVERS && sig.state === "VALID";
      result.cards.push({ id, original_sha256: saved === undefined ? null : await sha256Hex(encoder.encode(saved)), content, signature: sig, outer_metadata_authenticated: authenticated, timestamp: timestamp(original?.as_of, authenticated, policy) });
    }
    if (retainedDelivery !== undefined) {
      const row = retainedDelivery;
      const transaction = object(payload.settle) ? payload.settle.transaction : null;
      result.delivery_record.comparison = !expected.resourceUrl ? unknown("Caller-pinned full resource URL required for delivery comparison") :
        object(row) && row.schema === "csoai.x402.delivery-record/0.1" && row.signed === false &&
        row.resource === expected.resourceUrl && typeof row.transaction === "string" && !!row.transaction &&
        row.transaction === transaction && row.response_sha256 === result.response.sha256 && row.response_bytes === bytes.length ?
          match("Unsigned delivery record matches bytes, caller URL and manifest transaction; no authenticated delivery inferred") :
          mismatch("Retained delivery record differs from bytes, caller URL or manifest transaction");
    }
  } catch (error) {
    result.input = unknown(error instanceof Error ? error.message : "Input could not be checked");
  }
  return result;
}
