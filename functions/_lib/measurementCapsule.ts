/**
 * Measurement capsules — the free read side (MCP tools measurement_index / verify_capsule /
 * server_evidence and the A2A skills measurement-capsules / server-evidence).
 *
 * A capsule is one declared-vs-observed record; a batch binds capsules under a Merkle root; the
 * index binds the batches and is board-signed. This module reads the STATIC files a deploy would
 * serve under DATA_ROOT (written by scripts/measurement_capsule_layout.py) and re-derives every
 * claim it returns: capsule ids are recomputed, inclusion is recomputed against the batch root the
 * signed index names, the index signature is verified against the pinned board key.
 *
 * Two rule versions, chosen by the schema string the bytes carry (never by a guess):
 *   0.1  csoai.venturi-capsule/0.1 — Merkle: sha256(l||r) over sorted 32-byte ids, odd node promoted.
 *   0.2  csoai.measurement-capsule/0.2 — Merkle: RFC 6962 (leaf = SHA-256(0x00||id), node =
 *        SHA-256(0x01||l||r), split at the largest power of two below n); capsule bytes are JCS.
 * For both, capsule_id = sha256 of the canonical JSON of the capsule without capsule_id
 * (keys sorted, no whitespace, UTF-8, non-ASCII literal). Pass the capsule as the JSON TEXT and
 * number lexemes are kept byte-for-byte; a parsed object is re-serialised by JavaScript, which is
 * exact for 0.2 (JCS) and may differ for a 0.1 float such as 1.0.
 *
 * Doctrine: measurement, not endorsement. No verdict, score or ranking is ever produced here;
 * an unknown endpoint is NOT_MEASURED, never "clean"; an absent dataset is NOT_PUBLISHED.
 */
import { PINNED_ANCHORS, hexToBytes, bytesToHex, jsCanonical } from "./cardVerify";

export const DOCTRINE = "measurement, not endorsement";
export const DATA_ROOT = "/measurement-capsules";
export const LATEST_PATH = `${DATA_ROOT}/latest.json`;
export const versionRoot = (v: RuleVersion) => `${DATA_ROOT}/v${v}`;
export const indexPath = (v: RuleVersion) => `${versionRoot(v)}/index.json`;
export const indexSignedPath = (v: RuleVersion) => `${versionRoot(v)}/index.signed.json`;
export const anchorsPath = (v: RuleVersion) => `${versionRoot(v)}/anchors.json`;
export const indexOtsPath = (v: RuleVersion) => `${versionRoot(v)}/index.json.ots`;
export const batchPath = (v: RuleVersion, slug: string) => `${versionRoot(v)}/${slug}`;
export const shardPath = (v: RuleVersion, shard: string) => `${versionRoot(v)}/endpoints/${shard}.json`;
export const SHARD_HEX = 2; // 256 shards, keyed by the first two hex of sha256(normalised endpoint)

export type RuleVersion = "0.1" | "0.2";
const CAPSULE_SCHEMAS: Record<string, RuleVersion> = {
  "csoai.venturi-capsule/0.1": "0.1",
  "csoai.measurement-capsule/0.2": "0.2",
  // 0.3 = 0.2 plus the optional provisions binding (a list pinned to the frozen provision manifest).
  // Same capsule_id, JCS and Merkle rules, published under the v0.2 index, so it reads under "0.2".
  "csoai.measurement-capsule/0.3": "0.2",
};
const INDEX_SCHEMAS: Record<string, RuleVersion> = {
  "csoai.venturi-index/0.1": "0.1",
  "csoai.measurement-capsule-index/0.2": "0.2",
  // 0.3 = the chained daily index (0.2 plus prev_index_* / gap_days / freshness). Same batch and root rules; laid out
  // under v0.2 by scripts/measurement_capsule_layout.py, so it reads under "0.2".
  "csoai.measurement-capsule-index/0.3": "0.2",
};
export const capsuleVersion = (schema: unknown): RuleVersion | null =>
  typeof schema === "string" ? CAPSULE_SCHEMAS[schema] ?? null : null;
export const indexVersion = (schema: unknown): RuleVersion | null =>
  typeof schema === "string" ? INDEX_SCHEMAS[schema] ?? null : null;

