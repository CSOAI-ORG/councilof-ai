/**
 * Public Watchdog journey — pure state mapping for /watchdog.
 *
 * Reads only what is already published: the claim-maintenance register
 * (/spec/claim-maintenance/register.json), the LIVE claim registries it names (/claims/*.json and
 * their signed sidecars), and /api/corrections. No database, no scheduler, no signer, no price.
 *
 * Rules carried here so the page cannot drift from them:
 *  - A count is read from the data (register.totals), never typed.
 *  - Missing data is UNMEASURED. A retrieval that failed is UNCHECKABLE, with the time it was tried.
 *  - Signature validity, root inclusion and the claim's own state are THREE results. Nothing here
 *    combines them into one verdict, and none of them is a finding about the subject.
 */

export const CLAIM_STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"] as const;
export type ClaimState = (typeof CLAIM_STATES)[number];

export const REGISTER_URL = "/spec/claim-maintenance/register.json";
export const CORRECTIONS_URL = "/api/corrections";

/** Missing or unrecognised state words are UNMEASURED: the absence is shown, never filled in. */
export function claimState(raw: unknown): ClaimState {
  return typeof raw === "string" && (CLAIM_STATES as readonly string[]).includes(raw) ? (raw as ClaimState) : "UNMEASURED";
}

/** A retrieval outcome. Failed retrievals are UNCHECKABLE and say when they were tried. */
export type Retrieval<T> =
  | { state: "OK"; value: T; fetchedAt: string; sha256?: string; status: number }
  | { state: "UNCHECKABLE"; reason: string; fetchedAt: string; status?: number };

export function retrievalFailed(reason: string, fetchedAt: string, status?: number): Retrieval<never> {
  return { state: "UNCHECKABLE", reason, fetchedAt, ...(status !== undefined ? { status } : {}) };
}

// ---------------------------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------------------------

