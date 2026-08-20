// /api/regulation — the verified regulation-deadline feed (empty-chair #2).
//
// Every date verified against primary law on the stated date; every entry
// carries its legal basis. REPORTED grammar does not apply — these are
// statements OF law, cited to the instrument itself. A wrong date here is a
// corrections-ledger event: corrections are appended, never silently edited.
// Quarterly re-verification is the product promise.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const FEED = {
  schema: "csoai.regulation-deadlines/0.1",
  verified_as_of: "2026-08-19",
  reverification_cadence: "quarterly, and on any provision-change event from the daily reg-watch detector",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections_policy: "appended, never edited — a wrong date here is a published correction, not a silent fix",
  version_pin_policy: "every deadline pins to its consolidated-text version; when a provision is amended (e.g. the 2025 Digital Omnibus), the receipt re-attests against the NEW versioned text — the old signature breaks, the correction is published, never silently edited. This is the 'pinned + re-attest' discipline an underwriting input requires (insurer-evidence research, 2026-08-20).",
  versions: {
    "EU AI Act": "Reg (EU) 2024/1689 as amended by Digital Omnibus Reg (EU) 2026/1744 (in force 2026-07-27)",
    "EU Cyber Resilience Act": "Reg (EU) 2024/2847 (consolidated 2026-07)",
    "California SB 53": "Ch. 138, Statutes of 2025 (signed 2025-09-29)",
    "Illinois SB 315": "Public Act 104-0538 (signed 2026-07-06)",
    "New York RAISE Act": "S6953B/A6453B as amended 2026-03-27",
    "China GB 45438-2025": "GB 45438-2025 (published 2025-03-14, in force 2025-09-01)",
  },
  headline_correction: "The EU AI Act's high-risk obligations did NOT take effect 2 August 2026: the Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026) deferred stand-alone Annex III high-risk to 2 December 2027 and product-embedded Annex I high-risk to 2 August 2028.",
  deadlines: [
    { date: "2025-02-02", instrument: "EU AI Act", what: "Article 5 prohibited practices + Article 4 AI literacy duties in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3))" },
    { date: "2025-08-02", instrument: "EU AI Act", what: "GPAI model provider obligations (Arts 53–55) + governance rules in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2025-09-01", instrument: "China GB 45438-2025", what: "Mandatory AI-generated content labelling (visible + implicit metadata/watermark)", basis: "CAC/MIIT/MPS/NRTA joint measures", status: "IN_FORCE", penalty_exposure: "CAC enforcement under the labelling measures; no fixed statutory maximum published" },
    { date: "2026-01-01", instrument: "Texas TRAIGA (HB 149)", what: "Intent-based prohibitions, AG-exclusive enforcement, 60-day cure", basis: "HB 149", status: "IN_FORCE", penalty_exposure: "$10,000–$200,000 per violation plus up to $40,000/day continuing (HB 149)" },
    { date: "2026-01-01", instrument: "California SB 53", what: "Transparency in Frontier AI Act — large frontier developers (> $500M revenue)", basis: "Ch. 138, Statutes of 2025", status: "IN_FORCE", penalty_exposure: "AG-enforced civil penalties up to $1,000,000 per violation (Ch. 138, Statutes of 2025)" },
    { date: "2026-01-22", instrument: "South Korea AI Basic Act", what: "High-impact + generative AI obligations; extraterritorial representative duty; one-year fine grace", basis: "Framework Act, promulgated 2025-01-21", status: "IN_FORCE", penalty_exposure: "administrative fines up to KRW 30,000,000 (~US$20,700) per Art 43; MSIT one-year fine grace in 2026" },
    { date: "2026-08-02", instrument: "EU AI Act", what: "Article 50 transparency + full penalty/market-surveillance regime + AI Office GPAI enforcement in force (NOT high-risk — see deferral)", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2026-08-02", instrument: "California AI Transparency Act (CAITA, SB 942)", what: "GenAI providers with >1M monthly CA users: free public AI-detection tool (with API), manifest + latent disclosure for AI-generated image/video/audio (system provenance data)", basis: "SB 942/AB 853 as amended 2025 (operative 2 Aug 2026); Morgan Lewis 3 Aug 2026", status: "IN_FORCE", penalty_exposure: "civil penalties enforceable by state authorities; no private right of action (SB 942/AB 853)" },
    { date: "2026-09-11", instrument: "EU Cyber Resilience Act", what: "Article 14 vulnerability/incident reporting live (24h early warning / 72h notification via ENISA Single Reporting Platform; covers legacy products)", basis: "Reg (EU) 2024/2847 Art 14/16", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 2.5% of worldwide annual turnover (CRA)" },
    { date: "2026-12-02", instrument: "EU AI Act Art 50(2)", what: "Marking grace ends for generative systems placed on market before 2 Aug 2026", basis: "Art 111(4), inserted by Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4)(g))" },
    { date: "2026-12-02", instrument: "EU AI Act Art 5 (new)", what: "Prohibitions on AI generating non-consensual intimate imagery and CSAM take effect", basis: "Digital Omnibus amendments", status: "UPCOMING", penalty_exposure: "up to €35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3), prohibited-practice tier)" },
    { date: "2026-12-09", instrument: "EU Product Liability Directive", what: "Member-state transposition deadline — software and AI enter strict no-fault liability", basis: "Dir (EU) 2024/2853 Art 24", status: "UPCOMING", penalty_exposure: "no statutory cap — strict no-fault liability for defective software/AI (Dir (EU) 2024/2853); exposure is the claimant-proven damage" },
    { date: "2026-12-10", instrument: "Australia Privacy Act", what: "Automated-decision transparency obligation takes effect", basis: "Privacy Act amendment", status: "UPCOMING", penalty_exposure: "OAIC enforcement under the Privacy Act civil-penalty regime" },
    { date: "2027-01-01", instrument: "Illinois SB 315", what: "Frontier-developer disclosure statements begin (audit mandate follows 2028-01-01)", basis: "Public Act 104-0538 §18(a), §10(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures (Public Act 104-0538)" },
    { date: "2027-01-01", instrument: "New York RAISE Act", what: "Frontier transparency + 72-hour incident reporting to NYDFS oversight office", basis: "S6953B/A6453B as amended 2026-03-27", status: "UPCOMING", penalty_exposure: "NYAG civil penalties up to $1,000,000 first / $3,000,000 subsequent (S6953B/A6453B)" },
    { date: "2027-01-01", instrument: "Colorado SB 26-189", what: "ADMT disclosure/transparency framework (replaces repealed SB 24-205)", basis: "SB 26-189, signed 2026-05-14", status: "UPCOMING", penalty_exposure: "Colorado AG enforcement; per-violation civil penalties under the state framework (no fixed statutory maximum published)" },
    { date: "2027-08-02", instrument: "EU AI Act", what: "Pre-Aug-2025 GPAI models must reach compliance; national regulatory-sandbox obligation", basis: "Reg (EU) 2024/1689 as amended", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2027-12-02", instrument: "EU AI Act", what: "Stand-alone Annex III HIGH-RISK obligations apply (deferred from 2 Aug 2026)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2028-01-01", instrument: "Illinois SB 315", what: "Mandatory annual independent third-party audits of frontier developers — the first US audit mandate", basis: "Public Act 104-0538 §10(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures (Public Act 104-0538)" },
    { date: "2028-08-02", instrument: "EU AI Act", what: "Product-embedded Annex I HIGH-RISK obligations apply (deferred from 2 Aug 2027)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to €15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
  ],
  disputed: [
    { item: "Council of Europe Framework Convention on AI (CETS 225) entry-into-force status", note: "sources disagree as of the verification date; stated honestly rather than guessed" },
  ],
  underwriting_note: "Each deadline carries penalty_exposure — the maximum statutory fine and its basis. This turns the calendar into an underwriting-input table: a mandated obligation + a date + a priced downside is the shape of an insurable trigger. CSOAI does not underwrite and bears no risk; this is the neutral substrate an insurer prices on.",
  penalty_tiers_eu_ai_act: { prohibited_practices: "up to €35,000,000 or 7% of worldwide annual turnover (Art 99(3))", most_obligations_incl_art50_and_gpai: "up to €15,000,000 or 3% (Art 99(4))", incorrect_or_misleading_info: "up to €7,500,000 or 1% (Art 99(5))" },
  demand_creating: ["Illinois SB 315 §10(d) audit mandate", "NY RAISE", "California SB 53", "EU CRA Article 14", "California CAITA provenance-detection mandate"],
};

export const onRequestGet: PagesFunction = async (context) => {
  // Build the served payload as a mutable copy, then sign it at the edge with the
  // dedicated board-attestation key (#board-attestation-1, provisioned as the
  // Cloudflare secret BOARD_SIGN_KEY_PKCS8_B64; its public half is published in
  // did.json). This is the SAME mechanism /api/gspc uses — a stranger can fetch
  // this feed, fetch did.json, and verify without trusting us. The old hardcoded
  // signature (estate key d4cb0eaa, now lost/unverifiable) is gone: a signature
  // nobody can check is worse than none. No key → NO signature field: honest
  // absence, never a fabricated one.
  const body: Record<string, unknown> = { ...FEED };
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT signature — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this regulation feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this feed with the signature field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → recompute canonical JSON and verify Ed25519 against did.json",
      };
    } catch {
      // A provisioned-but-broken key must not degrade to a fake pass: omit the
      // signature and surface the operational fault instead.
      body.signature = { error: "signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