type Json = Record<string, unknown>;
const utf8 = (s: string) => new TextEncoder().encode(s);
const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource));
}
export async function sha256HexOf(s: string | Uint8Array): Promise<string> {
  return bytesToHex(await sha256(typeof s === "string" ? utf8(s) : s));
}
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

/* ------------------------------------------------------------- canonical JSON */

/** A parsed JSON value whose numbers keep their source lexeme. */
type Lex = { n: string } | string | boolean | null | Lex[] | { o: [string, Lex][] };

/** Minimal strict JSON parser that keeps number lexemes (so 1.0 stays 1.0 and 1e-05 stays 1e-05). */
export function parseLexical(text: string): Lex {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
  };
  const fail = (why: string): never => {
    throw new SyntaxError(`${why} at ${i}`);
  };
  const str = (): string => {
    const start = i;
    i++;
    while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    if (text[i] !== '"') fail("unterminated string");
    i++;
    return JSON.parse(text.slice(start, i)) as string;
  };
  const val = (): Lex => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      const o: [string, Lex][] = [];
      ws();
      if (text[i] === "}") {
        i++;
        return { o };
      }
      for (;;) {
        ws();
        if (text[i] !== '"') fail("expected key");
        const k = str();
        ws();
        if (text[i] !== ":") fail("expected :");
        i++;
        const v = val();
        const at = o.findIndex(([kk]) => kk === k);
        if (at >= 0) o.splice(at, 1); // last duplicate wins, as in Python's json
        o.push([k, v]);
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return { o };
        }
        fail("expected , or }");
      }
    }
    if (c === "[") {
      i++;
      const a: Lex[] = [];
      ws();
      if (text[i] === "]") {
        i++;
        return a;
      }
      for (;;) {
        a.push(val());
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return a;
        }
        fail("expected , or ]");
      }
    }
    if (c === '"') return str();
    if (text.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (text.startsWith("false", i)) {
      i += 5;
      return false;
    }
    if (text.startsWith("null", i)) {
      i += 4;
      return null;
    }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail("unexpected token");
    i += m![0].length;
    return { n: m![0] };
  };
  const out = val();
  ws();
  if (i !== text.length) fail("trailing bytes");
  return out;
}

const isNum = (x: Lex): x is { n: string } => !!x && typeof x === "object" && !Array.isArray(x) && "n" in x;
const isObj = (x: Lex): x is { o: [string, Lex][] } => !!x && typeof x === "object" && !Array.isArray(x) && "o" in x;
// Python sorts keys by code point; JavaScript's default sort is by UTF-16 unit. They agree
// except for astral-plane keys, so compare by code point explicitly.
const byCodePoint = (a: string, b: string) => {
  const A = [...a].map((c) => c.codePointAt(0)!);
  const B = [...b].map((c) => c.codePointAt(0)!);
  for (let k = 0; k < Math.min(A.length, B.length); k++) if (A[k] !== B[k]) return A[k] - B[k];
  return A.length - B.length;
};

