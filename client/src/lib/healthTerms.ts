/**
 * What health systems actually say — terms we can use, terms we must not.
 *
 * Clinicians do not average pulse, creatinine and GCS into “the patient
 * is 0.73 healthy.” They list vital signs, mark each system examined or
 * deferred, and keep the chart complete. Composite scores (NEWS, APGAR,
 * GCS, Charlson) exist in medicine; we do not borrow those. They are
 * exactly the fused grade we refused.
 */

export type TermUse = "use" | "do-not";

export type HealthTerm = {
  id: string;
  term: string;
  use: TermUse;
  they_say: string;
  we_say: string;
};

export const HEALTH_TERMS_RULING =
  "Speak like a chart: vital signs, deferred systems, complete record. Do not speak like NEWS.";

export const HEALTH_VOICE =
  "15 of 22 systems examined. Seven deferred. Chart verifies. No second opinion yet. Addenda on the service: 30. Do not say the patient is well.";

export const GSPC_HEALTH_PITCH =
  "GSPC is the living chart for open-source systems and AI models — and the rest of the stack. We keep measuring vital signs. Deferred stays deferred. Anyone verifies the note. We never issue a clean bill of health.";

export const HEALTH_TERMS: HealthTerm[] = [
  {
    id: "vital-signs",
    term: "Vital signs",
    use: "use",
    they_say: "Pulse, pressure, saturations — each written, none averaged into wellness.",
    we_say: "A GSPC cell is a vital sign. Quote the axis. Do not mean the board.",
  },
  {
    id: "ros",
    term: "Review of systems",
    use: "use",
    they_say: "Each system: examined, deferred, or contraindicated.",
    we_say: "Declared slots. Measured, empty, or blocked. Empty stays empty.",
  },
  {
    id: "not-examined",
    term: "Not examined / deferred",
    use: "use",
    they_say: "We did not look. That is written, not guessed.",
    we_say: "UNMEASURED. OVER-BUDGET. The gap is the finding.",
  },
  {
    id: "contraindicated",
    term: "Contraindicated",
    use: "use",
    they_say: "This exam must not be done.",
    we_say: "GATED, LICENCE-BLOCKED, UNSAFE-ARTEFACT.",
  },
  {
    id: "lost-to-follow-up",
    term: "Lost to follow-up",
    use: "use",
    they_say: "The subject left the record.",
    we_say: "WITHDRAWN. The revision is gone.",
  },
  {
    id: "coverage",
    term: "Coverage",
    use: "use",
    they_say: "Vaccinated of eligible. N of M, never ‘the city is healthy 0.8’.",
    we_say: "N measured of M declared. csoai.sov-signal-index/1 counts rows.",
  },
  {
    id: "triage",
    term: "Triage",
    use: "use",
    they_say: "Who can be seen. Not a diagnosis.",
    we_say: "Speed 0 eligibility. DISCOVERED is not MEASURED.",
  },
  {
    id: "screening-vs-workup",
    term: "Screening vs workup",
    use: "use",
    they_say: "A screen lists. A workup measures.",
    we_say: "Census then unique-lineage run. Do not collapse them.",
  },
  {
    id: "chart-complete",
    term: "Chart completeness",
    use: "use",
    they_say: "Can a stranger read the note and check the signature?",
    we_say: "Card v2, evidence fetchable, verify_card against did:web.",
  },
  {
    id: "second-opinion",
    term: "Second opinion",
    use: "use",
    they_say: "Another service repeats the exam. Labelled as such.",
    we_say: "Independent rerun. Council-run vs reproduced.",
  },
  {
    id: "addendum",
    term: "Addendum / erratum",
    use: "use",
    they_say: "We were wrong. The chart is appended, not silently edited.",
    we_say: "GET /api/corrections. Thirty entries. Honesty asset.",
  },
  {
    id: "problem-list",
    term: "Problem list",
    use: "use",
    they_say: "Open issues, not a wellness score.",
    we_say: "Empty slots + corrections touching this digest.",
  },
  {
    id: "signs-not-dx",
    term: "Signs, not a diagnosis",
    use: "use",
    they_say: "Observations stand. Diagnosis is a later, separate act.",
    we_say: "We measure. Competent authorities diagnose compliance.",
  },
  {
    id: "bundle",
    term: "Bundle compliance",
    use: "use",
    they_say: "Each item present or absent. The bundle is a checklist.",
    we_say: "A+++ is seven musts, not a mean. 100 unique lineages, each complete.",
  },
  {
    id: "donabedian",
    term: "Structure / process / outcome",
    use: "use",
    they_say: "Donabedian: capacity, what was done, what was found. Outcome is not a prognosis.",
    we_say: "Corpus and instrument; the run; the signed cell. The index never predicts.",
  },
  {
    id: "notifiable",
    term: "Notifiable / reported",
    use: "use",
    they_say: "Listed to the register. Not the same as treated.",
    we_say: "DISCOVERED on hub-queue. UNMEASURED until a cell exists.",
  },
  {
    id: "news",
    term: "NEWS / APGAR / GCS / Charlson",
    use: "do-not",
    they_say: "Composite early-warning and comorbidity scores. One number from many signs.",
    we_say: "Exactly the fused health grade we do not ship.",
  },
  {
    id: "wnl",
    term: "Within normal limits / patient is well",
    use: "do-not",
    they_say: "A discharge gloss that hides deferred systems.",
    we_say: "Do not say the model is healthy. Quote the inventory.",
  },
  {
    id: "prognosis",
    term: "Prognosis / life expectancy",
    use: "do-not",
    they_say: "A forecast of the course.",
    we_say: "The coverage index never predicts.",
  },
  {
    id: "diagnosis-code",
    term: "Diagnosis as the product",
    use: "do-not",
    they_say: "ICD / a named disease as the output of the visit.",
    we_say: "No Article 50 stamp. No ISO 42001 mark. No conformity diagnosis.",
  },
];

export function termsWeUse(): HealthTerm[] {
  return HEALTH_TERMS.filter((t) => t.use === "use");
}

export function termsWeRefuse(): HealthTerm[] {
  return HEALTH_TERMS.filter((t) => t.use === "do-not");
}
