/**
 * GET /api/regulation — source-cited regulation deadline feed.
 *
 * This endpoint deliberately serves a bounded, versioned register rather than
 * accepting generic writes. Dates are statements from the cited instrument,
 * not a legal-compliance decision about any user or system. Corrections are
 * appended; they are never silently rewritten.
 */

export const REGULATION_FEED = {
  schema: "csoai.regulation-deadlines/0.1",
  verified_as_of: "2026-08-19",
  reverification_cadence:
    "quarterly, and on any provision-change event from the daily reg-watch detector",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections_policy:
    "appended, never edited — a wrong date here is a published correction, not a silent fix",
  scope_note:
    "A cited deadline is regulatory context, not a determination that a person, model, or organisation is compliant.",
  headline_correction:
    "The EU AI Act's high-risk obligations did NOT take effect 2 August 2026: the Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026) deferred stand-alone Annex III high-risk to 2 December 2027 and product-embedded Annex I high-risk to 2 August 2028.",
  deadlines: [
    { date: "2025-02-02", instrument: "EU AI Act", what: "Article 5 prohibited practices + Article 4 AI literacy duties in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3))" },
    { date: "2025-08-02", instrument: "EU AI Act", what: "GPAI model provider obligations (Arts 53–55) + governance rules in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2025-09-01", instrument: "China GB 45438-2025", what: "Mandatory AI-generated content labelling (visible + implicit metadata/watermark)", basis: "CAC/MIIT/MPS/NRTA joint measures", status: "IN_FORCE", penalty_exposure: "CAC enforcement under the labelling measures; no fixed statutory maximum published" },
    { date: "2026-01-01", instrument: "Texas TRAIGA (HB 149)", what: "Intent-based prohibitions, AG-exclusive enforcement, 60-day cure", basis: "HB 149", status: "IN_FORCE", penalty_exposure: "$10,000–$200,000 per violation plus up to $40,000/day continuing (HB 149)" },
    { date: "2026-01-01", instrument: "California SB 53", what: "Transparency in Frontier AI Act — large frontier developers (> $500M revenue)", basis: "Ch. 138, Statutes of 2025", status: "IN_FORCE", penalty_exposure: "AG-enforced civil penalties up to $1,000,000 per violation (Ch. 138, Statutes of 2025)" },
    { date: "2026-01-22", instrument: "South Korea AI Basic Act", what: "High-impact + generative AI obligations; extraterritorial representative duty; one-year fine grace", basis: "Framework Act, promulgated 2025-01-21", status: "IN_FORCE", penalty_exposure: "administrative fines up to KRW 30,000,000 (~US$20,700) per Art 43; MSIT one-year fine grace in 2026" },
    { date: "2026-08-02", instrument: "EU AI Act", what: "Article 50 transparency + full penalty/market-surveillance regime + AI Office GPAI enforcement in force (NOT high-risk — see deferral)", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2026-08-02", instrument: "California AI Transparency Act (CAITA, SB 942)", what: "Large GenAI providers: public AI-detection tool plus manifest and latent disclosure for AI-generated media", basis: "SB 942/AB 853 as amended 2025 (operative 2 Aug 2026)", status: "IN_FORCE", penalty_exposure: "civil penalties enforceable by state authorities; no private right of action (SB 942/AB 853)" },
    { date: "2026-09-11", instrument: "EU Cyber Resilience Act", what: "Article 14 vulnerability/incident reporting live (24h early warning / 72h notification via ENISA Single Reporting Platform; covers legacy products)", basis: "Reg (EU) 2024/2847 Art 14/16", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 2.5% of worldwide annual turnover (CRA)" },
    { date: "2026-12-02", instrument: "EU AI Act Art 50(2)", what: "Marking grace ends for generative systems placed on market before 2 Aug 2026", basis: "Art 111(4), inserted by Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4)(g))" },
    { date: "2026-12-02", instrument: "EU AI Act Art 5 (new)", what: "Prohibitions on AI generating non-consensual intimate imagery and CSAM take effect", basis: "Digital Omnibus amendments", status: "UPCOMING", penalty_exposure: "up to €35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3), prohibited-practice tier)" },
    { date: "2026-12-09", instrument: "EU Product Liability Directive", what: "Member-state transposition deadline — software and AI enter strict no-fault liability", basis: "Dir (EU) 2024/2853 Art 24", status: "UPCOMING", penalty_exposure: "no statutory cap — exposure is claimant-proven damage" },
    { date: "2026-12-10", instrument: "Australia Privacy Act", what: "Automated-decision transparency obligation takes effect", basis: "Privacy Act amendment", status: "UPCOMING", penalty_exposure: "OAIC enforcement under the Privacy Act civil-penalty regime" },
    { date: "2027-01-01", instrument: "Illinois SB 315", what: "Frontier-developer disclosure statements begin (audit mandate follows 2028-01-01)", basis: "Public Act 104-0538 §18(a), §10(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures" },
    { date: "2027-01-01", instrument: "New York RAISE Act", what: "Frontier transparency + 72-hour incident reporting to NYDFS oversight office", basis: "S6953B/A6453B as amended 2026-03-27", status: "UPCOMING", penalty_exposure: "NYAG civil penalties up to $1,000,000 first / $3,000,000 subsequent" },
    { date: "2027-01-01", instrument: "Colorado SB 26-189", what: "ADMT disclosure/transparency framework (replaces repealed SB 24-205)", basis: "SB 26-189, signed 2026-05-14", status: "UPCOMING", penalty_exposure: "Colorado AG enforcement; no fixed statutory maximum published" },
    { date: "2027-08-02", instrument: "EU AI Act", what: "Pre-Aug-2025 GPAI models must reach compliance; national regulatory-sandbox obligation", basis: "Reg (EU) 2024/1689 as amended", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2027-12-02", instrument: "EU AI Act", what: "Stand-alone Annex III high-risk obligations apply (deferred from 2 Aug 2026)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2028-01-01", instrument: "Illinois SB 315", what: "Mandatory annual independent third-party audits of frontier developers", basis: "Public Act 104-0538 §10(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures" },
    { date: "2028-08-02", instrument: "EU AI Act", what: "Product-embedded Annex I high-risk obligations apply", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
  ],
  disputed: [
    { item: "Council of Europe Framework Convention on AI (CETS 225) entry-into-force status", note: "sources disagree as of the verification date; stated honestly rather than guessed" },
  ],
  underwriting_note:
    "Deadlines and cited penalty exposure can inform an underwriter; CSOAI does not underwrite, price risk, or determine legal compliance.",
} as const;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequestGet: PagesFunction<{
  BOARD_SIGN_KEY_PKCS8_B64?: string;
}> = async ({ env }) => {
  const body: Record<string, unknown> = { ...REGULATION_FEED };
  const b64 = env.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const der = Uint8Array.from(atob(b64), (character) =>
        character.charCodeAt(0),
      );
      const key = await crypto.subtle.importKey(
        "pkcs8",
        der,
        { name: "Ed25519" },
        true,
        ["sign"],
      );
      const signature = await crypto.subtle.sign(
        "Ed25519",
        key,
        new TextEncoder().encode(canonicalJson(body)),
      );
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this regulation feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig: hex(signature),
        public_key_x: jwk.x,
        sig_input:
          "canonical JSON (recursively sorted keys, no whitespace) of this feed with the signature field removed",
      };
    } catch {
      body.signature = {
        error: "signing key present but unusable — no signature was emitted",
      };
    }
  }

  return Response.json(body, {
    headers: {
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