/** Canonical text: keys sorted, separators "," ":", non-ASCII literal, number lexemes kept. */
export function canonicalLex(x: Lex, drop?: string): string {
  if (x === null || typeof x === "boolean") return JSON.stringify(x);
  if (typeof x === "string") return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map((y) => canonicalLex(y)).join(",")}]`;
  if (isNum(x)) return x.n;
  const entries = x.o.filter(([k]) => k !== drop).sort(([a], [b]) => byCodePoint(a, b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalLex(v)}`).join(",")}}`;
}

function lexGet(x: Lex, key: string): Lex | undefined {
  return isObj(x) ? x.o.find(([k]) => k === key)?.[1] : undefined;
}

/** Accept the capsule as JSON text (exact) or as an object (JS re-serialisation). */
export function readCapsuleInput(input: unknown): { lex?: Lex; exact: boolean; error?: string } {
  try {
    if (typeof input === "string") return { lex: parseLexical(input.trim()), exact: true };
    if (rec(input)) return { lex: parseLexical(JSON.stringify(input)), exact: false };
  } catch (e) {
    return { exact: false, error: `capsule_json is not valid JSON: ${(e as Error).message}` };
  }
  return { exact: false, error: "capsule_json must be the capsule's JSON text (preferred) or a JSON object" };
}

export async function recomputeCapsuleId(lex: Lex): Promise<string> {
  return sha256HexOf(canonicalLex(lex, "capsule_id"));
}

/* -------------------------------------------------------------------- Merkle */

const HEX64 = /^[0-9a-f]{64}$/;
const leafBytes = (id: string) => {
  if (!HEX64.test(id)) throw new Error(`leaf is not a 32-byte hex capsule_id: ${id.slice(0, 20)}`);
  return hexToBytes(id);
};
async function leafHash(v: RuleVersion, id: string): Promise<Uint8Array> {
  return v === "0.2" ? sha256(concat(new Uint8Array([0]), leafBytes(id))) : leafBytes(id);
}
async function nodeHash(v: RuleVersion, l: Uint8Array, r: Uint8Array): Promise<Uint8Array> {
  return v === "0.2" ? sha256(concat(new Uint8Array([1]), l, r)) : sha256(concat(l, r));
}

export const MERKLE_RULE: Record<RuleVersion, string> = {
  "0.1": "binary sha256 over sorted capsule_id leaves; odd leaf promoted",
  "0.2": "RFC 6962 Merkle Tree Hash over sorted 32-byte capsule_id leaves: leaf = SHA-256(0x00||id), node = SHA-256(0x01||l||r)",
};

export type ProofStep = { side: "L" | "R"; hash: string };

/** Root and (optionally) the audit path of one leaf. Bottom-up pairing with the last odd node
 *  promoted gives exactly the RFC 6962 left-balanced shape, so one walk serves both versions. */
export async function merkle(
  v: RuleVersion,
  ids: string[],
  target?: string,
): Promise<{ root: string; index: number; path: ProofStep[] }> {
  const sorted = [...ids].sort();
  if (!sorted.length) return { root: await sha256HexOf(new Uint8Array()), index: -1, path: [] };
  let level = await Promise.all(sorted.map((id) => leafHash(v, id)));
  let idx = target === undefined ? -1 : sorted.indexOf(target);
  const index = idx;
  const path: ProofStep[] = [];
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let k = 0; k < level.length; k += 2) {
      if (k + 1 < level.length) {
        next.push(await nodeHash(v, level[k], level[k + 1]));
        if (idx === k) path.push({ side: "R", hash: bytesToHex(level[k + 1]) });
        else if (idx === k + 1) path.push({ side: "L", hash: bytesToHex(level[k]) });
      } else next.push(level[k]);
    }
    if (idx >= 0) idx = Math.floor(idx / 2);
    level = next;
  }
  return { root: bytesToHex(level[0]), index, path };
}

export async function rootFromProof(v: RuleVersion, id: string, path: ProofStep[]): Promise<string> {
  let h = await leafHash(v, id);
  for (const s of path) {
    const sib = hexToBytes(s.hash);
    h = s.side === "R" ? await nodeHash(v, h, sib) : await nodeHash(v, sib, h);
  }
  return bytesToHex(h);
}

/* ------------------------------------------------------------ static sources */

export type Fetched =
  | { state: "OK"; url: string; text: string; json: unknown }
  | { state: "NOT_PUBLISHED" | "UNREACHABLE" | "UNCHECKABLE"; url: string; reason: string };

export async function fetchStatic(origin: string, path: string): Promise<Fetched> {
  const url = `${origin}${path}`;
  let r: Response;
  try {
    // Same-origin static files only; a redirect is refused, never followed (the A2A router's posture).
    r = await fetch(url, { headers: { accept: "application/json" }, redirect: "manual", signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    return { state: "UNREACHABLE", url, reason: `fetch failed: ${(e as Error).message}`.slice(0, 200) };
  }
  if (r.status >= 300 && r.status < 400) return { state: "UNCHECKABLE", url, reason: `redirected (${r.status}) — not followed` };
  if (r.status === 404 || r.status === 410) return { state: "NOT_PUBLISHED", url, reason: `HTTP ${r.status}` };
  if (!r.ok) return { state: "UNREACHABLE", url, reason: `HTTP ${r.status}` };
  const text = await r.text();
  try {
    return { state: "OK", url, text, json: JSON.parse(text) };
  } catch {
    // Pages serves the SPA shell for an unknown path; HTML where JSON was asked is "not published".
    return /^\s*</.test(text)
      ? { state: "NOT_PUBLISHED", url, reason: "served HTML, not JSON (path not published)" }
      : { state: "UNCHECKABLE", url, reason: "body is not JSON" };
  }
}

async function ed25519Verify(pub: Uint8Array, sig: Uint8Array, msg: Uint8Array): Promise<boolean | null> {
  try {
    const key = await crypto.subtle.importKey("raw", pub as unknown as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, sig as unknown as BufferSource, msg as unknown as BufferSource);
  } catch (e) {
    return (e as { name?: string })?.name === "NotSupportedError" ? null : false;
  }
}

export type SignatureState = {
  state: "VERIFIES" | "FAILS" | "ABSENT" | "UNCHECKABLE";
  reason?: string;
  did?: string | null;
  signed_at?: string | null;
  payload_sha256?: string | null;
  pins_these_bytes?: boolean;
};

/** A csoai.signed-run/0.1 sidecar over `bytesText`: pinned key, preimage hash, and that the payload pins these bytes. */
export async function verifySidecar(sidecar: Fetched, bytesText: string): Promise<SignatureState> {
  if (sidecar.state === "NOT_PUBLISHED") return { state: "ABSENT", reason: "no signed sidecar published" };
  if (sidecar.state !== "OK") return { state: "UNCHECKABLE", reason: sidecar.reason };
  const s = rec(sidecar.json);
  const payload = rec(s?.payload);
  const sig = rec(s?.signature);
  if (!payload || !sig) return { state: "UNCHECKABLE", reason: "sidecar lacks payload/signature" };
  const did = typeof sig.did === "string" ? sig.did : null;
  const anchor = PINNED_ANCHORS.find((a) => a.id === did);
  const base = { did, signed_at: typeof sig.signed_at === "string" ? sig.signed_at : null };
  if (!anchor) return { ...base, state: "FAILS", reason: `signer ${did} is not a pinned key` };
  const preimage = utf8(jsCanonical(payload));
  const payloadSha = await sha256HexOf(preimage);
  if (payloadSha !== sig.payload_sha256) return { ...base, state: "FAILS", reason: "payload sha256 != signature.payload_sha256" };
  const artifactSha = rec(payload.artifact)?.sha256;
  const pins = artifactSha === (await sha256HexOf(bytesText));
  if (typeof sig.sig_ed25519 !== "string" || !/^[0-9a-f]{128}$/.test(sig.sig_ed25519))
    return { ...base, state: "FAILS", reason: "sig_ed25519 is not 64 hex bytes" };
  const ok = await ed25519Verify(hexToBytes(anchor.hex), hexToBytes(sig.sig_ed25519), preimage);
  if (ok === null) return { ...base, state: "UNCHECKABLE", reason: "this runtime lacks Ed25519" };
  if (!ok) return { ...base, state: "FAILS", reason: "Ed25519 signature does not verify", payload_sha256: payloadSha };
  if (!pins) return { ...base, state: "FAILS", reason: "signed payload does not pin these index bytes", payload_sha256: payloadSha, pins_these_bytes: false };
  return { ...base, state: "VERIFIES", payload_sha256: payloadSha, pins_these_bytes: true };
}

type Latest = { version: RuleVersion; versions: RuleVersion[] };

async function readLatest(origin: string): Promise<{ latest?: Latest; miss?: Fetched }> {
  const f = await fetchStatic(origin, LATEST_PATH);
  if (f.state !== "OK") return { miss: f };
  const j = rec(f.json);
  const version = j?.version === "0.1" || j?.version === "0.2" ? (j.version as RuleVersion) : null;
  if (!version) return { miss: { state: "UNCHECKABLE", url: f.url, reason: "latest.json names no known rule version" } };
  const versions = Array.isArray(j?.versions)
    ? (j!.versions as unknown[]).filter((x): x is RuleVersion => x === "0.1" || x === "0.2")
    : [version];
  return { latest: { version, versions: versions.includes(version) ? versions : [version, ...versions] } };
}

export type LoadedIndex = {
  version: RuleVersion;
  url: string;
  doc: Json;
  signature: SignatureState;
  batches: Json[];
};

async function loadIndex(origin: string, v: RuleVersion): Promise<{ index?: LoadedIndex; miss?: Fetched }> {
  const f = await fetchStatic(origin, indexPath(v));
  if (f.state !== "OK") return { miss: f };
  const doc = rec(f.json);
  if (!doc || indexVersion(doc.schema) !== v)
    return { miss: { state: "UNCHECKABLE", url: f.url, reason: `index schema ${String(doc?.schema)} is not a v${v} index` } };
  const signature = await verifySidecar(await fetchStatic(origin, indexSignedPath(v)), f.text);
  const batches = Array.isArray(doc.batches) ? (doc.batches as unknown[]).map(rec).filter((b): b is Json => !!b) : [];
  return { index: { version: v, url: f.url, doc, signature, batches } };
}

/** Directory of one batch under v<ver>/: its adapter name when exactly one batch of the index carries
 *  that adapter, else `<adapter>-<first 12 hex of its merkle_root>`. The 2026-09-26 index carries two
 *  mill_cross_runtime batches; one shared directory let the second overwrite the first's leaves.
 *  Mirrored byte-for-byte by batch_slug() in scripts/measurement_capsule_layout.py. */
export function batchSlug(batches: Json[], b: Json): string {
  const adapter = String(b.adapter);
  const same = batches.filter((x) => String(x.adapter) === adapter).length;
  return same === 1 ? adapter : `${adapter}-${String(b.merkle_root).slice(0, 12)}`;
}

const pick = (o: Json, keys: string[]) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

/** Is a binary sidecar (an .ots proof) served at this path? Presence only: the proof is not parsed here. */
async function sidecarPresent(origin: string, path: string): Promise<boolean> {
  try {
    const r = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return false;
    const head = new Uint8Array(await r.arrayBuffer()).slice(0, 32);
    return head.length > 0 && head[0] !== 0x3c; // not the SPA's HTML shell ("<")
  } catch {
    return false;
  }
}

/** Anchor states: the anchors.json published beside the index (written from the anchor files by the capsule
 *  lane, `anchors --date D`); without it, only what is served is reported (an OTS proof file, unparsed). */
async function anchorsFor(origin: string, v: RuleVersion): Promise<Json> {
  const a = await fetchStatic(origin, anchorsPath(v));
  if (a.state === "OK" && rec(a.json)) return { state: "PUBLISHED", source: a.url, ...(rec(a.json) as Json) };
  const ots = await sidecarPresent(origin, indexOtsPath(v));
  return {
    state: a.state === "OK" ? "UNCHECKABLE" : ots ? "PARTIAL" : a.state,
    opentimestamps: ots ? { state: "PROOF_PUBLISHED_UNPARSED", proof_url: `${origin}${indexOtsPath(v)}` } : { state: "NOT_PUBLISHED" },
    rekor: "NOT_STATED",
    note: "anchors.json (OpenTimestamps, Rekor, XRPL states read from the anchor files) is published beside the index when it exists; none is inferred",
  };
}

/** Publication state: the index's own `publication`, else the signed publication record named in anchors.json
 *  (for an index whose signed bytes predate the owner's approval), else what the index says. */
function publicationOf(d: Json, anchors: Json): Json {
  const own = rec(d.publication);
  if (own) return { ...own, by: "the index itself" };
  const viaAnchors = rec(anchors.publication);
  if (viaAnchors) return viaAnchors;
  return d.private_until ? { state: "PRIVATE_UNTIL_OWNER_APPROVES", private_until: d.private_until } : { state: "UNSTATED" };
}

/* ------------------------------------------------------------ measurement_index */

export async function measurementIndex(origin: string): Promise<Json> {
  const { latest, miss } = await readLatest(origin);
  if (!latest) return notAvailable(miss!, "no measurement-capsule index is published on this origin");
  const { index, miss: m2 } = await loadIndex(origin, latest.version);
  if (!index) return notAvailable(m2!, "latest.json names an index that could not be read");
  const d = index.doc;
  const anchors = await anchorsFor(origin, latest.version);
  return {
    state: "PUBLISHED",
    doctrine: DOCTRINE,
    version: latest.version,
    versions_published: latest.versions,
    schema: d.schema,
    as_of: d.as_of ?? null,
    index_url: index.url,
    index_root: d.index_root ?? null,
    index_root_rule: d.index_root_rule ?? MERKLE_RULE[latest.version],
    n_capsules_total: d.n_capsules_total ?? null,
    n_batches: index.batches.length,
    batches: index.batches.map((b) => ({
      ...pick(b, ["adapter", "kind", "n_capsules", "states", "merkle_root", "record_sha256", "capsules_sha256", "signature_state", "signed_at", "ots_state"]),
      slug: batchSlug(index.batches, b),
      record_url: `${origin}${batchPath(latest.version, batchSlug(index.batches, b))}/record.json`,
      leaves_url: `${origin}${batchPath(latest.version, batchSlug(index.batches, b))}/leaves.json`,
    })),
    signature: index.signature,
    anchors,
    publication: publicationOf(d, anchors),
    pending_source: d.pending_source ?? [],
    what_this_is_not: "Not a grade, ranking, admission or approval of anything. States only.",
  };
}

function notAvailable(f: Fetched, why: string): Json {
  return {
    state: f.state === "OK" ? "UNCHECKABLE" : f.state,
    doctrine: DOCTRINE,
    reason: f.state === "OK" ? why : `${why} (${f.reason})`,
    source: f.url,
  };
}

/* -------------------------------------------------------------- verify_capsule */

export async function verifyCapsule(origin: string, input: unknown): Promise<Json> {
  const read = readCapsuleInput(input);
  if (!read.lex) return { state: "UNCHECKABLE", doctrine: DOCTRINE, reason: read.error };
  const lex = read.lex;
  if (!isObj(lex)) return { state: "UNCHECKABLE", doctrine: DOCTRINE, reason: "a capsule is a JSON object" };
  const claimed = lexGet(lex, "capsule_id");
  const claimedId = typeof claimed === "string" ? claimed : null;
  const schema = lexGet(lex, "schema");
  const kind = lexGet(lex, "kind");
  const v = capsuleVersion(schema);
  const recomputed = await recomputeCapsuleId(lex);
  const id = {
    claimed: claimedId,
    recomputed,
    state: claimedId === null ? "ABSENT" : claimedId === recomputed ? "RECOMPUTES" : "DOES_NOT_RECOMPUTE",
    input_form: read.exact ? "json_text (number lexemes kept byte-exact)" : "object (re-serialised by JavaScript; pass the JSON text for byte-exact v0.1 floats)",
  };
  const base = { doctrine: DOCTRINE, schema: typeof schema === "string" ? schema : null, kind: typeof kind === "string" ? kind : null, capsule_id: id };
  if (!v) return { ...base, state: "UNCHECKABLE", reason: `unknown capsule schema ${String(typeof schema === "string" ? schema : "(none)")}` };
  if (id.state === "DOES_NOT_RECOMPUTE")
    return { ...base, state: "ID_MISMATCH", reason: "the capsule's bytes do not hash to the capsule_id it carries; inclusion was not checked" };
  const { latest, miss } = await readLatest(origin);
  if (!latest) return { ...base, ...notAvailable(miss!, "no index is published to check inclusion against") };
  if (!latest.versions.includes(v))
    return { ...base, state: "NOT_PUBLISHED", reason: `no v${v} index is published on this origin (published: ${latest.versions.join(", ")})` };
  const { index, miss: m2 } = await loadIndex(origin, v);
  if (!index) return { ...base, ...notAvailable(m2!, `the v${v} index could not be read`) };
  // One kind may span several batches (two mill_cross_runtime batches on 2026-09-26): try each, in
  // index order, and answer for the one whose published leaves hold this id.
  const candidates = index.batches.filter((b) => b.kind === kind);
  if (!candidates.length) return { ...base, state: "NOT_INCLUDED", reason: `no published v${v} batch carries kind ${String(kind)}`, index_signature: index.signature };
  const target = recomputed;
  let found: { batch: Json; slug: string; leaves: string[]; url: string; m: { root: string; index: number; path: ProofStep[] } } | null = null;
  let lastInfo: Json | null = null;
  for (const batch of candidates) {
    const slug = batchSlug(index.batches, batch);
    const lf = await fetchStatic(origin, `${batchPath(v, slug)}/leaves.json`);
    if (lf.state !== "OK") return { ...base, ...notAvailable(lf, `leaves of batch ${slug} could not be read`), index_signature: index.signature };
    const leaves = rec(lf.json)?.leaves;
    if (!Array.isArray(leaves) || !leaves.every((x) => typeof x === "string" && HEX64.test(x)))
      return { ...base, state: "UNCHECKABLE", reason: `leaves.json of batch ${slug} does not carry a list of 64-hex capsule ids`, index_signature: index.signature };
    const m = await merkle(v, leaves as string[], target);
    const info = { adapter: String(batch.adapter), slug, merkle_root: String(batch.merkle_root), rule: MERKLE_RULE[v], leaves_url: lf.url, n_leaves: leaves.length };
    if (m.root !== String(batch.merkle_root))
      return { ...base, state: "UNCHECKABLE", reason: `the published leaves of batch ${slug} do not recompute to the batch root the index names`, batch: { ...info, leaves_root: m.root }, index_signature: index.signature };
    lastInfo = info;
    if (m.index >= 0) {
      found = { batch, slug, leaves: leaves as string[], url: lf.url, m };
      break;
    }
  }
  if (!found)
    return {
      ...base,
      state: "NOT_INCLUDED",
      reason: `capsule id is not a leaf of any published v${v} batch of kind ${String(kind)} (${candidates.length} checked)`,
      batch: lastInfo,
      index_signature: index.signature,
    };
  const { m, leaves } = found;
  const batchRoot = String(found.batch.merkle_root);
  const batchInfo = { adapter: String(found.batch.adapter), slug: found.slug, merkle_root: batchRoot, rule: MERKLE_RULE[v], leaves_url: found.url, n_leaves: leaves.length };
  const again = await rootFromProof(v, target, m.path);
  return {
    ...base,
    state: again === batchRoot ? "INCLUDED" : "UNCHECKABLE",
    batch: batchInfo,
    inclusion: { leaf_index: m.index, tree_size: leaves.length, path: m.path, recomputed_root: again },
    index_signature: index.signature,
    index_url: index.url,
    note:
      index.signature.state === "VERIFIES"
        ? "The capsule hashes to its id, the id is a leaf of the batch, and the batch root is named by an index signed under the pinned board key. What the capsule measured is exactly its measurement_state and limitations — nothing more."
        : "Inclusion recomputes, but the index signature is not VERIFIES; treat the batch root as unanchored.",
  };
}

/* ------------------------------------------------------------- server_evidence */

/** Endpoint key: https/http only, lower-cased scheme and host, default port and fragment dropped,
 *  trailing slash dropped except for the root path, query kept verbatim. Mirrored byte-for-byte by
 *  normalise_endpoint() in scripts/measurement_capsule_layout.py (a shared vector file pins both). */
export function normaliseEndpoint(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const port = u.port && !((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) ? `:${u.port}` : "";
  let path = u.pathname || "/";
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  return `${u.protocol}//${host}${port}${path}${u.search}`;
}

