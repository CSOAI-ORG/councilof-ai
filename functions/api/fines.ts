/**
 * GET /api/fines — First-Fine Watch: signed coverage of the public AI enforcement record.
 *
 * R8 canon (load-bearing): regulators get signed streams free forever (verification free).
 * This endpoint is public + verify-free, on the measurement surface, NEVER the commercial
 * lane. It is never a score a ranked party pays for — the x402 micropayment lane is lawful
 * only on the commercial side (/api/signed-data-feed: insurers, bond desks, vendors buying
 * DATA, never scores, never ranked). Measurement, not certification.
 *
 * Grammar law: publish "systematic signed coverage of the public enforcement record".
 * NEVER "every problem of every AI company" — absolutist phrasing fails the publication
 * gate. An entry not verified on the date claimed is stated UNMEASURED, never a fake 0.
 *
 * PROVENANCE (re-reviewed 2026-11-07). The rows below are the same rows the site publishes at
 * /first-fine-watch (client/src/data/enforcement.ts) and sells as data at /api/signed-data-feed.
 * On 2026-11-07 every row was re-verified against a PRIMARY source — a regulator's own decision,
 * order, judgment or statute text — and `verified` says per row what was opened. The review
 * record, with every URL and the verbatim text relied on, is published beside this file at
 * docs/research/FINES-REFRESH-RESEARCH-2026-11-07.md.
 *
 * The corrections that review forced are published in `corrections_2026_11_07` below. The estate
 * rule is that a dated record is not rewritten silently: the error, the corrected row and the
 * primary source are all visible, so a reader can see what changed and check it.
 *
 * The feed is Ed25519-signed with the board-attestation key (#board-attestation-1, the
 * same key /api/gspc and /api/clarity use). No key present -> NO signature field: honest
 * absence, never a fabricated one.
 *
 * NO SERVE-TIME CLOCK. Every date in this body comes from the corpus. `days_since_powers`
 * is derived arithmetically from two corpus dates (as_of − powers_live), so the feed can
 * never assert a freshness that did not happen: it goes stale visibly rather than silently.
 */
import { headFromGet } from "./_head";

