// /api/clarity — the Machine-Readability & Clarity Record (Options 2 + 3 of the
// regulator-measurement assessment, 2026-08-20; safeguards applied 2026-08-21).
//
// What this is: deterministic process facts about HOW regulatory regimes
// publish AI guidance — is the guidance published, is it versioned with a
// changelog, is it machine-readable, is it accessible, is there a published
// corrections process, is there a public decision register, is consultation
// feedback published. Every value is a predicate over a public artifact
// (URL probed, format negotiated) — no opinion, no score, no ranking, no
// composite judgement.
//
// What this is NOT: a league table of regulators. No ranked ordering of named
// bodies (the Doing Business failure mode). No adverse finding attached to any
// named individual. No "is this regulation good" judgement. Regimes are
// benchmarked only against their own stated commitments and the determinable
// format facts of their published output.
//
// UNMEASURED stays UNMEASURED: where a predicate was not verified on the
// verification date, it is stated as such rather than guessed.
//
// Structural safeguards (assessment Recommendation 3), binding on this feed:
//  - publication firewall: ring-fenced public-good surface; nobody measured pays
//  - notice-before-publication + right-of-reply for any newly-named regime
//  - methodology + predicate definitions published here so anyone can reproduce
//  - advisory board assembling (substitutes reputational for statutory independence)
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const FEED = {
  schema: "csoai.regulatory-clarity/0.2",
  what: "Machine-Readability, Clarity & Transparency-of-Process Record — binary, deterministic process facts about how regulatory regimes publish AI guidance. Predicates only; no scores, no ranking, no opinion. Companion to the deadline feed at /api/regulation.",
  verified_as_of: "2026-08-21",
  reverification_cadence: "quarterly, and on any provision-change event from the daily reg-watch detector",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections_policy: "appended, never edited — a wrong fact here is a published correction, not a silent fix",
  benchmark: "each regime is measured against its own stated commitments and the determinable format facts of its published output — never against a CSOAI quality standard",
  methodology: {
    what: "Each predicate is a binary determination over a public artifact, made on the verification date by direct HTTP probe with explicit content negotiation — no LLM judgement, no opinion, no scoring.",
    verification_protocol: [
      "1. For every regime row, the canonical source URL is probed with GET; HTTP status and size are recorded.",
      "2. machine_readable=YES requires a successful content-negotiated structured response (e.g. application/rdf+xml, application/xml, application/json) from the canonical source, or a documented structured-export service of the same publisher.",
      "3. versioned_with_changelog=YES requires a visible consolidation/version history or dated revisions on the canonical source.",
      "4. corrections_process=YES requires a published corrigenda/amendments mechanism at the source.",
      "5. Any predicate not independently verified on the verification date is UNMEASURED — never inferred, never guessed.",
      "6. A wrong fact is a corrections-ledger event: appended, never silently edited.",
    ],
    reproduction: "Reproduce any YES by running the probe recorded in that row's evidence: GET the source_url and, where recorded, the content-negotiation Accept header. Every YES row records its probe outcome in evidence.",
  },
  publication_firewall: {
    statement: "This record is published as a public good on the councilof.ai measurement surface, ring-fenced from any commercial arm. No measured regime is charged; no advisory or consulting is sold to any named body; the record is not an endorsement product. Measurement, not certification.",
    nobody_measured_pays: true,
    separate_surface: "councilof.ai/api/* — the measurement surface, distinct from any engagement or standing activity",
  },
  notice_process: {
    pre_publication_notice: "Before any regime is newly added carrying a NO predicate, the publisher sends a notice to that regime's public contact with the specific fact and its evidence, opening a right-of-reply window before publication (mirrors audit clearance).",
    right_of_reply: "A named regime may reply via the corrections ledger; replies are appended, never edited.",
    corrections_ledger: "https://councilof.ai/api/corrections",
  },
  advisory_board: {
    status: "assembling — recognised regulatory/legal credibility members (owner-gated intros)",
    role: "substitutes reputational independence for statutory independence CSOAI does not yet hold",
  },
  bright_lines: [
    "no ranked league table of regulator bodies (Doing Business failure mode)",
    "no adverse finding attached to any named individual (Derbyshire-shield limits)",
    "no composite quality/goodness score of any regulation",
    "no payment from any measured regime",
  ],
  predicates: {
    guidance_published: "is the implementing guidance / consolidated text for this instrument publicly available? YES / NO / UNMEASURED",
    machine_readable: "is the canonical version published in a structured format (XML / JSON / RDF / METS) a machine can ingest without scraping? YES / NO / UNMEASURED",
    versioned_with_changelog: "is the document versioned with a visible changelog or consolidation history? YES / NO / UNMEASURED",
    accessible: "is the document reachable over public HTTP with no login or paywall? YES / NO / UNMEASURED",
    corrections_process: "does the publisher operate a public corrections / corrigenda process? YES / NO / UNMEASURED",
    decision_register: "is there a public register of enforcement decisions for this regime? YES / NO / UNMEASURED",
    consultation_feedback_published: "does the regime publish the outcome/feedback of its public consultations? YES / NO / UNMEASURED",
  },
  regimes: [
    {
      regime: "EU",
      instrument: "AI Act (Reg (EU) 2024/1689) — consolidated text",
      canonical_source: "EUR-Lex CELEX 32024R1689",
      source_url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      guidance_published: "YES",
      machine_readable: "YES",
      versioned_with_changelog: "YES",
      accessible: "YES",
      corrections_process: "YES",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Probed 2026-08-20: EUR-Lex serves the CELEX record at HTTP 200 and answers content-negotiated application/rdf+xml at HTTP 200; EUR-Lex maintains dated consolidated versions and links OJ corrigenda from the CELEX record. Consultation-feedback publication for the wider regime not independently verified on this date.",
    },
    {
      regime: "EU",
      instrument: "Cyber Resilience Act (Reg (EU) 2024/2847) — consolidated text",
      canonical_source: "EUR-Lex CELEX 32024R2847",
      source_url: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
      guidance_published: "YES",
      machine_readable: "YES",
      versioned_with_changelog: "YES",
      accessible: "YES",
      corrections_process: "YES",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Probed 2026-08-20: CELEX record HTTP 200; same EUR-Lex XML/RDF and consolidation mechanics as the AI Act record. Other predicates not independently verified on this date.",
    },
    {
      regime: "EU",
      instrument: "Digital Omnibus (Reg (EU) 2026/1744) — consolidated text",
      canonical_source: "EUR-Lex CELEX 32026R1744",
      source_url: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
      guidance_published: "YES",
      machine_readable: "YES",
      versioned_with_changelog: "YES",
      accessible: "YES",
      corrections_process: "YES",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Probed 2026-08-20: CELEX record HTTP 200; the instrument is the deferral source cited in the /api/regulation headline correction (Annex III high-risk to 2027-12-02, Annex I high-risk to 2028-08-02). Other predicates not independently verified on this date.",
    },
    {
      regime: "EU",
      instrument: "GPAI Code of Practice (EU AI Office)",
      canonical_source: "European Commission digital-strategy page",
      source_url: "https://digital-strategy.ec.europa.eu/en/policies/ai-code-practice",
      guidance_published: "YES",
      machine_readable: "UNMEASURED",
      versioned_with_changelog: "UNMEASURED",
      accessible: "YES",
      corrections_process: "UNMEASURED",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Probed 2026-08-20: page HTTP 200. A canonical structured export and any feedback-publication record were not verified on this date; left UNMEASURED rather than guessed.",
    },
    {
      regime: "UK",
      instrument: "ICO guidance on artificial intelligence",
      canonical_source: "ico.org.uk guidance pages",
      source_url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/",
      guidance_published: "YES",
      machine_readable: "UNMEASURED",
      versioned_with_changelog: "UNMEASURED",
      accessible: "YES",
      corrections_process: "UNMEASURED",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Probed 2026-08-20: guidance landing page HTTP 200. A canonical structured export, an enforcement register and consultation-feedback publication were not independently verified on this date; left UNMEASURED.",
    },
    {
      regime: "UK",
      instrument: "Digital Regulation Cooperation Forum (DRCF) joint work programme",
      canonical_source: "DRCF publications",
      source_url: "https://www.drcf.org.uk/",
      guidance_published: "UNMEASURED",
      machine_readable: "UNMEASURED",
      versioned_with_changelog: "UNMEASURED",
      accessible: "UNMEASURED",
      corrections_process: "UNMEASURED",
      decision_register: "UNMEASURED",
      consultation_feedback_published: "UNMEASURED",
      evidence: "Not independently verified on 2026-08-20/21; every predicate stays UNMEASURED rather than assumed.",
    },
  ],
  disputed: [],
};

export const onRequestGet: PagesFunction = async (context) => {
  // Same edge-signing mechanism as /api/regulation and /api/gspc: the
  // dedicated board-attestation key (#board-attestation-1, provisioned as the
  // Cloudflare secret BOARD_SIGN_KEY_PKCS8_B64; its public half is published in
  // did.json). A stranger can fetch this feed, fetch did.json, and verify
  // without trusting us. No key -> NO signature field: honest absence, never a
  // fabricated one.
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
        attests: "integrity of this clarity feed as published by the site",
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
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
