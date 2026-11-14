/**
 * POST /api/board-sign — two callers, one key.
 * Signs a card-v0 payload with Pages secret BOARD_SIGN_KEY_PKCS8_B64.
 * The PKCS8 never leaves Cloudflare. Never logs the key. Not a grade.
 *
 * Caller authentication (the key is the same either way; the response names which):
 *   - GitHub OIDC bearer (a JWT) from an allow-listed workflow — the original path.
 *   - The pod caller token (Pages secret BOARD_SIGN_POD_TOKEN), ruled 2026-09-22 when
 *     GitHub Actions had been disabled on the account for a week. The token is a bearer
 *     capability; it is compared by digest, never echoed.
 *     A JWT-shaped bearer is never tried against the pod token, and vice versa.
 *
 * Signing move, step 2 of 9 (2026-10-13). What changed here, and what did not:
 *   - The OIDC acceptance rule is UNCHANGED. verifyOidc still decides, by the same checks in
 *     the same order. It now also returns the claims it verified.
 *   - strictVerdict() is the rule a later step will enforce. Here it is computed and echoed in
 *     the reply so a week of real runs can be read before anything is refused. It decides nothing.
 *   - The pod-token route signs two record shapes only: the daily x402 release sidecar and the
 *     weekly census sidecars. Those are the two scheduled jobs that used the token on
 *     2026-10-11 and 2026-10-13 (their public records are the test fixtures). Anything else on
 *     that route is refused with 403: a card, a root, a corrections or ruling attestation, an
 *     unlabelled object.
 *   - Each pod-token signature leaves one best-effort line in a rolling list of the last 20.
 *     The write happens after the reply is built and its failure is swallowed, so signing never
 *     waits on it and never fails because of it. Nothing is read or written on the OIDC path.
 */
import { canonicalBytes, signLabelViolation } from "../_lib/cardSign";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const AUD = "https://councilof.ai/api/board-sign";
const ISS = "https://token.actions.githubusercontent.com";
const REPO = "CSOAI-ORG/councilof-ai";
const DID = "did:web:csoai.org#board-attestation-1";

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Canonical form lives in ONE place (functions/_lib/cardSign.ts) — shared with the metered
// endpoints that issue card-v0 leaves, so no two signers can disagree on the preimage.
const canonical = canonicalBytes;

type Claims = Record<string, unknown>;

