// functions/api/_witness.ts — shared pieces of the "attest what you're shown" rail
// (/api/witness and /api/witness/status). Leading underscore: code, never a route.
//
// WHAT THIS RAIL SELLS: existence of a SHA-256 digest at a time — a public.notice leaf in the
// next hourly public root (Ed25519 under did:web:csoai.org#board-attestation-1), an RFC-3161
// timestamp over the digest from a documented public TSA, and the ONE root's free anchors
// (Rekor + OpenTimestamps via scripts/witness_public_root.py). Nothing about the content, its
// legality, or its provenance is asserted, ever. Verification stays free.
//
// WHAT IT NEVER DOES: store or republish bytes (buyer-supplied bytes are hashed and dropped);
// bypass a login, a paywall, or a bot check (401/403/407/429, WWW-Authenticate, a challenge
// page, a redirect into a sign-in wall → UNCHECKABLE, no payment taken); ignore robots.txt
// (a Disallow for our agent is evidence of non-authorisation → UNCHECKABLE). A self-signed
// Ed25519 card carries no legal presumption — it is evidence of existence of a digest only,
// and no surface here may call it more than that.
import { sha256Hex } from "../_lib/cardSign";

export const WITNESS_SCHEMA = "csoai.witness/0.1";
export const ENTRY_SCHEMA = "csoai.witness-entry/0.1";
export const LEAF_KIND = "csoai.witness.hash/0.1";
export const ATTESTS =
  "existence of this digest at the root's as_of — nothing about its content, legality, or provenance";
export const PRESUMPTION =
  "A self-signed Ed25519 attestation carries no legal presumption. It records that this digest existed at the stated time — nothing about the bytes behind it.";
export const UA = "csoai-witness/0.1 (+https://councilof.ai/api/witness; nicholas@csoai.org)";
export const ROBOTS_TOKEN = "csoai-witness";
export const DEFAULT_TSA = "https://freetsa.org/tsr";
export const MAX_POST_BYTES = 4 * 1024 * 1024; // buyer-supplied bytes: hashed, then discarded
export const MAX_FETCH_BYTES = 16 * 1024 * 1024; // a URL response larger than this is UNCHECKABLE
export const SHA_RE = /^[0-9a-f]{64}$/;
export const LABEL_RE = /^[A-Za-z0-9 ._:/@+#()-]{0,120}$/;
/** The eater's verdict vocabulary — a label carrying any of it never reaches a signed leaf. */
export const VERDICT_RE =
  /\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b|(?<!UN)MEASURED/i;

export const kvKey = (sha256: string): string => `witness:${sha256}`;

export type Rfc3161 = {
  tsa: string;
  status: "TIMESTAMPED" | "UNCHECKABLE";
  reason: string | null;
  /** base64 of the full TimeStampResp (DER) — verifiable with `openssl ts -verify`. */
  token_b64: string | null;
  token_sha256: string | null;
  requested_at: string;
};

export type WitnessEntry = {
  schema: typeof ENTRY_SCHEMA;
  sha256: string;
  label: string;
  /** Kept for the buyer's record only; never in a leaf, never on the free status surface. */
  url: string | null;
  url_hash: string | null;
  fetched_at: string;
  http_status: number | null;
  headers: Record<string, string> | null;
  payment_ref: string;
  payer: string | null;
  network: string | null;
  rfc3161_tsa: string;
  rfc3161_status: Rfc3161["status"];
  rfc3161_reason: string | null;
  rfc3161_token: string | null;
  rfc3161_token_sha256: string | null;
  status: "queued" | "witnessed";
  queued_at: string;
  witnessed: {
    root_as_of: string;
    merkle_root: string;
    card_sha256: string;
    card_url: string;
    proof_url: string;
    anchors?: Record<string, unknown>;
  } | null;
};

export const nowIso = (): string => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });

