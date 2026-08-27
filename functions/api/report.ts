/**
 * POST /api/report — the Watchdog incident intake. This endpoint exists because the
 * /report page was found (2026-08-27, operated end-to-end in a browser) submitting to
 * POST /api/sign — a path no function serves. The page then hashed the text locally
 * and told the reporter "Report sealed … logged" while the report had left the browser
 * for nowhere and was stored nowhere. A thank-you over a dead endpoint is the exact
 * defect this estate exists to catch.
 *
 * WHAT THIS DOES, AND SAYS IT DOES:
 *   receive   the incident record (type, severity, system, location, description).
 *   digest    sha256 over the canonical record, computed server-side.
 *   sign      Ed25519 over the canonical acknowledgement when the signing key
 *             (ASSESS_SIGNING_KEY_PKCS8_B64 — same key /api/assess uses) is bound;
 *             alg:"UNSIGNED" stated out loud when it is not. Same contract as assess:
 *             a provisioned-but-broken key is a 500, never a silent UNSIGNED.
 *   store     verbatim into KV when LEADS is bound (the same namespace the contact,
 *             subscribe and lead forms use, key-prefixed `incident:`); honest
 *             `stored:false` + a fallback address when it is not. Never a 200 that
 *             drops data silently.
 *
 * WHAT THIS IS NOT. Receipt of a report is not a finding, not a measurement of the
 * reported system, and not an endorsement of the claim. Anything acted on is measured
 * on the published instruments and lands on the board like everything else.
 */
interface Env {
  LEADS?: KVNamespace;
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
}

const KINDS = new Set([
  "Bias / discrimination",
  "Safety / physical harm",
  "Privacy / data",
  "Deception / manipulation",
  "Security / misuse",
  "Transparency (no AI disclosure)",
  "Other",
]);
const SEVERITIES = new Set(["Low", "Medium", "High", "Critical"]);

function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const rec = o as Record<string, unknown>;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical(rec[k])).join(",") + "}";
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const description = String(body.description ?? "").trim().slice(0, 8000);
  if (!description) {
    return Response.json(
      { error: "description is required", detail: "An incident report with no description is not a report." },
      { status: 400 },
    );
  }

  const record = {
    kind: "incident",
    report_id: "WD-" + crypto.randomUUID(),
    received_at: new Date().toISOString(),
    incident_type: KINDS.has(String(body.incident_type)) ? String(body.incident_type) : "Other",
    severity: SEVERITIES.has(String(body.severity)) ? String(body.severity) : "Medium",
    system: String(body.system ?? "").slice(0, 500),
    location: String(body.location ?? "").slice(0, 300),
    description,
    // What receipt of this record does and does not mean — carried inside the
    // signed bytes so the receipt cannot be quoted without it.
    meaning:
      "Receipt of a report. Not a finding, not a measurement of the reported system, and not a determination that the incident occurred as described.",
  };

  const canon = canonical(record);
  const digest = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canon)));

  // ── sign, or say plainly that we cannot ──────────────────────────────────
  let sig = "", pub = "", kid = "", alg = "UNSIGNED";
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (b64) {
    // A provisioned-but-broken key must fail loudly here, not degrade to UNSIGNED.
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(canon)));
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    pub = jwk.x ?? "";
    kid = "assess-2026-07";
    alg = "Ed25519";
  }

  // ── store, or say plainly that we did not ────────────────────────────────
  let stored = false;
  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(
      `incident:${record.received_at}:${record.report_id}`,
      JSON.stringify({ ...record, record_digest: digest, sig, pub, kid, alg }),
    );
    stored = true;
  }

  return Response.json(
    {
      ...record,
      record_canonical: canon,
      record_digest: digest,
      sig,
      pub,
      kid,
      alg,
      stored,
      ...(stored
        ? {}
        : {
            stored_reason: "no datastore bound yet on this deployment",
            fallback:
              "Keep this acknowledgement and email it with your report to nicholas@csoai.org — that is the working intake until the datastore is bound.",
          }),
    },
    { headers: { "cache-control": "no-store" } },
  );
};
