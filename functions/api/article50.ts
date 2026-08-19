/**
 * POST /api/article50 — issues an Article 50 passport (free tier, HMAC-signed).
 * GET  /api/article50?verify=1&... — re-verifies a signature, statelessly.
 *
 * HONESTY OVER APPEARANCE (same discipline as lead.ts)
 * The free tier is an HMAC signature over the canonical passport fields: it proves the
 * passport was issued by us, and anyone can re-verify it here — but it is NOT stored:
 * no KV namespace is bound, and this endpoint says so in every response (`stored: false`)
 * rather than implying a registry that does not exist yet. Pro/Governance tiers
 * (Ed25519, OTS) are advertised on the page; they are NOT issued here until the
 * signing backend is bound — asking for them returns a clear 501, not a fake passport.
 *
 * The verify URL points at THIS domain. proofof.ai is currently unreachable (Vercel
 * billing block, 2026-07-31); sending users there would be sending them to a dead page.
 */

interface Env {
  ARTICLE50_HMAC_SECRET?: string;
  SIGIL_SECRET?: string;
}

const CANON_FIELDS = ["content_hash", "provider", "interaction_type", "watermarked", "description", "tier", "deployed_to", "issued_at"] as const;

function canon(o: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const k of CANON_FIELDS) {
    const v = o[k];
    parts.push(k + "=" + (Array.isArray(v) ? v.slice().sort().join(",") : String(v ?? "")));
  }
  return parts.join("|");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pickSecret(env: Env): string | null {
  return env.ARTICLE50_HMAC_SECRET || env.SIGIL_SECRET || null;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ ok: false, error: "body must be JSON" }, { status: 400 });
  }

  const tier = String(body.tier ?? "free");
  if (tier !== "free") {
    return Response.json(
      { ok: false, error: `${tier} tier is not issuing yet — the Ed25519 signing backend is not bound to this deployment. The free HMAC-signed passport is available now.`, tier_requested: tier },
      { status: 501 },
    );
  }

  const contentHash = String(body.content_hash ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(contentHash)) {
    return Response.json({ ok: false, error: "content_hash must be 64 lowercase hex characters (SHA-256 of the content)" }, { status: 400 });
  }

  const secret = pickSecret(ctx.env);
  if (!secret) {
    return Response.json(
      { ok: false, error: "signing key not bound to this deployment (ARTICLE50_HMAC_SECRET). This is our gap, not yours — the passport was NOT issued and nothing was dropped silently." },
      { status: 503 },
    );
  }

  const passport: Record<string, unknown> = {
    schema: "csoai.article50-passport/1",
    content_hash: contentHash,
    provider: String(body.provider ?? "").slice(0, 120),
    interaction_type: String(body.interaction_type ?? "").slice(0, 120),
    watermarked: body.watermarked === true,
    description: String(body.description ?? "").slice(0, 500),
    tier: "free",
    deployed_to: Array.isArray(body.deployed_to) ? body.deployed_to.map(String).slice(0, 20) : [],
    issued_at: new Date().toISOString(),
    issuer: "CSOAI Ltd (UK 16939677)",
    stored: false,
    stored_note: "No registry is bound to this deployment yet; this passport proves issuance by signature, not by database entry. Keep the passport JSON — it is your evidence.",
  };

  const signature = await hmac(secret, canon(passport));
  passport.signature_hmac_sha256 = signature;

  const verifyUrl = new URL(ctx.request.url);
  verifyUrl.search = "";
  verifyUrl.searchParams.set("verify", "1");
  for (const k of CANON_FIELDS) {
    const v = passport[k];
    verifyUrl.searchParams.set(k, Array.isArray(v) ? (v as string[]).join(",") : String(v ?? ""));
  }
  verifyUrl.searchParams.set("sig", signature);
  passport.proofof_ai_verify = verifyUrl.toString();

  return Response.json({ ok: true, passport });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.searchParams.get("verify") !== "1") {
    return Response.json({ ok: true, service: "article50-passport", post_to_issue: true, verify_with: "GET ?verify=1&<passport fields>&sig=<hmac>" });
  }
  const secret = pickSecret(ctx.env);
  if (!secret) {
    return Response.json({ valid: false, error: "signing key not bound to this deployment" }, { status: 503 });
  }
  const fields: Record<string, unknown> = {};
  for (const k of CANON_FIELDS) {
    const v = url.searchParams.get(k) ?? "";
    fields[k] = k === "deployed_to" ? (v ? v.split(",") : []) : k === "watermarked" ? v === "true" : v;
  }
  const expected = await hmac(secret, canon(fields));
  const presented = url.searchParams.get("sig") ?? "";
  const valid = expected === presented;
  return Response.json({ valid, note: valid ? "Signature valid — this passport was issued by CSOAI." : "Signature does not match — do not rely on this passport." });
};