export type RegisterSummary = {
  asOf: string | null;
  subjects: number | null;
  claims: number | null;
  byState: Partial<Record<ClaimState, number>>;
  live: { registryId: string; url: string }[];
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Same-site path for a registry URL; anything not on councilof.ai is refused (null). */
export function sitePath(url: string): string | null {
  try {
    const u = new URL(url, "https://councilof.ai");
    if (u.origin !== "https://councilof.ai") return null;
    return /^\/claims\/[A-Za-z0-9._-]+\.json$/.test(u.pathname) ? u.pathname : null;
  } catch {
    return null;
  }
}

export function summariseRegister(raw: unknown): RegisterSummary {
  const r = obj(raw) ?? {};
  const totals = obj(r.totals) ?? {};
  const by = obj(totals.by_state) ?? {};
  const byState: Partial<Record<ClaimState, number>> = {};
  for (const s of CLAIM_STATES) {
    const n = num(by[s]);
    if (n !== null) byState[s] = n;
  }
  const live = (Array.isArray(r.registries) ? r.registries : [])
    .map(obj)
    .filter((x): x is Record<string, unknown> => !!x && x.status === "LIVE")
    .map((x) => ({ registryId: str(x.registry_id), url: str(x.url) ? sitePath(x.url as string) : null }))
    .filter((x): x is { registryId: string; url: string } => !!x.registryId && !!x.url);
  return { asOf: str(r.as_of), subjects: num(totals.subjects), claims: num(totals.claims), byState, live };
}

// ---------------------------------------------------------------------------------------------
// Claims — two published registry shapes, one view
// ---------------------------------------------------------------------------------------------

export type HistoryEvent = { at: string; what: string };
export type Inclusion =
  | { kind: "audit"; leafIndex: number; treeSize: number; path: string[]; root: string; preimage: unknown }
  | { kind: "none"; reason: string };

export type WatchClaim = {
  registryId: string;
  claimId: string;
  subject: string;
  text: string;
  state: ClaimState;
  /** Shown verbatim when the registry gives a reason or result; null means none published. */
  stateNote: string | null;
  sourceUrl: string | null;
  firstCaptured: string | null;
  lastRead: string | null;
  nextRead: string | null;
  history: HistoryEvent[];
  inclusion: Inclusion;
};

function auditFor(merkle: Record<string, unknown> | null, claimId: string, preimage: unknown): Inclusion {
  if (!merkle || !str(merkle.root)) return { kind: "none", reason: "The registry publishes no Merkle root." };
  const root = merkle.root as string;
  const proofs = obj(merkle.inclusion_proofs);
  const p = proofs ? obj(proofs[claimId]) : null;
  if (p && num(p.leaf_index) !== null && num(p.tree_size) !== null && Array.isArray(p.audit_path)) {
    const path = (p.audit_path as unknown[]).map((a) => str(obj(a)?.sibling)).filter((s): s is string => !!s);
    return { kind: "audit", leafIndex: p.leaf_index as number, treeSize: p.tree_size as number, path, root, preimage };
  }
  const leaves = Array.isArray(merkle.leaves) ? merkle.leaves.map(obj) : [];
  const leaf = leaves.find((l) => l && l.id === claimId);
  if (leaf && num(leaf.index) !== null && num(merkle.n_leaves) !== null && Array.isArray(leaf.inclusion_proof)) {
    const path = (leaf.inclusion_proof as unknown[]).filter((s): s is string => typeof s === "string");
    return { kind: "audit", leafIndex: leaf.index as number, treeSize: merkle.n_leaves as number, path, root, preimage };
  }
  return { kind: "none", reason: "The registry publishes no inclusion proof for this claim." };
}

/** Normalise one LIVE registry into claims. Unknown shapes yield no claims, never invented ones. */
export function claimsFromRegistry(raw: unknown): WatchClaim[] {
  const r = obj(raw);
  if (!r) return [];
  const registryId = str(r.registry_id) ?? "unknown-registry";
  const merkle = obj(r.merkle);
  const out: WatchClaim[] = [];

  // Shape A (csoai.claim-registry/0.3): claims[] of claim-maintenance artifacts. Leaf preimage is
  // the artifact with any `sig` field omitted (registry merkle.entry_bytes).
  if (Array.isArray(r.claims)) {
    for (const c of r.claims.map(obj)) {
      if (!c || !str(c.claim_id)) continue;
      const { sig: _sig, ...preimage } = c;
      const subj = obj(c.subject);
      const changes = Array.isArray(c.observed_changes) ? c.observed_changes.map(obj) : [];
      const history: HistoryEvent[] = [];
      if (str(c.first_captured_utc)) history.push({ at: c.first_captured_utc as string, what: "First captured from its public source" });
      for (const ch of changes) if (ch && str(ch.observed_utc)) history.push({ at: ch.observed_utc as string, what: str(ch.note) ?? "Observed change in the page's visible text" });
      if (str(c.access_date)) history.push({ at: c.access_date as string, what: "Last read" });
      out.push({
        registryId,
        claimId: c.claim_id as string,
        subject: str(subj?.name) ?? str(subj?.identifier) ?? "UNMEASURED",
        text: str(c.claim_verbatim) ?? "",
        state: claimState(c.state),
        stateNote: str(c.uncheckable_reason) ?? (typeof c.result === "string" ? c.result : c.result ? JSON.stringify(c.result) : null),
        sourceUrl: str(c.source_url),
        firstCaptured: str(c.first_captured_utc),
        lastRead: str(c.access_date),
        nextRead: str(c.next_read_utc),
        history: sortHistory(history),
        inclusion: auditFor(merkle, c.claim_id as string, preimage),
      });
    }
    return out;
  }

  // Shape B (maintenance run): subjects{key:{source, claims[]}}. Leaf record is the claim with its
  // subject key added (verified against record_sha256 on 2026-10-14).
  const subjects = obj(r.subjects);
  if (subjects) {
    for (const [key, sv] of Object.entries(subjects)) {
      const s = obj(sv);
      for (const c of (Array.isArray(s?.claims) ? s!.claims : []).map(obj)) {
        if (!c || !str(c.id)) continue;
        const m = obj(c.measurement);
        const sources = (Array.isArray(c.sources) ? c.sources : []).map(obj);
        const history: HistoryEvent[] = [];
        if (str(m?.first_observed_at)) history.push({ at: m!.first_observed_at as string, what: "First reading in the series" });
        for (const ch of (Array.isArray(m?.changes) ? (m!.changes as unknown[]) : []).map(obj)) {
          const at = str(ch?.observed_at) ?? str(ch?.at);
          if (at) history.push({ at, what: "Reading changed" });
        }
        if (str(m?.last_observed_at)) history.push({ at: m!.last_observed_at as string, what: "Latest reading" });
        out.push({
          registryId,
          claimId: c.id as string,
          subject: key,
          text: str(c.text) ?? "",
          state: claimState(c.state),
          stateNote: str(m?.reason),
          sourceUrl: str(sources[0]?.url) ?? str((s?.source as string | undefined)?.split(" ")[0]),
          firstCaptured: str(m?.first_observed_at),
          lastRead: str(m?.last_observed_at),
          nextRead: null,
          history: sortHistory(history),
          inclusion: auditFor(merkle, c.id as string, { ...c, subject: key }),
        });
      }
    }
  }
  return out;
}

function sortHistory(h: HistoryEvent[]): HistoryEvent[] {
  const seen = new Set<string>();
  return h
    .filter((e) => (seen.has(e.at + e.what) ? false : (seen.add(e.at + e.what), true)))
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Corrections that name this claim, its registry or its subject. A failed read stays UNCHECKABLE. */
export function correctionsFor(raw: unknown, claim: Pick<WatchClaim, "registryId" | "claimId" | "subject">): { id: string; date: string; text: string }[] {
  const list = Array.isArray(obj(raw)?.corrections) ? (obj(raw)!.corrections as unknown[]) : [];
  const needles = [claim.registryId, `${claim.registryId}#${claim.claimId}`].map((s) => s.toLowerCase());
  return list
    .map(obj)
    .filter((e): e is Record<string, unknown> => !!e)
    .filter((e) => {
      const t = JSON.stringify(e).toLowerCase();
      return needles.some((n) => t.includes(n));
    })
    .map((e) => ({ id: str(e.id) ?? "UNRECORDED", date: str(e.date) ?? "UNRECORDED", text: str(e.what_was_wrong) ?? str(e.what_changed) ?? "" }));
}

// ---------------------------------------------------------------------------------------------
// Stable re-fetch URL
// ---------------------------------------------------------------------------------------------

const ID_RE = /^[A-Za-z0-9._-]{1,120}$/;

export function claimHref(registryId: string, claimId: string): string {
  return `/watchdog/?registry=${encodeURIComponent(registryId)}&claim=${encodeURIComponent(claimId)}`;
}

export function libraryHref(): string {
  return "/watchdog/?view=library";
}

export type JourneyParams = { view: "claims" | "library"; registry: string | null; claim: string | null };

/** Parse ?registry=&claim=&view=. Malformed ids are dropped, not guessed at. */
export function parseJourney(search: string): JourneyParams {
  const q = new URLSearchParams(search);
  const ok = (v: string | null) => (v && ID_RE.test(v) ? v : null);
  return { view: q.get("view") === "library" ? "library" : "claims", registry: ok(q.get("registry")), claim: ok(q.get("claim")) };
}

/** The registry bytes behind a claim URL: always the published file, never a cached copy. */
export function registryPath(registryId: string): string | null {
  return ID_RE.test(registryId) ? `/claims/${registryId}.json` : null;
}
export function sidecarPath(registryId: string): string | null {
  return ID_RE.test(registryId) ? `/claims/${registryId}.signed.json` : null;
}
export function verifierHref(registryId: string): string | null {
  const p = sidecarPath(registryId);
  return p ? `/gspc-verify/?card=${encodeURIComponent(p)}` : null;
}

// ---------------------------------------------------------------------------------------------
// Three results, never one
// ---------------------------------------------------------------------------------------------

export type ResultWord = "VALID" | "INVALID" | "UNCHECKABLE" | "NOT RUN";
export type ThreeResults = {
  signature: { result: ResultWord; detail: string };
  inclusion: { result: "INCLUDED" | "NOT INCLUDED" | "UNCHECKABLE" | "NOT RUN"; detail: string };
  conclusion: { state: ClaimState; detail: string };
};

export function signatureResult(verifierState: string | null, pinnedSha: string | null, fetchedSha: string | null, reasons: string[] = []): ThreeResults["signature"] {
  if (verifierState === null) return { result: "NOT RUN", detail: "Press Verify to check the signed sidecar in this browser." };
  const pin =
    pinnedSha && fetchedSha
      ? pinnedSha === fetchedSha
        ? " The sidecar pins these registry bytes by sha256, and they match."
        : " The sidecar pins a different sha256 from the registry bytes fetched now."
      : " The sidecar's pin could not be compared with the fetched bytes.";
  const word: ResultWord = verifierState === "VALID" || verifierState === "INVALID" ? verifierState : "UNCHECKABLE";
  const why = reasons.length ? ` (${reasons.join(", ")})` : "";
  return { result: word, detail: `The free verifier answered ${verifierState}${why}.${pin}` };
}

export function conclusionResult(c: Pick<WatchClaim, "state" | "stateNote">): ThreeResults["conclusion"] {
  const base: Record<ClaimState, string> = {
    CLAIM_CAPTURED: "Captured verbatim and dated. Nothing measured.",
    CLAIM_MEASURED: "A measurement against public evidence sits beside the claim. It is not a verdict.",
    UNMEASURED: "No measurement has been run.",
    UNCHECKABLE: "No public evidence can settle it. This is about the evidence, not the subject.",
  };
  return { state: c.state, detail: c.stateNote ? `${base[c.state]} ${c.stateNote}` : base[c.state] };
}

// ---------------------------------------------------------------------------------------------
// RFC 9162 §2.1.3.2 inclusion verification (WebCrypto only)
// ---------------------------------------------------------------------------------------------

/** Canonical JSON: keys sorted by code point, no whitespace, UTF-8 (registry merkle rules). */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
}

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h: string) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));