/** Throws unless the token passes. Returns the claims of the token it verified. */
async function verifyOidc(token: string): Promise<Claims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("jwt");
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0]))) as { kid?: string; alg?: string };
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))) as Record<string, unknown>;
  if (header.alg !== "RS256") throw new Error("alg");
  if (payload.iss !== ISS) throw new Error("iss");
  const aud = payload.aud;
  const allowed = new Set([AUD, "https://councilof.ai", "https://github.com/CSOAI-ORG/councilof-ai"]);
  const audList = Array.isArray(aud) ? aud : [aud];
  if (!audList.some((a) => typeof a === "string" && allowed.has(a))) throw new Error("aud");
  if (payload.repository !== REPO) throw new Error("repo");
  const wf = String(payload.job_workflow_ref || payload.workflow || payload.workflow_ref || "");
  const allowedWf = ["public-root", "hf-fin-shells", "hf-inference-mill", "auto-eat-sign"];
  if (!allowedWf.some((w) => wf.includes(w))) throw new Error("workflow");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now() - 30_000) throw new Error("exp");
  const jwks = (await (await fetch(`${ISS}/.well-known/jwks`)).json()) as { keys: JsonWebKey[] };
  const jwk = jwks.keys.find((k) => (k as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(parts[2]) as BufferSource,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new Error("sig");
  return payload;
}

// ---------------------------------------------------------------------------------------------
// The strict rule. OBSERVED ONLY in this step: it is computed for every OIDC signature and echoed
// in the reply, and it refuses nothing. The substring list in verifyOidc above still decides.
// ---------------------------------------------------------------------------------------------
const STRICT_WORKFLOW_FILES = ["public-root.yml", "hf-fin-shells.yml", "hf-fin-shells-measure.yml", "hf-fin-shells-attest.yml"];
const STRICT_REF = "refs/heads/master";
// Read from GET https://api.github.com/repos/CSOAI-ORG/councilof-ai on 2026-10-13 (.id and
// .owner.id). A repository deleted and re-created under the same name keeps its name and
// changes these numbers. GitHub puts both in the token as strings.
const STRICT_REPOSITORY_ID = "1154282848";
const STRICT_REPOSITORY_OWNER_ID = "260596236";

export type StrictVerdict = { pass: boolean; reason: string | null };

const idText = (v: unknown): string => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/**
 * Would the strict rule accept a token with these claims? Pure: no clock, no network, no env.
 * Pass needs all of: job_workflow_ref and workflow_ref each exactly one of the four workflow
 * files at refs/heads/master; ref refs/heads/master; aud exactly the signer URL (one string,
 * not a list); a numeric exp; and the repository and owner ids above.
 */
export function strictVerdict(claims: Record<string, unknown>): StrictVerdict {
  const refuse = (reason: string): StrictVerdict => ({ pass: false, reason });
  const exact = STRICT_WORKFLOW_FILES.map((f) => `${REPO}/.github/workflows/${f}@${STRICT_REF}`);
  if (typeof claims.job_workflow_ref !== "string" || !exact.includes(claims.job_workflow_ref)) {
    return refuse("job_workflow_ref is not one of the four signing workflow files at refs/heads/master");
  }
  if (typeof claims.workflow_ref !== "string" || !exact.includes(claims.workflow_ref)) {
    return refuse("workflow_ref is not one of the four signing workflow files at refs/heads/master");
  }
  if (claims.ref !== STRICT_REF) return refuse("ref is not refs/heads/master");
  if (claims.aud !== AUD) return refuse("aud is not exactly https://councilof.ai/api/board-sign");
  if (typeof claims.exp !== "number") return refuse("exp is missing or not a number");
  if (idText(claims.repository_id) !== STRICT_REPOSITORY_ID) return refuse("repository_id is not this repository");
  if (idText(claims.repository_owner_id) !== STRICT_REPOSITORY_OWNER_ID) return refuse("repository_owner_id is not this organisation");
  return { pass: true, reason: null };
}

const claimText = (v: unknown): string | null => (typeof v === "string" ? v : typeof v === "number" ? String(v) : null);

/** The unsigned echo returned beside a signature. It is NOT inside the signed bytes. */
function callerEcho(route: SignerAuth, claims: Claims | null) {
  const c = claims || {};
  return {
    route,
    job_workflow_ref: claimText(c.job_workflow_ref),
    workflow_ref: claimText(c.workflow_ref),
    ref: claimText(c.ref),
    sha: claimText(c.sha),
    event_name: claimText(c.event_name),
    run_id: claimText(c.run_id),
    run_attempt: claimText(c.run_attempt),
    strict: claims ? strictVerdict(claims) : null,
    note: "Echo of the caller's verified token claims. Not part of the signed bytes. strict is observed, not enforced.",
  };
}

// ---------------------------------------------------------------------------------------------
// The pod-token route, narrowed. It signs a sidecar that pins one published file by sha256, for
// two producers only. The key lists are the exact top-level keys of the public records
//   https://huggingface.co/datasets/csoai/x402-bazaar-conformance  release-2026-10-13.signed.json
//   https://huggingface.co/datasets/csoai/mcp-remote-census        record.2026-10-11.signed.json
// (and the two sibling census datasets), copied into functions/api/__fixtures__/board-sign-static/.
// A key outside the list is refused, so a card or an attestation cannot ride under a sidecar label.
// ---------------------------------------------------------------------------------------------
const SIDECAR_SCHEMA = "csoai.signed-artifact/0.1";
const SIDECAR_ARTIFACT_KEYS = ["as_of", "path", "schema", "sha256"];
const SIDECAR_BASE_KEYS = ["schema", "artifact", "signer", "not_a_grade"];
const STATIC_SHAPES: { name: string; path: RegExp; keys: string[] }[] = [
  {
    name: "x402-release",
    path: /^datasets\/csoai\/x402-bazaar-conformance\/release-\d{4}-\d{2}-\d{2}\.json$/,
    keys: [...SIDECAR_BASE_KEYS, "rows", "headline", "published_files"],
  },
  {
    name: "census-record",
    path: /^datasets\/csoai\/(?:mcp-remote-census|hf-mcp-spaces-census|a2a-card-census)\/record\.\d{4}-\d{2}-\d{2}\.json$/,
    keys: [...SIDECAR_BASE_KEYS, "read_state", "n_planned", "n_attempted", "states", "changes", "published_files"],
  },
];
const STATIC_REFUSAL = "the pod-token route signs only the daily x402 release sidecar and the weekly census sidecars";

export type StaticVerdict = { ok: boolean; shape: string | null; artifact_path: string | null; reason: string | null };

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** May the pod-token route sign this payload? Pure. Reads the payload only. */
export function staticRouteVerdict(payload: unknown): StaticVerdict {
  const no = (reason: string): StaticVerdict => ({ ok: false, shape: null, artifact_path: null, reason });
  if (!isPlainObject(payload)) return no("payload is not an object");
  if (payload.schema !== SIDECAR_SCHEMA) return no(`payload.schema is not ${SIDECAR_SCHEMA}`);
  const artifact = payload.artifact;
  if (!isPlainObject(artifact)) return no("payload.artifact is not an object");
  const artifactKeys = Object.keys(artifact).sort();
  if (artifactKeys.length !== SIDECAR_ARTIFACT_KEYS.length || artifactKeys.some((k, i) => k !== SIDECAR_ARTIFACT_KEYS[i])) {
    return no("payload.artifact must have exactly the keys as_of, path, schema, sha256");
  }
  const path = artifact.path;
  if (typeof path !== "string") return no("payload.artifact.path is not a string");
  const shape = STATIC_SHAPES.find((s) => s.path.test(path));
  if (!shape) return no("payload.artifact.path is not a dated x402 release or weekly census record");
  if (typeof artifact.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(artifact.sha256)) {
    return no("payload.artifact.sha256 is not 64 lowercase hex characters");
  }
  if (typeof artifact.schema !== "string" || !artifact.schema || typeof artifact.as_of !== "string" || !artifact.as_of) {
    return no("payload.artifact.schema and payload.artifact.as_of must be non-empty strings");
  }
  const unknown = Object.keys(payload).filter((k) => !shape.keys.includes(k));
  if (unknown.length) {
    return no(`payload has ${unknown.length} top-level key(s) the ${shape.name} sidecar does not use (first: ${unknown[0].slice(0, 40)})`);
  }
  return { ok: true, shape: shape.name, artifact_path: path, reason: null };
}

// One rolling key in the namespace already bound for /api/witness. That queue lists and reads
// only keys starting "witness:" (functions/api/_witness.ts kvKey; scripts/adapters/witness_queue.py
// KV_PREFIX), so this key is invisible to it.
const STATIC_RECENT_KEY = "boardsign:static:recent";
const STATIC_RECENT_MAX = 20;

type StaticUse = { signed_at: string; payload_sha256: string; artifact_path: string };

function cleanRecent(v: unknown): StaticUse[] {
  if (!Array.isArray(v)) return [];
  const out: StaticUse[] = [];
  for (const e of v) {
    if (!isPlainObject(e)) continue;
    if (typeof e.signed_at !== "string" || typeof e.payload_sha256 !== "string" || typeof e.artifact_path !== "string") continue;
    out.push({ signed_at: e.signed_at, payload_sha256: e.payload_sha256, artifact_path: e.artifact_path });
    if (out.length >= STATIC_RECENT_MAX) break;
  }
  return out;
}

/**
 * Best effort, newest first. Read-modify-write on one key: two pod-token signatures seconds apart
 * can lose a line (the store is last-write-wins). This list is a convenience for the reader of the
 * 401 below, not a ledger; the published record is the evidence of what was signed.
 * A failed read throws and nothing is written (the list is kept). A value that is not JSON is
 * replaced, so a damaged list repairs itself on the next use.
 */
async function recordStaticUse(env: Env, use: StaticUse): Promise<void> {
  const kv = env.WITNESS_KV;
  if (!kv) return;
  const raw = await kv.get(STATIC_RECENT_KEY);
  let prior: StaticUse[] = [];
  try {
    prior = cleanRecent(raw ? JSON.parse(raw) : []);
  } catch {
    prior = [];
  }
  await kv.put(STATIC_RECENT_KEY, JSON.stringify([use, ...prior].slice(0, STATIC_RECENT_MAX)));
}

/** Never throws. `recent` is null when the list could not be read, and [] when it read as empty. */
async function staticRouteStatus(env: Env): Promise<Record<string, unknown>> {
  const base = {
    state: "narrowed",
    signs_only: STATIC_SHAPES.map((s) => s.name),
    note: "recent is a best-effort, unsigned list of the last pod-token signatures; a line can be lost.",
  };
  const kv = env.WITNESS_KV;
  if (!kv) return { ...base, recent: null, recent_state: "STORE_NOT_BOUND" };
  try {
    return { ...base, recent: cleanRecent(await kv.get(STATIC_RECENT_KEY, { type: "json", cacheTtl: 60 })), recent_state: "READ" };
  } catch {
    return { ...base, recent: null, recent_state: "UNREADABLE" };
  }
}

type Env = { BOARD_SIGN_KEY_PKCS8_B64: string; BOARD_SIGN_POD_TOKEN?: string; WITNESS_KV?: KVNamespace };

// Constant-time-by-construction: compare SHA-256 digests of both strings, so neither the
// length nor the position of the first mismatch is observable from timing.
async function podTokenMatches(presented: string, expected: string): Promise<boolean> {
  if (!expected || expected.length < 32 || !presented) return false;
  const enc = new TextEncoder();
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(presented)));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(expected)));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export type SignerAuth = "github-oidc" | "pod-token";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const auth = request.headers.get("authorization") || "";
  const tok = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!tok) {
    return json(
      {
        error: "unauthorized",
        reason: "bearer required (GitHub OIDC JWT or the pod caller token)",
        static_route: await staticRouteStatus(env),
      },
      401,
    );
  }

  let signerAuth: SignerAuth;
  let claims: Claims | null = null;
  try {
    if (tok.split(".").length === 3) {
      claims = await verifyOidc(tok);
      signerAuth = "github-oidc";
    } else if (await podTokenMatches(tok, (env.BOARD_SIGN_POD_TOKEN || "").trim())) {
      signerAuth = "pod-token";
    } else {
      return json({ error: "unauthorized", reason: "pod token rejected" }, 401);
    }
  } catch (e) {
    return json({ error: "unauthorized", reason: "OIDC rejected", detail: String((e as Error).message || e) }, 401);
  }

  const pkcs8b64 = (env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim();
  if (!pkcs8b64) {
    return json({ error: "uncheckable", reason: "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env" }, 503);
  }

  let body: { payload?: unknown };
  try {
    body = (await request.json()) as { payload?: unknown };
  } catch {
    return json({ error: "bad_request", reason: "JSON body required" }, 400);
  }
  if (!body.payload || typeof body.payload !== "object") {
    return json({ error: "bad_request", reason: "payload object required" }, 400);
  }
  const bytes = canonical(body.payload);
  if (bytes.byteLength > 3072) {
    return json({ error: "bad_request", reason: "payload exceeds 3KB cap" }, 400);
  }
  // G1.3 THIN firewall (2026-09-12): fail closed. A labeled artifact never gets a
  // signature from this endpoint, however it arrived. Mirror: scripts/sign_financial_runs.py.
  const violation = signLabelViolation(new TextDecoder().decode(bytes));
  if (violation) {
    return json(
      {
        error: "refused",
        reason: `payload carries never-sign label ${violation} — THIN/TEMPLATE/specimen is never signed (doctrine lock)`,
        label: violation,
      },
      422,
    );
  }

  // The narrowing. Only the pod-token route is checked; an OIDC caller never reaches this branch.
  let staticPath: string | null = null;
  if (signerAuth === "pod-token") {
    const verdict = staticRouteVerdict(body.payload);
    if (!verdict.ok || verdict.artifact_path === null) {
      return json({ error: "forbidden", reason: STATIC_REFUSAL, detail: verdict.reason, static_route: { state: "narrowed" } }, 403);
    }
    staticPath = verdict.artifact_path;
  }

  try {
    const der = Uint8Array.from(atob(pkcs8b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, bytes as BufferSource));
    const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const signedAt = new Date().toISOString();
    if (staticPath !== null) {
      // After the signature exists; never awaited; a failure is swallowed. Signing cannot wait on
      // this write and cannot fail because of it.
      const write = recordStaticUse(env, { signed_at: signedAt, payload_sha256: digest, artifact_path: staticPath }).catch(() => undefined);
      try {
        context.waitUntil(write);
      } catch {
        /* no waitUntil in this runtime: the write still runs, and nothing waits for it */
      }
    }
    return json({
      schema: "csoai.board-sign/0.1",
      did: DID,
      sig_ed25519: hex,
      payload_sha256: digest,
      signer_auth: signerAuth,
      signed_at: signedAt,
      note: "Signed on Pages. PKCS8 never left Cloudflare. Not a certificate.",
      caller: callerEcho(signerAuth, claims),
    });
  } catch (e) {
    return json({ error: "uncheckable", reason: "sign failed", detail: String((e as Error).name || e) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type" } });
