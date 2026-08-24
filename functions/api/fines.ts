// /api/fines — First-Fine Watch: signed coverage of the public AI enforcement record.
//
// R8 canon: regulators get signed streams free forever (verification free). This endpoint is
// public + verify-free, on the measurement surface never the commercial lane. It is NEVER a
// score a ranked party pays for (x402 is for commercial data, never scores, never ranked).
// Measurement, not certification. certification: false on every row, always.
//
// Grammar law (load-bearing): publish "systematic signed coverage of the public enforcement
// record". NEVER "every problem of every AI company" — absolutist phrasing fails the
// publication gate. An entry that was not verified on the date it is claimed is stated
// UNMEASURED, never defaulted to a fake 0.
//
// The feed is Ed25519-signed with the board-attestation key (#board-attestation-1, the
// same key /api/gspc and /api/clarity use). A stranger can fetch this feed, fetch
// /.well-known/did.json, recompute the canonical JSON, and verify the signature without
// trusting us. No key present -> NO signature field: honest absence, never a fabricated one.

const CORPUS = {
  schema: "csoai.enforcement-corpus/0.1",
  title: "Systematic signed coverage of the public AI enforcement record",
  as_of: "2026-08-24",
  first_fine_watch: {
    eu_ai_act_fines_collected_eur: 0,
    enforcement_powers_live_since: "2026-08-02",
    days_since_powers_live: 22,
    maximal_exposure: "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher",
    sentence: "EU AI Act enforcement powers switched ON 2026-08-02 (Art 101 GPAI fining up to EUR 35M / 7%). Fines collected to date: EUR 0.",
    verify_free: true,
    certification: false,
  },
  fines_by_jurisdiction: [
    { jurisdiction: "EU (GDPR/DSA)", key: "Clearview", amount_eur: 100, unit: "M", note: "EUR 100M+ cumulative; GDPR/DSA route, pre-AIA", verified: "REPORTED", status: "pre-2026, reported figure" },
    { jurisdiction: "US (FTC)", key: "FTC AI settlement", amount_usd: 85, unit: "M", note: "USD ~85M headline; mostly suspended", verified: "REPORTED", status: "settlement, largely suspended" },
    { jurisdiction: "UK", key: "ICO AI-adjacent", amount_gbp: 17, unit: "M", note: "GBP ~17M AI-adjacent", verified: "REPORTED", status: "AI-adjacent ICO action" },
    { jurisdiction: "EU", key: "OpenAI (annulled)", amount_eur: 15, unit: "M", note: "EUR 15M annulled March 2026", verified: "REPORTED", status: "annulled, not a fine" },
  ],
  deadlines_calendar: [
    { event: "Texas AI portal", date: "2026-09-01", note: "State AI portal deadline" },
    { event: "DRCF AI consumer call", date: "2026-09-02", note: "Digital Regulators Cooperation Forum response" },
    { event: "Art 50(2) grace ends", date: "2026-12-02", note: "EU AI Act transparency marking grace period ends" },
    { event: "Korea AI grace ends", date: "2027-01-22", note: "Korea AI regulation grace period" },
    { event: "Illinois AI audits", date: "2027-01-01", note: "Illinois AI audit compliance date" },
  ],
  correction_59: "Art 73 windows are 15d / 10d / 2d (not 15d / 24h — that was NIS2).",
  honest_register: {
    status: "MEASURED / REPORTED / UNMEASURED",
    rule: "an unmeasurable entry is stated UNMEASURED, never defaulted to a fake 0",
    certification: false,
    issued_by: "did:web:csoai.org",
    signer: "did:web:csoai.org#board-attestation-1",
  },
  bright_lines: [
    "no regulator is ever charged — verification free forever",
    "no x402 / micropayment on this feed, and none on any ranked output",
    "no score, no ranking, no certification — predicates and coverage only",
    "no 'every problem of every AI company' framing",
  ],
};

const canonical = (o: unknown): string => {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const r = o as Record<string, unknown>;
  return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
};

export const onRequestGet: PagesFunction = async (context) => {
  const body: Record<string, unknown> = { ...CORPUS };
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT signature — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this enrichment-corpus feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this feed with the signature field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → recompute canonical JSON and verify Ed25519 against did.json",
      };
    } catch {
      body.signature = { error: "signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
    },
  });
};
