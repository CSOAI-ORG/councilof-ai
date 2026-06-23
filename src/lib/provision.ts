import crypto from "crypto";

export type ProvisionResult =
  | { ok: true; certificate: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Faithful port of the legacy apex `api/provision.js`. Writes a certificate row
 * to the same Supabase `certificates` table — via PostgREST `fetch`, so no
 * `@supabase/supabase-js` dependency is added. Preserves the exact fulfillment
 * behavior the static csoai.org had, so a repoint to this app doesn't regress.
 *
 * NOTE (per the data-reconciliation plan): the canonical authority should become
 * the meok-attestation ledger; this Supabase write is the parity bridge, not the
 * long-term source of truth.
 */
export async function provisionCertification(
  tierId: string,
  email: string,
): Promise<ProvisionResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: "Supabase env not configured" };

  const didId = `did:csoai:${crypto.randomBytes(4).toString("hex")}-${crypto
    .randomBytes(2)
    .toString("hex")}`;
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1-year validity

  const row = {
    did_id: didId,
    user_email: email,
    tier_id: tierId,
    status: "active",
    issued_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    metadata: {
      source: "stripe_checkout",
      frameworks:
        tierId === "art50"
          ? ["EU AI Act"]
          : ["CASA Standard", "OWASP Agentic Top 10"],
    },
  };

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/certificates`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify([row]),
    });
    if (!r.ok) {
      return { ok: false, error: `Supabase ${r.status}: ${(await r.text()).slice(0, 200)}` };
    }
    const data = (await r.json()) as Record<string, unknown>[];
    return { ok: true, certificate: data[0] ?? row };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
