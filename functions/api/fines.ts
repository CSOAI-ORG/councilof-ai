/**
 * GET /api/fines — First-Fine Watch: signed coverage of the public AI enforcement record.
 *
 * R8 canon: regulators get signed streams free forever (verification free). This
 * endpoint is public + verify-free. Never "every problem of every AI company" —
 * systematic signed coverage of the public enforcement record. Never a score a
 * ranked party pays for. Measurement, not certification.
 */

const CORPUS = {
  schema: "csoai.enforcement-corpus/0.1",
  title: "Signed coverage of the public AI enforcement record",
  as_of: "2026-08-23",
  first_fine_watch: {
    eu_ai_act_fines_collected_eur: 0,
    enforcement_powers_live_since: "2026-08-02",
    days_since_powers_live: 21,
    sentence: "EU AI Act enforcement powers switched ON 2026-08-02; fines to date EUR 0.",
    verify_free: true,
  },
  fines_by_jurisdiction: [
    { jurisdiction: "EU (GDPR/DSA)", key: "Clearview", amount: 100, unit: "M EUR" },
    { jurisdiction: "US (FTC)", key: "FTC AI settlement", amount: 85, unit: "M USD (mostly suspended)" },
    { jurisdiction: "UK", key: "ICO AI-adjacent", amount: 17, unit: "M GBP" },
    { jurisdiction: "EU", key: "OpenAI (annulled)", amount: 15, unit: "M EUR (annulled Mar 2026)" },
  ],
  deadlines_calendar: [
    { event: "Texas AI portal", date: "2026-09-01" },
    { event: "DRCF AI consumer call", date: "2026-09-02" },
    { event: "Art 50(2) grace ends", date: "2026-12-02" },
    { event: "Korea AI grace ends", date: "2027-01-22" },
    { event: "Illinois AI audits", date: "2027-01-01" },
  ],
  honest_register: {
    status: "MEASURED/REPORTED/UNMEASURED",
    rule: "UNMEASURED cells reported, never a fake 0",
    certification: false,
    signer: "estate-chain-1",
  },
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const host = new URL(request.url).host;
  return Response.json({
    schema: "csoai.enforcement-corpus/0.1",
    issuer: "councilof.ai",
    served_from: host,
    verify_free: true,
    ...CORPUS,
  });
};
