/**
 * Frozen → fluid training bridge (Part C-II).
 *
 * Grammar lock: "verified training-outcome record" — never certificate /
 * certified / certification-as-product. Compliance determination stays with
 * regulators and courts. We replace the frozen *evidence layer* with living
 * signed evidence.
 *
 * Firewall: MEOK delivers the sim; the Council measures the outcome.
 * Measurement is never sold. Strangers verify free. The learner owns the card.
 */

export const TRAINING_GRAMMAR = {
  product: "verified training-outcome record",
  banned: ["certificate", "certified", "certification", "accredited", "approved"],
  firewall:
    "MEOK delivers training. The Council measures outcomes. Commercial price is lawful on delivery (tooling). Measurement is never sold. Regulators verify free forever. The learner owns the card.",
} as const;

export type TrainingWorld = "dublin-office" | "council-city";
export type TrainingLane =
  | "art4-office"
  | "health"
  | "finance"
  | "hr"
  | "transport"
  | "public"
  | "energy"
  | "legal";

export type InstrumentBundle = {
  id: TrainingLane;
  industry: string;
  frozen: string;
  fluid: string;
  instruments: string[];
};

/** Frozen curriculum hash-pins. Fluid drills re-run when a change-card lands. */
export const INSTRUMENT_BUNDLES: InstrumentBundle[] = [
  {
    id: "art4-office",
    industry: "Every EU AI provider & deployer",
    frozen: "Art. 4 literacy duty in force 2 Feb 2025 (Reg (EU) 2024/1689). Digital Omnibus (Reg (EU) 2026/1744) reframes it as measures supporting literacy — no specific individual level to guarantee, and no certificate required.",
    fluid: "When the provision, the Q&A, or the model in the office changes, the signed change-card expires the last outcome record. The next drill is the evidence.",
    instruments: ["EU AI Act Art. 4", "Commission AI literacy Q&A", "Living repository of practices (no presumption of compliance)"],
  },
  {
    id: "finance",
    industry: "FCA / DORA firms",
    frozen: "DORA ICT-risk training for all staff; board knowledge kept current.",
    fluid: "A DORA RTS update or a model swap in the payments stack opens a named drill. Calendar expiry is the wrong clock.",
    instruments: ["DORA", "FCA SYSC", "EU AI Act Art. 4"],
  },
  {
    id: "hr",
    industry: "Employment / HR tech",
    frozen: "Annex III high-risk (recruitment, worker evaluation) — deferred stand-alone duties, literacy already live.",
    fluid: "A hiring-model update or an Annex III date move invalidates the last office-sim record for that role.",
    instruments: ["EU AI Act Annex III", "Art. 4", "GDPR Art. 22"],
  },
  {
    id: "health",
    industry: "Health & medical devices",
    frozen: "MDR/IVDR + AI Act overlay. Frozen modules pin the cited articles.",
    fluid: "A software-as-device model patch or a notified-body FAQ is a change-card, not a new PDF course.",
    instruments: ["EU AI Act", "MDR", "Art. 4"],
  },
  {
    id: "transport",
    industry: "Transport & automotive",
    frozen: "Product-embedded high-risk clock (Digital Omnibus deferral) vs literacy duty already in force.",
    fluid: "Fleet-model over-the-air update → drill the driver-facing office and the city traffic desk.",
    instruments: ["EU AI Act Annex I", "Art. 4", "CRA Art. 14"],
  },
  {
    id: "public",
    industry: "Public sector / essential entities",
    frozen: "NIS2 Art. 20 — named members of the management body, personally. Training cannot be delegated to the CISO.",
    fluid: "A national transposition note or an incident-reporting change re-opens the board drill under the same name.",
    instruments: ["NIS2 Art. 20", "Art. 21", "EU AI Act Art. 4"],
  },
  {
    id: "energy",
    industry: "Energy & essential services",
    frozen: "NIS2 essential-entity hygiene + AI literacy for any AI on the network.",
    fluid: "SCADA-adjacent model change or a CER directive FAQ → city-grid scenario, not a slide deck.",
    instruments: ["NIS2", "CER", "Art. 4"],
  },
  {
    id: "legal",
    industry: "Legal / DOJ declination seekers",
    frozen: "USAM 'Effectiveness of a Compliance Program' — the program must work in practice, with evidence.",
    fluid: "A model, a policy, or a DOJ update that the frozen course cannot see. The replay is the evidence.",
    instruments: ["DOJ ECCP", "EU AI Act Art. 4", "Illinois SB 315 (from 2027)"],
  },
];

export const WORLDS: { id: TrainingWorld; name: string; blurb: string }[] = [
  {
    id: "dublin-office",
    name: "Dublin office (mundane)",
    blurb: "A real Tuesday: Slack, a vendor PDF, a board Slack ping, a model that quietly updated overnight.",
  },
  {
    id: "council-city",
    name: "Council City",
    blurb: "The same duty, city-scale: buildings are AI systems. When the law moves, the street does too.",
  },
];

export type DrillBeat = {
  id: string;
  world: TrainingWorld;
  prompt: string;
  choices: { id: string; label: string; correct: boolean; why: string }[];
};

