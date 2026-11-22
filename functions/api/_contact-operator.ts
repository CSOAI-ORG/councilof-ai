/**
 * Operator-only lead intake access. No user-supplied issuer, shared bearer token,
 * claimed email header, or cookie is treated as authority. The Cloudflare Access
 * application MUST be separately installed with a restricted operator policy.
 */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type ContactReviewEnv = {
  LEADS?: KVNamespace;
  LEADS_OPERATOR_ACCESS_ISSUER?: string;
  LEADS_OPERATOR_ACCESS_AUD?: string;
  LEADS_OPERATOR_EMAILS?: string;
};

type OperatorResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 | 503 };

const keysets = new Map<string, JWTVerifyGetKey>();

/** Only the configured Cloudflare Access issuer is used to fetch public keys. */
function configuredIssuer(value: unknown): string | null {
  if (typeof value !== "string" || !/^https:\/\/[a-z0-9][a-z0-9.-]*\.cloudflareaccess\.com$/.test(value)) return null;
  try {
    const uri = new URL(value);
    if (uri.origin !== value || uri.username || uri.password || uri.port) return null;
    return value;
  } catch { return null; }
}

export async function authorizeContactOperator(
  request: Request,
  env: ContactReviewEnv,
  overrideKeySet?: JWTVerifyGetKey,
): Promise<OperatorResult> {
  const issuer = configuredIssuer(env.LEADS_OPERATOR_ACCESS_ISSUER);
  const audience = env.LEADS_OPERATOR_ACCESS_AUD;
  const allowed = (env.LEADS_OPERATOR_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  // Disabled by default; all three explicit settings and LEADS are required.
  if (!issuer || !audience || audience.trim() !== audience || audience.length > 256 ||
      !/^[A-Za-z0-9_-]+$/.test(audience) || allowed.length === 0 ||
      allowed.some(email => !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)) ||
      !env.LEADS) return { ok: false, status: 503 };

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 8192) return { ok: false, status: 401 };

  try {
    let verifyKey = overrideKeySet;
    if (!verifyKey) {
      verifyKey = keysets.get(issuer);
      if (!verifyKey) {
        verifyKey = createRemoteJWKSet(new URL(issuer + "/cdn-cgi/access/certs"));
        keysets.set(issuer, verifyKey);
      }
    }
    const { payload } = await jwtVerify(token, verifyKey, {
      algorithms: ["RS256"],
      issuer,
      audience,
      clockTolerance: 15,
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now ||
        typeof payload.iat !== "number" || payload.iat > now + 15 ||
        typeof payload.email !== "string") return { ok: false, status: 401 };
    const email = payload.email.trim().toLowerCase();
    if (!allowed.includes(email)) return { ok: false, status: 403 };
    return { ok: true, email };
  } catch {
    // No tokens, claims, personal details or verification exceptions enter logs.
    return { ok: false, status: 401 };
  }
}
