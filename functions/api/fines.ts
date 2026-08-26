/**
 * GET /api/fines — First-Fine Watch: signed coverage of the public AI enforcement record.
 *
 * R8 canon (load-bearing): regulators get signed streams free forever (verification free).
 * This endpoint is public + verify-free, on the measurement surface, NEVER the commercial
 * lane. It is never a score a ranked party pays for — the x402 micropayment lane is lawful
 * only on the commercial side (/api/eunomia-data: insurers, bond desks, vendors buying
 * DATA, never scores, never ranked). Measurement, not certification.
 *
 * Grammar law: publish "systematic signed coverage of the public enforcement record".
 * NEVER "every problem of every AI company" — absolutist phrasing fails the publication
 * gate. An entry not verified on the date claimed is stated UNMEASURED, never a fake 0.
 *
 * PROVENANCE (restored 2026-08-26). The rows below are the same rows the site already
 * publishes at /first-fine-watch (client/src/data/enforcement.ts) and sells as data at
 * /api/eunomia-data — landed by 33a26615 on 2026-08-24. They are NOT re-derived here and
 * carry no fresher claim than that review. Every row is REPORTED (a public secondary
 * record), not MEASURED by us; `verified` says so per row.
 *
 * The feed is Ed25519-signed with the board-attestation key (#board-attestation-1, the
 * same key /api/gspc and /api/clarity use). No key present -> NO signature field: honest
 * absence, never a fabricated one.
 *
 * NO SERVE-TIME CLOCK. Every date in this body comes from the corpus. `days_since_powers`
 * is derived arithmetically from two corpus dates (as_of − powers_live), so the feed can
 * never assert a freshness that did not happen: it goes stale visibly rather than silently.
 */

const AS_OF = "2026-08-24"; // date the rows below were last reviewed (commit 33a26615)
const POWERS_LIVE = "2026-08-02"; // EU AI Act Art 101 GPAI fining powers switched on

// Whole days between two corpus dates. Data in, data out — never Date.now().
const daysBetween = (fromISO: string, toISO: string): number =>
  Math.round((Date.parse(toISO + "T00:00:00Z") - Date.parse(fromISO + "T00:00:00Z")) / 86400000);

const CORPUS = {
  schema: "csoai.enforcement-corpus/0.1",
  record_type: "reported-public-record",
  title: "Systematic signed coverage of the public AI enforcement record",
  as_of: AS_OF,
  freshness: {
    rows_last_reviewed: AS_OF,
    reviewed_against: "public secondary sources; no row re-verified against a primary regulator filing on this date",
    rule: "as_of is the review date carried by the corpus, never the time this request was served",
  },
  first_fine_watch: {
    eu_ai_act_fines_collected_eur: 0,
    enforcement_powers_live_since: POWERS_LIVE,
    days_since_powers_live: daysBetween(POWERS_LIVE, AS_OF),
    days_since_powers_live_derivation: `as_of (${AS_OF}) minus enforcement_powers_live_since (${POWERS_LIVE}) — derived from corpus dates, not from the request clock`,
    maximal_exposure: "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher",
    sentence: `EU AI Act enforcement powers switched ON ${POWERS_LIVE} (Art 101 GPAI fining up to EUR 35M / 7%). Fines collected as at ${AS_OF}: EUR 0.`,
    zero_is_measured: "EUR 0 is an observed absence of any published Art 101 fine as at as_of — not an unmeasured cell defaulted to zero",
    page: "/first-fine-watch",
    verify_free: true,
    certification: false,
  },
  fines_by_jurisdiction: [
    { jurisdiction: "EU/UK/IT", actor: "Clearview AI", regime: "GDPR", amount: ">EUR 100M", note: "cumulative across multiple supervisory authorities; GDPR route, pre-AIA", verified: "REPORTED", status: "cumulative (multi-MSA)" },
    { jurisdiction: "US", actor: "FTC", regime: "FTC Act / ECOA", amount: "~USD 85M", note: "headline order figure; partly suspended", verified: "REPORTED", status: "order (partly suspended)" },
    { jurisdiction: "UK", actor: "UK ICO", regime: "UK GDPR", amount: "~GBP 17M", note: "AI-adjacent ICO action, not an AI-Act fine", verified: "REPORTED", status: "AI-adjacent" },
    { jurisdiction: "IT", actor: "OpenAI", regime: "GDPR", amount: "EUR 15M", note: "annulled — not a collected fine; the annulment month is DISPUTED in our own sources (site data says Mar 2025, the 2026-08-25 recovery draft said Mar 2026) and has not been re-checked against the Garante decision", verified: "REPORTED", annulment_date: "UNVERIFIED", status: "annulled (not a fine)" },
    { jurisdiction: "EU", actor: "EU AI Act (Art 101 GPAI)", regime: "EU AI Act", amount: "EUR 0", note: "no Art 101 fine published as at as_of", verified: "MEASURED", status: "FIRST-FINE WATCH" },
  ],
  deadlines_calendar: [
    { event: "Texas AI systems registration portal", date: "2026-09-01", note: "state AI disclosure" },
    { event: "DRCF (UK) AI disclosure", date: "2026-09-02", note: "Digital Regulation Cooperation Forum" },
    { event: "EU AI Act Art 50(2) transparency grace ends", date: "2026-12-02", note: "GPAI transparency marking" },
    { event: "Korea AI Act grace period ends", date: "2027-01-22", note: "Korea AI Basic Act" },
    { event: "Illinois AI audits (265 ILCS)", date: "2028-01-01", note: "state AI audit" },
  ],
  correction_59: "Art 73 windows are 15d / 10d / 2d (not 15d / 24h — that was NIS2).",
  honest_register: {
    status_vocabulary: "MEASURED / REPORTED / UNMEASURED / UNVERIFIED",
    rule: "an unmeasurable entry is stated UNMEASURED, never defaulted to a fake 0",
    coverage: "this corpus is not a complete index of world AI enforcement; it is the set of entries we have reviewed, and it says so",
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
        attests: "integrity of this enforcement-corpus feed as published by the site",
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
  } else {
    body.signature_absent = "no board signing key bound to this deployment — the feed is served UNSIGNED rather than carrying a fabricated signature";
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
    },
  });
};
