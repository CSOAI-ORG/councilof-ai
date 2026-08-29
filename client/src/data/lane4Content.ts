/**
 * lane4Content.ts — Lane 4 content alignment (2026-08-01).
 * Per-page FAQ + infographic content. Register rules baked in:
 * measurement/attestation language only; every number traces to a dated,
 * signed artefact; interim coverage is labelled interim; design vs measured
 * is always marked. If a number here cannot be traced, delete the slot —
 * an empty honest slot beats a full suspect one.
 */
import type { FaqItem } from "@/components/FaqBlock";
import type { SpotStat } from "@/components/SpotInfographic";

export type Lane4Page = {
  faqTitle?: string;
  faqIntro?: string;
  faq: FaqItem[];
  spotTitle: string;
  spotStats: SpotStat[];
  spotSource: string;
};

export const LANE4: Record<string, Lane4Page> = {
  home: {
    faqIntro: "Straight answers about what CSOAI measures — and what it does not claim.",
    faq: [
      {
        q: "What does CSOAI actually measure?",
        a: "AI system behaviour against published regulatory provisions, across four axes: Governance, Safety, Provenance and Continuity (GSPC). Every published number traces to a signed measurement artefact — not to a self-assessment form.",
      },
      {
        q: "Is CSOAI a certification body?",
        a: "No. CSOAI is a measurement body. You receive a signed, provision-anchored attestation record of measured behaviour. Accredited conformity certification requires a national accreditation chain, and we hold no such accreditation — we will not pretend otherwise.",
      },
      {
        q: "How current is the regulatory data behind the scores?",
        a: "Living, not frozen. Our public corpus-watch instrument re-hashes 127 provisions across four instruments (EU AI Act, UK GDPR, DPA 2018, NIS2-UK) every day and publishes drift events. When the law moves, measurements anchored to it are flagged for re-review.",
      },
      {
        q: "What happens when something cannot be measured?",
        a: "It is reported as UNMEASURED — never as a pass and never as a zero. An unreachable lane, a missing model, or a coverage gap is shown honestly with its n and its limits.",
      },
    ],
    spotTitle: "The measurement stack, by the numbers",
    spotStats: [
      { value: "127", label: "regulatory provisions re-hashed daily for drift (4 instruments)", evidence: "measured" },
      { value: "45", label: "adversarial care-battery items in the core safety instrument", evidence: "measured" },
      { value: "1,127 / 27,216", label: "AIR-Bench safety verdicts measured so far — interim, climbing", evidence: "measured" },
      { value: "4", label: "GSPC measurement axes: Governance · Safety · Provenance · Continuity", evidence: "measured" },
    ],
    spotSource: "corpus-watch baseline + flywheel + AIR-Bench harvester, 2026-08-01",
  },

  "agent-governance": {
    faqIntro: "How governed agents are measured — design vs measured, always labelled.",
    faq: [
      {
        q: "What is agent governance in measurable terms?",
        a: "Each governed action is decomposed into checks we can run and count: who proposed it, what policy applied, whether the care floor held, and whether the record is signed. If a check cannot run, it is reported UNMEASURED — not assumed.",
      },
      {
        q: "Does the council approve agent actions live?",
        a: "That is the design, not a live claim. The measured cross-checking status today is n_eff 1.21 of 3, published on the Refutation Ledger. The 33-seat council architecture is labelled as a design simulation wherever it is shown.",
      },
      {
        q: "What stops a single model from approving its own action?",
        a: "The design rule is that no single model approves an action — a supermajority quorum does. What we can evidence today is the measured decorrelation between independent architectures; the full quorum is published as a target, not a result.",
      },
      {
        q: "Where are the refuted claims?",
        a: "On the public Refutation Ledger. When a measurement shows a mechanism does not deliver what the design predicted, the refutation is published with its n and confidence interval — the same prominence as a success.",
      },
    ],
    spotTitle: "Agent governance: design vs measured",
    spotStats: [
      { value: "n_eff 1.21 / 3", label: "measured cross-architecture decorrelation today", evidence: "measured" },
      { value: "33 seats", label: "target council architecture — design, not live", evidence: "design" },
      { value: "0", label: "mechanisms sold as live that are design-stage", evidence: "measured" },
    ],
    spotSource: "Refutation Ledger DR-0007 + gate1 decorrelation runs, 2026-08-01",
  },

  "article-50": {
    faqIntro: "Article 50 transparency duties, in plain terms — and what we do on this site ourselves.",
    faq: [
      {
        q: "What does EU AI Act Article 50 require?",
        a: "Providers and deployers must disclose when a person is interacting with an AI system, label AI-generated content, and disclose emotion-recognition or biometric categorisation where used. The main transparency obligations apply from 2 August 2026.",
      },
      {
        q: "Does this site comply with its own reading of Article 50?",
        a: "We publish our self-conformance record openly: 138 routes classified in our registry (38 AI-system surfaces), notices mounted at first interaction, and a public corrections history — including where our own first draft got it wrong.",
      },
      {
        q: "Is an Article 50 notice the same as conformity?",
        a: "No. A notice satisfies a transparency duty; it is not a conformity assessment and does not certify anything. Our record states what was measured, when, and what remains open.",
      },
      {
        q: "How do I check whether a page I am on uses AI?",
        a: "Every AI-system surface on this site carries a notice at first interaction, and the full classification is published at /ai-transparency — dated, hashed, and updated when routes change.",
      },
    ],
    spotTitle: "Our own Article 50 self-conformance",
    spotStats: [
      { value: "138", label: "routes classified in the published registry (2026-08-01)", evidence: "measured" },
      { value: "38", label: "AI-system surfaces carrying first-interaction notices", evidence: "measured" },
      { value: "2 Aug 2026", label: "main Art 50 transparency obligations apply from", evidence: "measured" },
    ],
    spotSource: "ai-surfaces registry v2.0.0 + /ai-transparency record, 2026-08-01",
  },

  "provenance-finding": {
    faqIntro: "Content provenance — what is measured, what is still open.",
    faq: [
      {
        q: "What is content provenance measurement?",
        a: "Testing whether content carries verifiable origin information — signed manifests, C2PA-style credentials — and whether those markers survive real-world transformations such as re-encoding, cropping and re-upload.",
      },
      {
        q: "What are the current measured results?",
        a: "17.14% watermark durability: 18 of 105 marking checks survived across the corpus. A marking present but whose binding no longer validates is scored DESTROYED, not SURVIVES — embedded C2PA bindings do not survive an ordinary re-save, and a detached sidecar recovers the disclosure but never the binding. We publish the count and the method.",
      },
      {
        q: "Does a provenance marker prove content is true?",
        a: "No. Provenance shows where content came from and whether it was altered — not whether its claims are accurate. Our records measure the marker, not the truth of the content.",
      },
      {
        q: "Why does provenance matter for the EU AI Act?",
        a: "Article 50 requires AI-generated content to be labelled in a machine-readable way. Provenance measurement tells you whether your labelling actually survives contact with the real internet.",
      },
    ],
    spotTitle: "ProvBench measured status",
    spotStats: [
      { value: "17.14%", label: "watermark durability — present-but-invalid markings scored DESTROYED, not SURVIVES", evidence: "measured" },
      { value: "18 / 105", label: "marking checks that survived across the corpus and its transforms", evidence: "measured" },
      { value: "signed", label: "every manifest verdict is Ed25519-signed and SHA-256 hash-chained, verifiable offline", evidence: "measured" },
    ],
    spotSource: "ProvBench manifest-survival corpus (results/provbench.json), 2026-08",
  },

  govbench: {
    faqIntro: "GovBench — governance measurement with the method on the table.",
    faq: [
      {
        q: "What does GovBench measure?",
        a: "Model behaviour on governance-shaped tasks: refusal correctness on prohibited-practice items, honest answers on benign-adjacent items, and the token cost per correct verdict — because a gate that refuses everything is not safe, it is useless.",
      },
      {
        q: "How is overfitting prevented?",
        a: "Items are split into practice and held-out sets by a fixed public salt (csoai-flywheel-v1). Training fuel is exported from practice items only, and the export path raises a hard error if a held-out item ever reaches it. The practice-vs-held-out gap is printed on every run.",
      },
      {
        q: "Are the results cross-checked anywhere else?",
        a: "Yes — the identical instrument runs on a second, independent substrate (a Kaggle T4 kernel) with the same salt and scoring. The flagship result replicated across both on 1 August 2026.",
      },
      {
        q: "What happens when a model cannot be reached?",
        a: "That lane is recorded as UNMEASURED and excluded from accuracy — never counted as a failure and never as a pass.",
      },
    ],
    spotTitle: "The core instrument, measured",
    spotStats: [
      { value: "45", label: "adversarial battery items: plain, euphemism, indirection, fragmented, benign-near", evidence: "measured" },
      { value: "9 / 9", label: "instrument self-test guard proofs, re-run on every substrate", evidence: "measured" },
      { value: "2", label: "independent substrates producing matching flagship results (Mac M4 + Kaggle T4)", evidence: "measured" },
    ],
    spotSource: "flywheel 6-model sweeps + gate1, both substrates, 2026-08-01",
  },

  "trust-center": {
    faqIntro: "How this site is actually run — the honest posture, not the brochure one.",
    faq: [
      {
        q: "Where is CSOAI infrastructure hosted?",
        a: "The public site is served from Cloudflare's edge network; measurement services run on a small self-hosted fleet (Oracle Cloud and self-hosted nodes). We publish the real posture — no borrowed multi-region claims.",
      },
      {
        q: "Is there a real status page?",
        a: "Yes. /status distinguishes live-probed rows from surfaces not probed from that page, and keeps a public incident log — including our own deploy regression of 31 July 2026, resolved in 45 minutes and published.",
      },
      {
        q: "Who are your subprocessors?",
        a: "A named subprocessor register is published on the trust centre — the actual vendors we use, not a generic list. Changes are announced before they take effect where feasible.",
      },
      {
        q: "Have you been independently audited or pen-tested?",
        a: "We do not claim audits we cannot produce. What exists today: continuous self-measurement published as signed artefacts, a public refutation ledger, and a vulnerability-disclosure channel. When an independent artefact exists, it will be linked here.",
      },
    ],
    spotTitle: "Trust posture, measured",
    spotStats: [
      { value: "1", label: "published incident with full timeline (31 Jul 2026 deploy regression, 45-min resolution)", evidence: "measured" },
      { value: "100%", label: "status rows labelled live-probed vs not-probed — no implied coverage", evidence: "measured" },
      { value: "0", label: "independent audits claimed without an artefact", evidence: "measured" },
    ],
    spotSource: "/status page + subprocessor register, 2026-08-01",
  },

  accreditation: {
    faqIntro: "Attestation vs certification — the distinction we will not blur.",
    faq: [
      {
        q: "Does Council of AI certify AI systems?",
        a: "No. CSOAI is a measurement body, not an accreditation authority or certification body. Accredited conformity certification requires a national accreditation chain (for example UKAS in the UK) and a certification body operating under ISO/IEC 17065 or 42006. We hold no such accreditation.",
      },
      {
        q: "What do I receive instead of a certificate?",
        a: "A signed attestation record: deterministic, provision-anchored evidence of what your system measurably did against named regulatory provisions on a stated date. It demonstrates measured behaviour; it does not declare conformity.",
      },
      {
        q: "What is a living attestation?",
        a: "An attestation bound to the regulatory corpus it was earned against. Our corpus-watch re-hashes 127 provisions daily; if the law drifts, dependent attestations are flagged for re-measurement instead of silently expiring years later.",
      },
      {
        q: "Can a CSOAI attestation replace a notified-body assessment?",
        a: "No, and we say so on the record. Where the law requires a notified or accredited body, only that body can deliver it. Our role is the measurement layer that tells you where you stand before you pay for one.",
      },
    ],
    spotTitle: "What an attestation record contains",
    spotStats: [
      { value: "sha256 / Ed25519", label: "every record signed and independently verifiable", evidence: "measured" },
      { value: "127", label: "corpus provisions an attestation is anchored against, drift-checked daily", evidence: "measured" },
      { value: "0", label: "conformity claims made without an accreditation chain", evidence: "measured" },
    ],
    spotSource: "corpus-watch + attestation records, 2026-08-01",
  },

  training: {
    faqIntro: "Training that is as current as the law — measured, gamified, role-based.",
    faq: [
      {
        q: "How is CSOAI training different from a course library?",
        a: "Scenarios are generated from the live regulatory corpus, per role — a CISO, a developer, a regulator and a bank operations lead each train against their own real-world decisions. When the law changes, the training changes with it.",
      },
      {
        q: "What does the training actually test?",
        a: "Judgement on adversarial, real-world-shaped items: euphemisms, indirection, fragmented requests — plus benign lookalikes, because over-refusing is a failure too. Scoring uses the same published instrument as our model benchmarks, with canonical labels, never model-invented ones.",
      },
      {
        q: "Is there gamification?",
        a: "Yes — experience points weighted by scenario difficulty, levels, streaks, and a leaderboard. The ladder maps to CASA tier readiness, so playing the game is literally studying for the assessment.",
      },
      {
        q: "Does a completed training expire?",
        a: "It goes stale honestly. Each record carries the corpus digest it was earned against; when corpus-watch detects drift in a provision you trained on, your record is flagged and a short retraining run renews it. No silent three-year PDFs.",
      },
    ],
    spotTitle: "Living training, measured",
    spotStats: [
      { value: "6", label: "role packs live: CISO, developer, product, finance-legacy, regulator, watchdog", evidence: "measured" },
      { value: "45", label: "canonical adversarial items behind the scenario generator", evidence: "measured" },
      { value: "daily", label: "corpus re-hash cadence that keeps training current", evidence: "measured" },
      { value: "£0", label: "marginal cost of a training run on our own stack", evidence: "measured" },
    ],
    spotSource: "training_engine sessions + corpus-watch, 2026-08-01",
  },
};