export const originOf = (normalised: string) => {
  const u = new URL(normalised);
  return `${u.protocol}//${u.host}`;
};

/**
 * Paths on councilof.ai renamed with a 308 after capsules were published about them. A capsule keys
 * the URL it measured and stays as published; this map only lets the evidence read say where that
 * path lives now, and lets a query on the CURRENT path find the capsules keyed to the former one.
 * 30 Sep 2026: /api/eunomia-data (an internal codename) → /api/signed-data-feed.
 */
export const RENAMED_PATHS: Readonly<Record<string, string>> = {
  "https://councilof.ai/api/eunomia-data": "https://councilof.ai/api/signed-data-feed",
};
const splitQuery = (u: string): [string, string] => {
  const i = u.indexOf("?");
  return i < 0 ? [u, ""] : [u.slice(0, i), u.slice(i)];
};
/** The current URL of a renamed endpoint (query kept), or null when the path was never renamed. */
export function currentPathOf(normalised: string): string | null {
  const [base, q] = splitQuery(normalised);
  return RENAMED_PATHS[base] ? RENAMED_PATHS[base] + q : null;
}
/** The former URL of an endpoint that was renamed TO this path (query kept), or null. */
export function formerPathOf(normalised: string): string | null {
  const [base, q] = splitQuery(normalised);
  const hit = Object.entries(RENAMED_PATHS).find(([, to]) => to === base);
  return hit ? hit[0] + q : null;
}