/** The fields of an entry that are public: no url, no token bytes duplicated beyond the reply. */
export function publicView(e: WitnessEntry): Record<string, unknown> {
  return {
    sha256: e.sha256,
    label: e.label,
    url_hash: e.url_hash,
    fetched_at: e.fetched_at,
    http_status: e.http_status,
    headers: e.headers,
    payment_ref: e.payment_ref,
    rfc3161: {
      tsa: e.rfc3161_tsa,
      status: e.rfc3161_status,
      reason: e.rfc3161_reason,
      token_sha256: e.rfc3161_token_sha256,
      token_b64: e.rfc3161_token,
    },
    status: e.status,
    queued_at: e.queued_at,
    witnessed: e.witnessed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Target URL guard — public https hostnames only. Never an IP literal, never a private
// name, never credentials in the URL, never a non-default port (a Pages Function must not
// become a fetch proxy into anyone's network).
// ─────────────────────────────────────────────────────────────────────────────
const PRIVATE_HOST_RE = /(^|\.)(localhost|local|internal|intranet|lan|home|corp|arpa|test|invalid|example)$/i;
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export function guardTarget(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  if (!raw || raw.length > 2048) return { ok: false, reason: "url: 1–2048 chars" };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: "url: not parseable" };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "url: https only" };
  if (u.username || u.password) return { ok: false, reason: "url: credentials in the URL are never used" };
  if (u.port && u.port !== "443") return { ok: false, reason: "url: default port only" };
  const host = u.hostname.toLowerCase();
  if (host.startsWith("[") || host.includes(":") || IPV4_RE.test(host)) return { ok: false, reason: "url: public hostname only, never an IP literal" };
  if (!host.includes(".") || PRIVATE_HOST_RE.test(host)) return { ok: false, reason: "url: public hostname only" };
  u.hash = "";
  return { ok: true, url: u };
}

// ─────────────────────────────────────────────────────────────────────────────
// robots.txt — evidence of (non-)authorisation. Group selection per RFC 9309: the most
// specific matching user-agent group wins, else `*`, else no rules (allowed). Longest
// matching path rule wins; Allow beats Disallow on equal length.
// ─────────────────────────────────────────────────────────────────────────────
export type RobotsVerdict = { group: "agent" | "*" | "none"; allowed: boolean; rule: string | null };