const AS_OF = "2026-11-07"; // date the rows below were last reviewed against primary sources
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
    reviewed_against: "every row re-verified against a primary regulator source on 2026-11-07 (a decision, order, judgment or statute text); the review record and every URL are published at docs/research/FINES-REFRESH-RESEARCH-2026-11-07.md",
    rule: "as_of is the review date carried by the corpus, never the time this request was served",
  },
  first_fine_watch: {
    eu_ai_act_fines_collected_eur: 0,
    enforcement_powers_live_since: POWERS_LIVE,
    enforcement_powers_scope: "this is the date Art 101 (GPAI fines) applies, not a general enforcement date: Art 113(b) expressly carves Article 101 out of the 2 Aug 2025 batch, while the Art 99(1)-(11) operator penalties have applied since 2 Aug 2025",
    days_since_powers_live: daysBetween(POWERS_LIVE, AS_OF),
    days_since_powers_live_derivation: `as_of (${AS_OF}) minus enforcement_powers_live_since (${POWERS_LIVE}) — derived from corpus dates, not from the request clock`,
    maximal_exposure: "Art 101 GPAI — EUR 15 000 000 or 3 % of annual total worldwide turnover, whichever is higher (Art 101(1)); the 'EUR 35M / 7 %' pair is the Art 99(3) prohibited-practices tier and does not apply to GPAI providers",
    sentence: `EU AI Act Art 101 (GPAI fines) applies from ${POWERS_LIVE} (fines up to EUR 15 000 000 or 3 % of worldwide turnover, whichever is higher). Fines collected as at ${AS_OF}: EUR 0.`,
    first_process_steps: "the first Art 101 process steps have occurred and are requests for information under Art 91, not fines; no Art 101 fine was found as at 2026-11-07",
    zero_is_measured: "EUR 0 is an observed absence of any published Art 101 fine as at as_of — not an unmeasured cell defaulted to zero",
    page: "/first-fine-watch",
    verify_free: true,
    certification: false,
  },
  fines_by_jurisdiction: [
    { jurisdiction: "EU/UK/IT", actor: "Clearview AI", regime: "GDPR", amount: "EUR 95.7M imposed (EU/EEA) + GBP 7.55M (UK, under appeal)", note: "monetary penalties imposed by IT, GR, FR (incl. a EUR 5.2M CNIL penalty payment) and NL; nothing collected; the UK element was remitted after [2025] UKUT 319 (AAC)", verified: "MEASURED", collected: false, status: "imposed, uncollected; UK element under appeal" },
    { jurisdiction: "US", actor: "FTC / Helping America Group", regime: "FTC Act + TSR + Florida FDUTPA", amount: "USD 85.66M judgment (partly suspended)", note: "2017-18 debt-relief scheme, FTC + Florida AG; about USD 35M of assets collected and paid to consumers as redress; not an AI action and not a penalty paid to Treasury", verified: "MEASURED", status: "imposed, largely uncollected; redress distributed" },
    { jurisdiction: "US", actor: "FTC / Air AI", regime: "FTC Act + TSR + Business Opportunity Rule", amount: "USD 18M judgment (largely suspended); USD 50,000 paid", note: "AI business-opportunity earnings claims; 24 Mar 2026; D. Ariz.; not an AI Act fine", verified: "MEASURED", status: "imposed, largely suspended" },
    { jurisdiction: "UK", actor: "UK ICO", regime: "UK GDPR", amount: "GBP 7.55M (2022, under appeal)", note: "the '~GBP 17M' was a 2021 notice of intent that was never imposed; this is the same actor as the Clearview row, so the two must not be added together", verified: "MEASURED", status: "imposed, under appeal; not collected" },
    { jurisdiction: "IT", actor: "OpenAI", regime: "GDPR", amount: "EUR 15M", note: "annulled — not a collected fine; the annulment is 18 March 2026 on allocation of competence, not on the merits, and the same judgment declared the interim bond ineffective", verified: "MEASURED", annulment_date: "2026-03-18", deciding_body: "Tribunale di Roma", case_reference: "sentenza n. 4153/2026, R.G. 4785/2025", status: "annulled (not a fine)" },
    { jurisdiction: "EU", actor: "EU AI Act (Art 101 GPAI)", regime: "EU AI Act", amount: "EUR 0", note: "no Art 101 fine published as at as_of", verified: "MEASURED", status: "FIRST-FINE WATCH" },
  ],
  deadlines_calendar: [
    { event: "Illinois AI Video Interview Act (820 ILCS 42) in force", date: "2020-01-01", note: "employment notice, explanation and consent for AI-analysed video interviews; sharing limited; destruction on request within 30 days — not an audit duty" },
    { event: "Korea AI Basic Act in force; MSIT grace period on administrative fines begins", date: "2026-01-22", note: "the obligations applied from 22 Jan 2026; MSIT defers fact-finding and fines for 'at least one year' and left the duration unpublished, so there is no published end date" },
    { event: "Texas AG AI complaints portal goes live (TRAIGA §552.102)", date: "2026-09-01", note: "the attorney general's online reporting mechanism — TRAIGA creates no AI systems registration; the Act took effect 1 Jan 2026" },
    { event: "DRCF (UK) 'Consumer interest and AI' phase 2 call for input closes", date: "2026-09-02", note: "CMA/FCA/ICO/Ofcom consultation on tools for managing AI risks — a consultation, not a disclosure obligation" },
    { event: "EU AI Act Art 50(2) compliance for systems placed on the market before 2 Aug 2026", date: "2026-12-02", note: "Art 111(4) as inserted by Reg (EU) 2026/1744 (Digital Omnibus on AI), in force 27 Jul 2026" },
  ],
  correction_59: "Art 73 windows are 15d / 10d / 2d (not 15d / 24h — that was NIS2).",
  corrections_2026_11_07: {
    rule: "a dated record is not rewritten silently — the error, the corrected row and the primary source are all published, so a reader can see what changed and check it",
    review_record: "docs/research/FINES-REFRESH-RESEARCH-2026-11-07.md",
    corrections: [
      { row: "first_fine_watch.maximal_exposure", was: "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher", now: "Art 101 GPAI — EUR 15 000 000 or 3 % of annual total worldwide turnover, whichever is higher", why: "Art 101(1) verbatim; EUR 35M / 7 % is the Art 99(3) prohibited-practices tier — a different article and a different authority" },
      { row: "fines_by_jurisdiction[Clearview AI].amount", was: ">EUR 100M", now: "EUR 95.7M imposed (EU/EEA) + GBP 7.55M (UK, under appeal)", why: "EUR 95.7M is the sum of the EU monetary penalties actually imposed; '>EUR 100M' counted the Dutch DPA's conditional penalty in full and added the disputed UK penalty. No collection is reported" },
      { row: "fines_by_jurisdiction[FTC].regime", was: "FTC Act / ECOA", now: "FTC Act + TSR + Florida FDUTPA (Helping America Group) — ECOA is not among the violations charged", why: "the old row spliced a USD 85M judgment figure onto a regime tag belonging to a different line. The ECOA auto-dealer line is a separate matter: USD 15.93M across three actions, all paid, with its disparate-impact injunctive relief vacated by the FTC on 7 Aug 2026" },
      { row: "fines_by_jurisdiction[UK ICO].amount", was: "~GBP 17M", now: "GBP 7.55M (2022, under appeal)", why: "GBP 17M was the 2021 provisional notice of intent; the final monetary penalty notice of 18 May 2022 imposed GBP 7,552,800" },
      { row: "fines_by_jurisdiction[OpenAI].annulment_date", was: "UNVERIFIED", now: "2026-03-18", why: "the Garante's own site and the judgment text; the site's 'Mar 2025' was the precautionary suspension, not the annulment" },
      { row: "deadlines_calendar[Texas]", was: "AI systems registration portal", now: "attorney general's complaints portal under TRAIGA §552.102", why: "TRAIGA creates no AI systems registration; the 1 Sep 2026 date is the AG's duty to post the reporting mechanism" },
      { row: "deadlines_calendar[DRCF (UK)]", was: "AI disclosure", now: "phase 2 call for input on tools for managing AI risks", why: "a consultation response deadline, not a disclosure obligation" },
      { row: "deadlines_calendar[EU AI Act Art 50(2)]", was: "transparency grace ends", now: "Art 111(4) as inserted by Reg (EU) 2026/1744, scoped to systems placed on the market before 2 Aug 2026", why: "the same date, now pinned to a primary text rather than inherited" },
      { row: "deadlines_calendar[Korea]", was: "grace period ends 2027-01-22", now: "no published end date; MSIT's floor is 'at least one year' with the duration left unfinalised, and the obligations applied from 22 Jan 2026", why: "the old date was the estate's own arithmetic presented as a deadline the ministry never set" },
      { row: "deadlines_calendar[Illinois]", was: "AI audits (265 ILCS), 2028-01-01", now: "AI Video Interview Act (820 ILCS 42), in force 1 Jan 2020", why: "the citation, the subject and the date were each wrong: 265 ILCS is not the Act's chapter, it is not an audit duty, and it has been in force since 2020" },
    ],
  },
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

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
