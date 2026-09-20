/**
 * POST /api/board-sign — estate signing relay.
 *
 * The Ed25519 PKCS8 remains a Cloudflare Pages secret and never leaves the
 * edge. Callers authenticate with short-lived OIDC identities from explicitly
 * allowlisted CI issuers. GitHub Actions remains supported; GitLab CI may be
 * enabled by setting BOARD_SIGN_GITLAB_PROJECT_PATH.
 *
 * Measurement, not certification. This endpoint signs only canonical compact
 * payloads <= 3KB and still enforces the THIN/TEMPLATE/specimen firewall.
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
const GITHUB_ISS = "https://token.actions.githubusercontent.com";
const GITLAB_ISS = "https://gitlab.com";
const REPO = "CSOAI-ORG/council-of-ai";
const DID = "did:web:csoai.org#board-attestation-1";

type SignerEnv = {
  BOARD_SIGN_KEY_PKCS8_B64: string;
  BOARD_SIGN_GITLAB_PROJECT_PATH?: string;
  BOARD_SIGN_GITLAB_ALLOWED_REFS?: string;
};

type Claims = Record<string, unknown>;
type IssuerDecision = {
  issuer: "github" | "gitlab";
  jwksUri: string;
  principal: string;
};

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const canonical = canonicalBytes;

function audienceOk(aud: unknown): boolean {
  const allowed = new Set([AUD, "https://councilof.ai", "https://github.com/CSOAI-ORG/councilof-ai"]);
  const list = Array.isArray(aud) ? aud : [aud];
  return list.some((x) => typeof x === "string" && allowed.has(x));
}

function truthyClaim(v: unknown): boolean {
  return v === true || v === "true";
}

export function validateOidcClaims(payload: Claims, env: Partial<SignerEnv> = {}): IssuerDecision {
  if (!audienceOk(payload.aud)) throw new Error("aud");

  const now = Date.now();
  if (typeof payload.exp === "number" && payload.exp * 1000 < now - 30_000) throw new Error("exp");
  if (typeof payload.nbf === "number" && payload.nbf * 1000 > now + 30_000) throw new Error("nbf");

  if (payload.iss === GITHUB_ISS) {
    if (payload.repository !== REPO) throw new Error("repo");
    const wf = String(payload.job_workflow_ref || payload.workflow || payload.workflow_ref || "");
    const allowedWf = ["public-root", "hf-fin-shells", "hf-inference-mill", "auto-eat-sign", "universal-measure-sign"];
    if (!allowedWf.some((w) => wf.includes(w))) throw new Error("workflow");
    return {
      issuer: "github",
      jwksUri: `${GITHUB_ISS}/.well-known/jwks`,
      principal: `${REPO}:${wf}`,
    };
  }

  if (payload.iss === GITLAB_ISS) {
    const configuredProject = (env.BOARD_SIGN_GITLAB_PROJECT_PATH || "").trim();
    if (!configuredProject) throw new Error("gitlab_disabled");

    const project = String(payload.project_path || payload.job_project_path || "");
    if (project !== configuredProject) throw new Error("project_path");
    if (!truthyClaim(payload.ref_protected)) throw new Error("ref_protected");

    const allowedRefs = new Set(
      (env.BOARD_SIGN_GITLAB_ALLOWED_REFS || "main,master")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    );
    const ref = String(payload.ref || "");
    if (!allowedRefs.has(ref)) throw new Error("ref");
    if (payload.ref_type !== undefined && String(payload.ref_type) !== "branch") throw new Error("ref_type");

    return {
      issuer: "gitlab",
      jwksUri: `${GITLAB_ISS}/oauth/discovery/keys`,
      principal: `${project}:${ref}`,
    };
  }

  throw new Error("iss");
}

async function verifyOidc(token: string, env: Partial<SignerEnv>): Promise<IssuerDecision> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("jwt");
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0]))) as { kid?: string; alg?: string };
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))) as Claims;
  if (header.alg !== "RS256") throw new Error("alg");
  if (!header.kid) throw new Error("kid");

  const decision = validateOidcClaims(payload, env);
  const jwks = (await (await fetch(decision.jwksUri, { headers: { accept: "application/json" } })).json()) as {
    keys: JsonWebKey[];
  };
  const jwk = jwks.keys.find((k) => (k as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(parts[2]) as BufferSource,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new Error("sig");
  return decision;
}

export const onRequestPost: PagesFunction<SignerEnv> = async ({ request, env }) => {
  let principal: IssuerDecision;
  try {
    const auth = request.headers.get("authorization") || "";
    const tok = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!tok) return json({ error: "unauthorized", reason: "allowlisted OIDC bearer required" }, 401);
    principal = await verifyOidc(tok, env);
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
  const violation = signLabelViolation(new TextDecoder().decode(bytes));
  if (violation) {
    return json(
      {
        error: "refused",
        reason: `payload carries never-sign label ${violation} — THIN/TEMPLATE/specimen is never signed`,
        label: violation,
      },
      422,
    );
  }

  try {
    const der = Uint8Array.from(atob(pkcs8b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, bytes as BufferSource));
    const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
    return json({
      schema: "csoai.board-sign/0.2",
      did: DID,
      sig_ed25519: hex,
      payload_sha256: [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      oidc_issuer: principal.issuer,
      oidc_principal: principal.principal,
      note: "Signed on Pages. PKCS8 never left Cloudflare. Not a certificate.",
    });
  } catch (e) {
    return json({ error: "uncheckable", reason: "sign failed", detail: String((e as Error).name || e) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