function ruleToRegex(rule: string): RegExp {
  const anchored = rule.endsWith("$");
  const body = (anchored ? rule.slice(0, -1) : rule)
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

export function robotsAllows(txt: string, agentToken: string, pathWithQuery: string): RobotsVerdict {
  type Group = { agents: string[]; rules: { allow: boolean; path: string }[] };
  const groups: Group[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (field === "allow" || field === "disallow") cur.rules.push({ allow: field === "allow", path: value });
  }
  const token = agentToken.toLowerCase();
  let chosen = groups.find((g) => g.agents.some((a) => a !== "*" && (token.includes(a) || a.includes(token))));
  let which: RobotsVerdict["group"] = "agent";
  if (!chosen) {
    chosen = groups.find((g) => g.agents.includes("*"));
    which = chosen ? "*" : "none";
  }
  if (!chosen) return { group: "none", allowed: true, rule: null };
  let best: { allow: boolean; path: string } | null = null;
  for (const r of chosen.rules) {
    if (r.path === "") continue; // an empty Disallow allows everything
    if (!ruleToRegex(r.path).test(pathWithQuery)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow && !best.allow)) best = r;
  }
  if (!best) return { group: which, allowed: true, rule: null };
  return { group: which, allowed: best.allow, rule: `${best.allow ? "Allow" : "Disallow"}: ${best.path}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch once — our own UA, robots honoured, never through an auth wall. Returns the hash
// and a small header subset; the bytes are dropped on return.
// ─────────────────────────────────────────────────────────────────────────────
export type FetchOutcome = {
  status: "HASHED" | "UNCHECKABLE";
  reason: string | null;
  sha256: string | null;
  http_status: number | null;
  bytes: number | null;
  headers: Record<string, string> | null;
  fetched_at: string;
  redirected: boolean;
  robots: { http_status: number | null; sha256: string | null } & RobotsVerdict;
};

const HEADER_SUBSET = ["content-type", "content-length", "etag", "last-modified", "date", "server", "cache-control"];
const WALL_STATUS = new Set([401, 403, 407, 429]);
const CHALLENGE_BODY_RE = /cf-chl|__cf_chl|challenge-platform|g-recaptcha|hcaptcha|cf_captcha|captcha-delivery|Just a moment/i;
const SIGNIN_PATH_RE = /(^|\/)(login|log-in|signin|sign-in|sso|auth|oauth|account\/login)(\/|$)/i;

async function robotsFor(u: URL): Promise<FetchOutcome["robots"]> {
  const origin = `${u.protocol}//${u.host}`;
  try {
    const r = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": UA, accept: "text/plain,*/*" }, redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (r.status !== 200) return { http_status: r.status, sha256: null, group: "none", allowed: true, rule: null };
    const buf = new Uint8Array(await r.arrayBuffer());
    const txt = new TextDecoder("utf-8").decode(buf.slice(0, 512 * 1024));
    return { http_status: 200, sha256: await sha256Hex(buf), ...robotsAllows(txt, ROBOTS_TOKEN, u.pathname + u.search) };
  } catch {
    return { http_status: null, sha256: null, group: "none", allowed: true, rule: null };
  }
}

export async function fetchOnce(u: URL): Promise<FetchOutcome> {
  const fetched_at = nowIso();
  const robots = await robotsFor(u);
  const base = { sha256: null, http_status: null, bytes: null, headers: null, fetched_at, redirected: false, robots };
  if (!robots.allowed) {
    return { ...base, status: "UNCHECKABLE", reason: `robots.txt ${robots.rule} for ${robots.group === "agent" ? ROBOTS_TOKEN : "*"} — evidence of non-authorisation; not fetched` };
  }
  let res: Response;
  try {
    res = await fetch(u.toString(), { headers: { "user-agent": UA, accept: "*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  } catch (e) {
    return { ...base, status: "UNCHECKABLE", reason: `fetch failed: ${(e as Error).name || "error"}` };
  }
  const headers: Record<string, string> = {};
  for (const h of HEADER_SUBSET) {
    const v = res.headers.get(h);
    if (v) headers[h] = v.slice(0, 200);
  }
  const redirected = res.redirected;
  const common = { ...base, http_status: res.status, headers, redirected };
  if (WALL_STATUS.has(res.status) || res.headers.get("www-authenticate") || res.headers.get("cf-mitigated")) {
    return { ...common, status: "UNCHECKABLE", reason: `HTTP ${res.status} — an access wall (auth, forbidden, rate-limit or bot check); never bypassed` };
  }
  if (redirected) {
    try {
      if (SIGNIN_PATH_RE.test(new URL(res.url).pathname)) return { ...common, status: "UNCHECKABLE", reason: "redirected into a sign-in wall; never followed" };
    } catch {
      /* unparseable final URL: fall through to the body checks */
    }
  }
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > MAX_FETCH_BYTES) return { ...common, status: "UNCHECKABLE", reason: `response declares ${declared} bytes > ${MAX_FETCH_BYTES} cap` };
  let buf: ArrayBuffer;
  try {
    buf = await res.arrayBuffer();
  } catch (e) {
    return { ...common, status: "UNCHECKABLE", reason: `body read failed: ${(e as Error).name || "error"}` };
  }
  if (buf.byteLength > MAX_FETCH_BYTES) return { ...common, status: "UNCHECKABLE", reason: `response ${buf.byteLength} bytes > ${MAX_FETCH_BYTES} cap` };
  const head = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 4096)));
  if ((res.status === 503 || res.status === 200) && CHALLENGE_BODY_RE.test(head)) {
    return { ...common, status: "UNCHECKABLE", reason: `HTTP ${res.status} answered with a bot-check page, not the resource; never solved` };
  }
  if (res.status < 200 || res.status >= 300) return { ...common, status: "UNCHECKABLE", reason: `HTTP ${res.status} is not a 2xx representation of the resource` };
  const sha256 = await sha256Hex(new Uint8Array(buf));
  return { ...common, status: "HASHED", reason: null, sha256, bytes: buf.byteLength };
}

// ─────────────────────────────────────────────────────────────────────────────
// RFC-3161 — hand-rolled DER for a TimeStampReq over SHA-256 (no npm deps in Pages Functions).
//   TimeStampReq ::= SEQUENCE { version INTEGER 1, messageImprint MessageImprint,
//                               nonce INTEGER OPTIONAL, certReq BOOLEAN DEFAULT FALSE }
//   MessageImprint ::= SEQUENCE { hashAlgorithm AlgorithmIdentifier, hashedMessage OCTET STRING }
// The reply (TimeStampResp) is kept whole so `openssl ts -verify -in reply.tsr -digest <hex>
// -CAfile <tsa chain>` recomputes it without us.
// ─────────────────────────────────────────────────────────────────────────────
const OID_SHA256 = Uint8Array.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01]);