export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

async function h(prefix: number, ...parts: Uint8Array[]): Promise<Uint8Array> {
  const len = 1 + parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(len);
  buf[0] = prefix;
  let o = 1;
  for (const p of parts) {
    buf.set(p, o);
    o += p.length;
  }
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}

export async function verifyInclusion(inc: Inclusion): Promise<ThreeResults["inclusion"]> {
  if (inc.kind === "none") return { result: "UNCHECKABLE", detail: inc.reason };
  if (!/^[0-9a-f]{64}$/i.test(inc.root) || inc.path.some((p) => !/^[0-9a-f]{64}$/i.test(p)))
    return { result: "UNCHECKABLE", detail: "The proof is not in the published hex form." };
  let fn = inc.leafIndex;
  let sn = inc.treeSize - 1;
  if (fn < 0 || fn > sn) return { result: "UNCHECKABLE", detail: "The leaf index is outside the tree." };
  let r = await h(0x00, new TextEncoder().encode(canonicalJson(inc.preimage)));
  for (const p of inc.path) {
    const sib = unhex(p);
    if (sn === 0) return { result: "NOT INCLUDED", detail: "The audit path is longer than the tree allows." };
    if (fn % 2 === 1 || fn === sn) {
      r = await h(0x01, sib, r);
      if (fn % 2 === 0) while (fn % 2 === 0 && fn !== 0) {
        fn = Math.floor(fn / 2);
        sn = Math.floor(sn / 2);
      }
    } else {
      r = await h(0x01, r, sib);
    }
    fn = Math.floor(fn / 2);
    sn = Math.floor(sn / 2);
  }
  const ok = sn === 0 && hex(r.buffer as ArrayBuffer) === inc.root.toLowerCase();
  return ok
    ? { result: "INCLUDED", detail: `This claim's bytes hash into the published root ${inc.root.slice(0, 12)}… (leaf ${inc.leafIndex} of ${inc.treeSize}).` }
    : { result: "NOT INCLUDED", detail: "These claim bytes do not hash into the published root." };
}

// ---------------------------------------------------------------------------------------------
// Evidence links
// ---------------------------------------------------------------------------------------------

/** Zenodo record ids found tombstoned (HTTP 410) on a live check, and when. */
export type Tombstones = { checkedOn: string; ids: readonly string[] };

export function zenodoId(url: string): string | null {
  const m = url.match(/zenodo\.(?:org\/records?\/)?(\d{6,})/i) ?? url.match(/10\.5281\/zenodo\.(\d+)/i);
  return m ? m[1] : null;
}

/** A link to a tombstoned record is UNCHECKABLE with its check date; it is never shown as present. */
export function evidenceLinkState(url: string, t: Tombstones): { state: "LINKED" | "UNCHECKABLE"; note: string } {
  const id = zenodoId(url);
  if (id && t.ids.includes(id)) return { state: "UNCHECKABLE", note: `Zenodo record ${id} returned 410 (deleted) when checked on ${t.checkedOn}.` };
  return { state: "LINKED", note: "Opens the published source. Its content today may differ from the hash recorded here." };
}