async function capsulesFor(origin: string, v: RuleVersion, endpoint: string) {
  const key = await sha256HexOf(endpoint);
  const sf = await fetchStatic(origin, shardPath(v, key.slice(0, SHARD_HEX)));
  if (sf.state !== "OK") return { key, capsules: [] as unknown[], entry: undefined as Json | undefined };
  const entry = rec(rec(rec(sf.json)?.endpoints)?.[key]);
  return { key, capsules: Array.isArray(entry?.capsules) ? (entry!.capsules as unknown[]) : [], entry };
}

export async function serverEvidence(origin: string, endpointUrl: unknown): Promise<Json> {
  const raw = typeof endpointUrl === "string" ? endpointUrl : "";
  const endpoint = normaliseEndpoint(raw);
  const empty = { doctrine: DOCTRINE, endpoint_url: raw || null, capsules: [] as unknown[], n_capsules: 0 };
  if (!endpoint)
    return { ...empty, state: "NOT_MEASURED", reason: "endpoint_url is not an http(s) URL this index could key; nothing is measured about it here", endpoint: null };
  const key = await sha256HexOf(endpoint);
  const { latest, miss } = await readLatest(origin);
  if (!latest) return { ...empty, endpoint, key, ...notAvailable(miss!, "no per-endpoint index is published on this origin") };
  const v = latest.version;
  const shardId = key.slice(0, SHARD_HEX);
  const sf = await fetchStatic(origin, shardPath(v, shardId));
  if (sf.state !== "OK") return { ...empty, endpoint, key, ...notAvailable(sf, `shard ${shardId} could not be read`) };
  const shard = rec(sf.json);
  const entry = rec(rec(shard?.endpoints)?.[key]);
  const originKey = await sha256HexOf(originOf(endpoint));
  let siblings: unknown[] = [];
  const osf = originKey.slice(0, SHARD_HEX) === shardId ? sf : await fetchStatic(origin, shardPath(v, originKey.slice(0, SHARD_HEX)));
  if (osf.state === "OK") {
    const list = rec(rec(osf.json)?.origins)?.[originKey];
    if (Array.isArray(list)) siblings = list.filter((u) => u !== endpoint);
  }
  // A sibling measured at a path since renamed is shown at its CURRENT path, with the rename stated.
  const renamed: Json[] = [];
  siblings = siblings.map((u) => {
    const now = typeof u === "string" ? currentPathOf(u) : null;
    if (!now) return u;
    renamed.push({ current: now, measured_at: "the former path of this endpoint, which answers 308 to the current one" });
    return now;
  });
  let capsules = Array.isArray(entry?.capsules) ? (entry!.capsules as unknown[]) : [];
  let measuredAtFormerPath = false;
  let byAdapter = entry?.by_adapter ?? {};
  if (!capsules.length) {
    const former = formerPathOf(endpoint);
    if (former) {
      const f = await capsulesFor(origin, v, former);
      if (f.capsules.length) {
        capsules = f.capsules;
        byAdapter = f.entry?.by_adapter ?? {};
        measuredAtFormerPath = true;
      }
    }
  }
  return {
    doctrine: DOCTRINE,
    state: capsules.length ? "MEASURED" : "NOT_MEASURED",
    endpoint,
    key,
    version: v,
    shard_url: sf.url,
    as_of: shard?.as_of ?? null,
    index_root: shard?.index_root ?? null,
    n_capsules: capsules.length,
    by_adapter: byAdapter,
    capsules,
    ...(measuredAtFormerPath
      ? { measured_at_former_path: true, former_path_note: "These capsules were measured before this endpoint was renamed; each keys the former path, which answers 308 here. The capsules are unchanged." }
      : {}),
    other_endpoints_measured_at_this_origin: siblings,
    ...(renamed.length ? { renamed_since_measured: renamed } : {}),
    note: capsules.length
      ? "Every published capsule about this endpoint, each with its batch root and an inclusion pointer (verify_capsule re-derives inclusion). States only: no verdict, score or ranking."
      : "No published capsule is keyed to this endpoint. NOT_MEASURED is not a finding about the endpoint — nothing here says it is clean or unclean.",
  };
}