function derLen(n: number): number[] {
  if (n < 0x80) return [n];
  const bytes: number[] = [];
  let v = n;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

export function tlv(tag: number, content: Uint8Array): Uint8Array {
  return Uint8Array.from([tag, ...derLen(content.byteLength), ...content]);
}

function derUint(bytes: Uint8Array): Uint8Array {
  // positive INTEGER: strip leading zeros, then pad one 0x00 if the high bit is set
  let i = 0;
  while (i < bytes.length - 1 && bytes[i] === 0) i++;
  const body = bytes.slice(i);
  return tlv(0x02, body[0] & 0x80 ? Uint8Array.from([0, ...body]) : body);
}

export function derTimeStampReq(digest: Uint8Array, nonce: Uint8Array): Uint8Array {
  if (digest.byteLength !== 32) throw new Error("digest must be 32 bytes (SHA-256)");
  const algo = tlv(0x30, Uint8Array.from([...OID_SHA256, 0x05, 0x00])); // sha256 + NULL params
  const imprint = tlv(0x30, Uint8Array.from([...algo, ...tlv(0x04, digest)]));
  const version = derUint(Uint8Array.from([1]));
  const certReq = Uint8Array.from([0x01, 0x01, 0xff]);
  return tlv(0x30, Uint8Array.from([...version, ...imprint, ...derUint(nonce), ...certReq]));
}

/** Read one TLV at `off`: [tag, contentStart, contentEnd] or null when malformed. */
function readTlv(b: Uint8Array, off: number): [number, number, number] | null {
  if (off + 2 > b.length) return null;
  const tag = b[off];
  let len = b[off + 1];
  let p = off + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4 || p + n > b.length) return null;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | b[p + i];
    p += n;
  }
  if (p + len > b.length) return null;
  return [tag, p, p + len];
}

function indexOfBytes(hay: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * parseTimeStampResp — minimal, honest check: PKIStatus is granted (0) or grantedWithMods (1),
 * a timeStampToken follows, and the TSTInfo inside it carries our digest and our nonce.
 * Anything else is UNCHECKABLE with the reason. Full signature verification is the buyer's
 * (openssl ts -verify) — we never claim more than "the TSA answered with a token over this digest".
 */
export function parseTimeStampResp(bytes: Uint8Array, digest: Uint8Array, nonce: Uint8Array): { ok: boolean; status: number | null; reason: string | null } {
  const outer = readTlv(bytes, 0);
  if (!outer || outer[0] !== 0x30) return { ok: false, status: null, reason: "reply is not a DER SEQUENCE" };
  const statusInfo = readTlv(bytes, outer[1]);
  if (!statusInfo || statusInfo[0] !== 0x30) return { ok: false, status: null, reason: "reply lacks PKIStatusInfo" };
  const st = readTlv(bytes, statusInfo[1]);
  if (!st || st[0] !== 0x02) return { ok: false, status: null, reason: "PKIStatusInfo lacks status" };
  let status = 0;
  for (let i = st[1]; i < st[2]; i++) status = (status << 8) | bytes[i];
  if (status !== 0 && status !== 1) return { ok: false, status, reason: `TSA status ${status} (not granted)` };
  const token = readTlv(bytes, statusInfo[2]);
  if (!token || token[0] !== 0x30 || token[2] > outer[2]) return { ok: false, status, reason: "granted but no timeStampToken present" };
  if (indexOfBytes(bytes, digest) < 0) return { ok: false, status, reason: "token does not carry our messageImprint" };
  if (indexOfBytes(bytes, nonce) < 0) return { ok: false, status, reason: "token does not carry our nonce" };
  return { ok: true, status, reason: null };
}

const b64 = (bytes: Uint8Array): string => {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};
const fromHex = (h: string): Uint8Array => Uint8Array.from(h.match(/../g)!.map((x) => parseInt(x, 16)));

export async function requestTimestamp(tsa: string, digestHex: string): Promise<Rfc3161> {
  const requested_at = nowIso();
  const digest = fromHex(digestHex);
  const nonce = crypto.getRandomValues(new Uint8Array(8));
  nonce[0] &= 0x7f; // keep the INTEGER positive and byte-for-byte searchable in the reply
  const fail = (reason: string): Rfc3161 => ({ tsa, status: "UNCHECKABLE", reason, token_b64: null, token_sha256: null, requested_at });
  let res: Response;
  try {
    res = await fetch(tsa, {
      method: "POST",
      headers: { "content-type": "application/timestamp-query", accept: "application/timestamp-reply", "user-agent": UA },
      body: derTimeStampReq(digest, nonce),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    return fail(`TSA unreachable: ${(e as Error).name || "error"}`);
  }
  if (res.status !== 200) return fail(`TSA HTTP ${res.status}`);
  const reply = new Uint8Array(await res.arrayBuffer());
  if (reply.byteLength === 0 || reply.byteLength > 64 * 1024) return fail(`TSA reply ${reply.byteLength} bytes (empty or over cap)`);
  const parsed = parseTimeStampResp(reply, digest, nonce);
  if (!parsed.ok) return fail(parsed.reason || "TSA reply not accepted");
  return { tsa, status: "TIMESTAMPED", reason: null, token_b64: b64(reply), token_sha256: await sha256Hex(reply), requested_at };
}