export const ART4_DRILL: DrillBeat[] = [
  {
    id: "vendor-pdf",
    world: "dublin-office",
    prompt:
      "A vendor drops an 'AI literacy certificate' into the Dublin office channel and says Art. 4 is done. What is the lawful next move?",
    choices: [
      {
        id: "accept-cert",
        label: "File it as Art. 4 compliance — a certificate is what the Act wants.",
        correct: false,
        why: "The Commission Q&A is explicit: no certificate is required, and a certificate is not a determination of compliance.",
      },
      {
        id: "document-and-drill",
        label: "Keep it as documentation of a measure taken, then run the live drill for this role and this model.",
        correct: true,
        why: "Art. 4 is a duty to take supporting measures, evidenced in practice. Manuals and certificates are not the bar. The outcome record is.",
      },
      {
        id: "ignore",
        label: "Ignore it — literacy is optional after the Digital Omnibus.",
        correct: false,
        why: "The Omnibus softened the wording (no guaranteed individual level) but the obligation to take measures remains in force since 2 Feb 2025.",
      },
    ],
  },
  {
    id: "repository",
    world: "dublin-office",
    prompt:
      "Legal forwards the Commission's living repository of AI literacy practices and asks if copying one grants presumption of compliance.",
    choices: [
      {
        id: "yes-presumption",
        label: "Yes — it is the Commission's own catalogue.",
        correct: false,
        why: "The Q&A repeats: replicating repository practices does not automatically grant presumption of compliance with Article 4.",
      },
      {
        id: "no-presumption",
        label: "No. Use it as a learning example, then evidence our own measures against our systems.",
        correct: true,
        why: "Best-practice repositories are exchange, not a safe harbour. The signed outcome record is what an auditor can check without trusting us.",
      },
      {
        id: "wait-guidelines",
        label: "Wait for a rubric from the AI Office before doing anything.",
        correct: false,
        why: "The duty already applies. Waiting for a rubric is not a measure.",
      },
    ],
  },
  {
    id: "change-card",
    world: "council-city",
    prompt:
      "A signed change-card lands: the Digital Omnibus rewrote Art. 4 and a city hiring-model shipped a new checkpoint. The 2025 slide course is still 'valid' for another six months on the LMS calendar. What happens to last quarter's training evidence?",
    choices: [
      {
        id: "calendar",
        label: "Nothing — completion is valid until the LMS expiry date.",
        correct: false,
        why: "Recurrency: validUntil = min(window, provision-change-event). Calendar expiry is the frozen-course clock. The law does not use it.",
      },
      {
        id: "expire-and-play",
        label: "The last outcome record is stale. Notify the named people and play the updated city / office scenario.",
        correct: true,
        why: "Fluid evidence. Regulation or model change → change-card → AG-UI notice → new signed replay. That is the product.",
      },
      {
        id: "new-certificate",
        label: "Issue a fresh certificate so the board can show NIS2 auditors.",
        correct: false,
        why: "Certification claims stay banned. NIS2 wants named-individual training records that show competence, not a mark.",
      },
    ],
  },
  {
    id: "board-ask",
    world: "dublin-office",
    prompt:
      "A named director (NIS2 Art. 20) asks for something they can hand an insurer after Coalition-style document requests. What do we mint?",
    choices: [
      {
        id: "certificate",
        label: "A Council certificate of AI literacy.",
        correct: false,
        why: "We do not certify. Compliance determination stays with regulators and courts.",
      },
      {
        id: "outcome-record",
        label: "A verified training-outcome record in their name: scenario, seed, choices, frozen provision hash, change-card id. They hold it.",
        correct: true,
        why: "The signature is the moat — a stranger checks the card without trusting us. MEOK delivered the sim; the Council measured the outcome.",
      },
      {
        id: "attendance",
        label: "An attendance list from last year's all-hands.",
        correct: false,
        why: "Attendance is not an outcome. DOJ language is programs that work in practice, with evidence.",
      },
    ],
  },
];

export const BUYERS = [
  { who: "Cyber insurers", why: "Coalition-class mandates already deny claims for missing training documentation." },
  { who: "Personally liable boards", why: "NIS2 Art. 20 is a named-individual duty. It cannot be delegated to the CISO." },
  { who: "Every EU AI deployer", why: "Art. 4 has applied since 2 Feb 2025. No certificate; measures plus evidence." },
  { who: "FCA / DORA firms", why: "All-staff ICT-risk training, board knowledge kept current." },
  { who: "DOJ declination seekers", why: "Effectiveness in practice, with evidence — not a slide completion tick." },
] as const;

export const LOOP_STEPS = [
  { n: 1, title: "Regulation or model moves", body: "Corpus watch fingerprints the instrument. A model card or checkpoint hash changes." },
  { n: 2, title: "Signed change-card", body: "The IX detector becomes the training product's nervous system — not a newsletter." },
  { n: 3, title: "AG-UI notice", body: "Named learners are told which record is now stale, and which drill replaces it." },
  { n: 4, title: "City or mundane sim", body: "MEOK delivers the updated scenario with an AI tutor. Manuals stay on the shelf." },
  { n: 5, title: "Signed game replay", body: "IK whitespace: the session is an append-only action log + seed + predicate, not a completion tick." },
  { n: 6, title: "Outcome card", body: "Hash-chained locally now; Ed25519 / RFC 9943 when the board-attestation key is live. Learner owns it. Verify is free." },
] as const;

export const GROUNDING = [
  {
    claim: "Art. 4 in force 2 Feb 2025; no certificate required; repository gives no presumption of compliance.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/ai-talent-skills-and-literacy",
  },
  {
    claim: "Digital Omnibus (Reg (EU) 2026/1744) reframes Art. 4 as supporting measures, still an obligation.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/ai-talent-skills-and-literacy",
  },
  {
    claim: "NIS2 Art. 20 — management-body members follow training; liability for Art. 21 infringements is personal under national law.",
    href: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
  },
  {
    claim: "Open Badges 3.0 signs an achievement assertion (typically completion), not a measured scenario outcome against a frozen provision hash.",
    href: "https://www.1edtech.org/standards/open-badges",
  },
] as const;
