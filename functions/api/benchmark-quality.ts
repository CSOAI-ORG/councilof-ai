// functions/api/benchmark-quality.ts — the BENCHMARK-QUALITY REGISTER.
//
// WHAT THIS IS. A public register that measures the PROCESS INTEGRITY of third-party AI
// benchmarks against deterministic predicates, each answerable from public artifacts alone.
// It is served as machine-discoverable JSON and signed at the edge with the same board key
// that signs /api/gspc. It is the mirror of everything else on this site: we measure models
// against the rules that govern them; here we measure the instruments themselves.
//
// ─────────────────────────────────────────────────────────────────────────────────────────
// THE FOUR RULES THIS FILE EXISTS TO ENFORCE
//
// 1. NO MODEL JUDGMENT. Every predicate is a boolean question about a public artifact —
//    "is a canary string published?", "is there a changelog?" — read by a human from a
//    fetched page. No language model scores anything here. That is the whole differentiator:
//    the 2026 wave of automated benchmark auditors runs LLM-as-judge; our doctrine forbids it,
//    and a register that graded benchmarks on scoring transparency using a model judge would
//    be self-refuting.
//
// 2. NO FABRICATED ASSESSMENTS. A benchmark appears here only if its artifacts were actually
//    fetched. Every predicate carries the URL fetched and the date it was fetched. A predicate
//    that could not be checked is UNKNOWN with a stated reason — never a guessed boolean.
//    Four honestly-checked benchmarks beat fifteen guessed ones.
//
// 3. THE IMPARTIALITY FIREWALL. Council of AI's OWN boards are structurally excluded from
//    this register and the exclusion is enforced in code below (EXCLUDED_SUBJECTS +
//    applyImpartialityFirewall), not merely promised in prose. A body must not assess its own
//    work — the independence doctrine of ISO/IEC 17020 and 17025. This is also the honest
//    answer to "you are marking your own homework": we cannot, because the code drops the row.
//
// 4. ATTRIBUTION SEMANTICS ARE BINDING. Every record states, in machine-readable fields, that
//    it is a MEASURED CURRENT STATE — not a certification, not an endorsement, unsolicited,
//    with no participation by the subject, from public artifacts only. The C2PA distinction
//    between what a party CREATED and what it merely GATHERED is the model: we gathered public
//    artifacts and recorded what they say. The words certified / approved / accredited /
//    "verified by" must never appear as a description of a subject on this register.
//
// WHAT IS DELIBERATELY NOT SCORED: construct validity — whether a benchmark measures the
// thing its name claims. That judgment is interpretive, contested, and not answerable by a
// deterministic predicate. We say so in `limitations` rather than dressing an opinion as a
// measurement.
//
// TO ADD OR REFRESH A RECORD: fetch the artifacts, read each predicate off the page, record
// the evidence, and set `fetched` to the day you fetched it. Never update a date without
// re-fetching — the date is the whole claim.
// ─────────────────────────────────────────────────────────────────────────────────────────

/** The day every artifact cited in this file was actually fetched. */
export const ASSESSED_ON = "2026-08-23";

export const SCHEMA = "csoai.benchmark-quality-register/0.1";

export type PredicateResult = "PASS" | "FAIL" | "UNKNOWN";

export type PredicateGroup =
  | "contamination_resistance"
  | "reproducibility"
  | "statistical_rigour"
  | "scoring_transparency"
  | "governance_coi"
  | "item_quality"
  | "licensing"
  | "saturation_discrimination"
  | "failure_disclosure";

interface PredicateDef {
  id: string;
  group: PredicateGroup;
  /** The deterministic question. Answerable yes/no by reading a public artifact. */
  question: string;
  /** What a PASS means, exactly — so a stranger can re-run the check and disagree precisely. */
  pass_means: string;
}

/**
 * THE PREDICATE CATALOGUE. Twenty-one questions, nine groups. Each is answerable from a public
 * artifact without judgment about whether the benchmark is any GOOD — only about whether its
 * process is disclosed. That distinction is the point.
 */
const PREDICATES: PredicateDef[] = [
  // ── contamination resistance ──
  {
    id: "canary_or_leakage_control",
    group: "contamination_resistance",
    question: "Does the primary public artifact publish a canary string, or an explicit instruction intended to keep the items out of training corpora?",
    pass_means: "A canary string, canary GUID, or an explicit non-republication / leakage-control instruction is present in the fetched artifact.",
  },
  {
    id: "temporal_split_declared",
    group: "contamination_resistance",
    question: "Does the benchmark declare a temporal boundary — items dated after a cutoff, or a periodic refresh of the item set?",
    pass_means: "The artifact states a dated refresh cadence or that items post-date a stated cutoff.",
  },
  {
    id: "private_heldout_described",
    group: "contamination_resistance",
    question: "Does the benchmark describe a private or held-out portion whose items are not published?",
    pass_means: "The artifact states that some split is kept private, or that evaluation on it runs only through a submission service.",
  },
  // ── reproducibility ──
  {
    id: "public_harness",
    group: "reproducibility",
    question: "Is the evaluation harness published so a third party can run it?",
    pass_means: "The artifact names a runnable public harness, script, or package for producing scores.",
  },
  {
    id: "pinned_or_containerised_env",
    group: "reproducibility",
    question: "Is the evaluation environment pinned — a container image, a lockfile, or fixed seeds?",
    pass_means: "The artifact states containerised evaluation, a dependency lockfile, or fixed random seeds.",
  },
  {
    id: "third_party_recompute_artifact",
    group: "reproducibility",
    question: "Does the benchmark link a third-party recompute — someone other than the authors reproducing the published numbers?",
    pass_means: "The artifact links an independent reproduction with its own result.",
  },
  // ── statistical rigour ──
  {
    id: "confidence_intervals_reported",
    group: "statistical_rigour",
    question: "Are confidence intervals (or equivalent uncertainty) reported alongside the headline scores?",
    pass_means: "The artifact shows an interval, standard error, or posterior spread beside a score.",
  },
  {
    id: "significance_test_between_ranked_systems",
    group: "statistical_rigour",
    question: "Is a significance test published between systems that the benchmark ranks against each other?",
    pass_means: "The artifact reports a test (p-value, paired test, or equivalent) between ranked systems, not merely point estimates.",
  },
  {
    id: "effective_n_disclosed",
    group: "statistical_rigour",
    question: "Is the number of scored items — the n behind each figure — published?",
    pass_means: "The artifact states per-split or per-figure item counts.",
  },
  // ── scoring transparency ──
  {
    id: "scoring_not_llm_judge",
    group: "scoring_transparency",
    question: "Is the scorer something other than a language model judging another language model?",
    pass_means: "The artifact describes deterministic scoring (unit tests, exact match, programmatic metric) or human adjudication, and does not describe an LLM judge.",
  },
  {
    id: "public_rubric_or_scoring_code",
    group: "scoring_transparency",
    question: "Is the rubric or the scoring code public?",
    pass_means: "The artifact publishes the scoring code, or a written rubric a third party could apply.",
  },
  // ── governance and conflict of interest ──
  {
    id: "funding_disclosed",
    group: "governance_coi",
    question: "Is the funding of the benchmark disclosed on the artifact a reader actually lands on?",
    pass_means: "The fetched artifact names who pays for the benchmark.",
  },
  {
    id: "no_pay_to_rank_mechanism",
    group: "governance_coi",
    question: "Is the artifact free of any paid-listing, sponsored-ranking, or paid-submission mechanism for ranked parties?",
    pass_means: "No fee, sponsorship tier, or paid submission path for ranked parties appears in the fetched artifact.",
  },
  {
    id: "private_pretesting_disclosed",
    group: "governance_coi",
    question: "If private or pre-release testing is permitted, is it disclosed?",
    pass_means: "The artifact states that pre-release or private testing happens (disclosure — not a judgment about whether it is fair).",
  },
  {
    id: "symmetric_data_access",
    group: "governance_coi",
    question: "Do all parties get the same access to the item data — no gate that some parties clear and others do not?",
    pass_means: "The items are published without a per-party access gate, or the gate applies identically to everyone.",
  },
  {
    id: "deprecation_or_status_changelog",
    group: "governance_coi",
    question: "Is the benchmark's own lifecycle status — maintained, archived, superseded — published with a date?",
    pass_means: "The artifact carries a dated status or deprecation notice, or a release changelog for the benchmark itself.",
  },
  // ── item quality ──
  {
    id: "label_error_rate_published",
    group: "item_quality",
    question: "Is a label-error rate, or an equivalent quantified item-error disclosure, published?",
    pass_means: "The artifact quantifies how many items are wrong or disputed — a rate or a delta, not a promise of quality.",
  },
  {
    id: "corrections_process_public",
    group: "item_quality",
    question: "Is there a public route to report and get an item corrected?",
    pass_means: "The artifact links an issue tracker, form, or stated corrections procedure for item errors.",
  },
  // ── licensing ──
  {
    id: "spdx_license_machine_readable",
    group: "licensing",
    question: "Is the licence stated as a machine-readable SPDX identifier on the artifact?",
    pass_means: "A recognisable SPDX id (MIT, Apache-2.0, CC-BY-4.0, …) is shown in the artifact's own metadata.",
  },
  // ── saturation and discrimination ──
  {
    id: "still_separates_top_systems",
    group: "saturation_discrimination",
    question: "Does the published leaderboard still separate the top systems — is there readable headroom left?",
    pass_means: "Top-of-board scores were read on the fetched page and are not compressed at the ceiling.",
  },
  // ── failure disclosure ──
  {
    id: "public_corrections_ledger_or_versioning",
    group: "failure_disclosure",
    question: "Is there a public version history or corrections ledger for the item set itself?",
    pass_means: "The artifact publishes dated versions, a changelog, or a corrections ledger for the data.",
  },
];

/** An artifact actually fetched in the course of building a record. */
interface Artifact {
  key: string;
  url: string;
  fetched: string;
  what: string;
}

/**
 * One recorded check. `src` names the artifact key the answer was read from — every check is
 * traceable to a URL and a date, or it does not ship.
 */
type Check = {
  id: string;
  result: PredicateResult;
  /** What was actually observed. Short quotes are the source's own words. */
  evidence: string;
  src: string;
  /** REQUIRED when result is UNKNOWN. Why the check could not be completed. */
  unknown_reason?: string;
};

interface SubjectRecord {
  id: string;
  benchmark: string;
  publisher: string;
  homepage: string;
  /** What actually produces the score, in plain words. Descriptive, not graded. */
  scorer_kind: string;
  artifacts: Artifact[];
  checks: Check[];
}

/**
 * ── THE RECORDS ────────────────────────────────────────────────────────────────────────────
 * Every artifact below was fetched on ASSESSED_ON. Every evidence string is what the page
 * said. Where a page was silent, the result is FAIL scoped to that page (see RESULT_SEMANTICS)
 * — where a page could not be read at all, the result is UNKNOWN with the reason.
 */
const SUBJECTS: SubjectRecord[] = [
  // ── MMLU ─────────────────────────────────────────────────────────────────────────────────
  {
    id: "mmlu",
    benchmark: "MMLU (Measuring Massive Multitask Language Understanding)",
    publisher: "Hendrycks et al. / CAIS",
    homepage: "https://github.com/hendrycks/test",
    scorer_kind: "unstated on the fetched artifacts",
    artifacts: [
      { key: "repo", url: "https://github.com/hendrycks/test", fetched: ASSESSED_ON, what: "the benchmark's primary repository page" },
      { key: "readme", url: "https://raw.githubusercontent.com/hendrycks/test/master/README.md", fetched: ASSESSED_ON, what: "the raw README, read for method statements" },
      { key: "hf", url: "https://huggingface.co/datasets/cais/mmlu", fetched: ASSESSED_ON, what: "the dataset card carrying licence, splits and row counts" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "Neither the repository README nor the dataset card mentions a canary string or any leakage-control instruction.", src: "hf" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The card describes four fixed splits with no dated refresh and no post-cutoff item policy.", src: "hf" },
      { id: "private_heldout_described", result: "FAIL", evidence: "All four splits (auxiliary_train, dev, val, test) are published and downloadable; no split is described as private.", src: "hf" },
      { id: "public_harness", result: "PASS", evidence: "The repository states it contains OpenAI API evaluation code.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "No lockfile, container, or seed statement appears in the README.", src: "readme", unknown_reason: "The README is silent and the repository's dependency files were not opened in this pass; a pinned environment may exist unread." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent reproduction is linked from the fetched artifacts.", src: "repo", unknown_reason: "Third-party reproductions of MMLU exist in the literature; none is linked from the artifacts fetched, so no determination is recorded." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The repository leaderboard presents point scores by category with no interval or standard error.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears on either artifact.", src: "repo" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "Per-split counts are published: test 14,042; val 1,531; dev 285; auxiliary_train 99,842.", src: "hf" },
      { id: "scoring_not_llm_judge", result: "UNKNOWN", evidence: "Neither artifact states how answers are scored.", src: "hf", unknown_reason: "The scoring method is undocumented on both fetched artifacts. A widely-assumed exact-match scorer is not a stated fact, and we do not record assumptions as measurements." },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "Evaluation code ships in the public repository, so the scorer is inspectable even where it is undocumented.", src: "repo" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on the repository page or the dataset card.", src: "repo", unknown_reason: "Funding may be disclosed in the associated paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears on either artifact.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The artifacts do not address pre-release or private testing.", src: "repo", unknown_reason: "Silence on the artifact does not establish either that private pre-testing happens or that it does not." },
      { id: "symmetric_data_access", result: "PASS", evidence: "The test split is public and ungated on the dataset host — every party reads the same items.", src: "hf" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "Neither artifact carries a dated lifecycle status or a release changelog.", src: "hf" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The card's annotation-process and annotator sections both read as information-needed placeholders; no error rate is given.", src: "hf" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No corrections route, errata list, or item-dispute procedure appears on either artifact.", src: "hf" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "MIT, shown in the dataset card metadata and on the repository page.", src: "hf" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "A leaderboard table is present on the repository page.", src: "repo", unknown_reason: "Top-of-board score values were not read in this pass, so no headroom determination is recorded. A guessed saturation verdict would be exactly the fabrication this register forbids." },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No dated versions, changelog, or corrections ledger for the item set appears on either artifact.", src: "hf" },
    ],
  },
  // ── BIG-bench ────────────────────────────────────────────────────────────────────────────
  {
    id: "big-bench",
    benchmark: "BIG-bench (Beyond the Imitation Game)",
    publisher: "Google and collaborating authors",
    homepage: "https://github.com/google/BIG-bench",
    scorer_kind: "programmatic metrics (e.g. exact string match) run by the repository harness",
    artifacts: [
      { key: "repo", url: "https://github.com/google/BIG-bench", fetched: ASSESSED_ON, what: "the repository README and repository status banner" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The README states all task files contain a canary string that should not be edited, to prevent tasks leaking into web-scraped training data.", src: "repo" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No dated refresh cadence and no post-cutoff item policy appears in the README.", src: "repo" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The README describes no held-out or private split; tasks live in the public repository.", src: "repo" },
      { id: "public_harness", result: "PASS", evidence: "The README documents a public evaluation path with an evaluate_task script and named metrics.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The README documents a pytest gate for task submissions but states no container, lockfile, or seed policy for scoring runs.", src: "repo", unknown_reason: "Repository dependency files were not opened in this pass." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent reproduction is linked from the README.", src: "repo", unknown_reason: "Not determinable from the single artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "No interval, standard error, or uncertainty statement appears in the README.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance testing between ranked systems appears in the README.", src: "repo" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Per-task item counts were not read on the fetched page.", src: "repo", unknown_reason: "Counts live in the individual task.json files, which were not fetched in this pass." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The README describes programmatic metrics such as exact string match and probability-based scoring; no model-graded evaluation is described.", src: "repo" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "Scoring code and the named metric set are published in the repository.", src: "repo" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears in the README.", src: "repo", unknown_reason: "Funding may be disclosed in the associated paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears in the README.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The README does not address pre-release or private testing.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "Tasks are in a public, ungated repository under an open licence — the same items are available to every party.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The repository carries a dated archive notice: archived by the owner on 17 April 2026, now read-only.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate or quantified item-error disclosure appears in the README.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "The README names review criteria for accepting task submissions and an automated test gate, but does not describe a route to correct an accepted item.", src: "repo", unknown_reason: "A submission-review gate is not the same thing as a corrections route; the artifact does not resolve whether one exists. The archive notice also means any such route may now be closed." },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "Apache-2.0, shown on the repository page.", src: "repo" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The repository publishes no live leaderboard that was read in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "UNKNOWN", evidence: "No changelog or corrections ledger for the task set was observed on the fetched page.", src: "repo", unknown_reason: "Git history exists for the repository but was not fetched or read as a published corrections ledger." },
    ],
  },
  // ── SWE-bench ────────────────────────────────────────────────────────────────────────────
  {
    id: "swe-bench",
    benchmark: "SWE-bench",
    publisher: "SWE-bench team (Princeton NLP lineage)",
    homepage: "https://www.swebench.com",
    scorer_kind: "the repository's own unit tests, run in a container — a patch resolves an instance or it does not",
    artifacts: [
      { key: "repo", url: "https://github.com/SWE-bench/SWE-bench", fetched: ASSESSED_ON, what: "the repository README: licence, splits, harness, submission" },
      { key: "guide", url: "https://www.swebench.com/SWE-bench/guides/evaluation/", fetched: ASSESSED_ON, what: "the official evaluation guide: how grading works" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control instruction appears on the README or the evaluation guide.", src: "repo" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "Neither fetched artifact declares a dated cutoff or a refresh cadence for instances.", src: "repo" },
      { id: "private_heldout_described", result: "PASS", evidence: "The README states that evaluation for the multimodal test split is kept private and runs through a submission CLI.", src: "repo" },
      { id: "public_harness", result: "PASS", evidence: "A public harness is documented and run with a single command; the README states Docker is used for reproducible evaluations.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "PASS", evidence: "Evaluation runs in Docker containers with a cache-level control over base, env and instance images.", src: "guide" },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from either fetched artifact.", src: "repo", unknown_reason: "Not determinable from the artifacts fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Neither artifact reports intervals or uncertainty beside resolve rates.", src: "guide" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears on either artifact.", src: "guide" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The README states the Verified subset is 500 problems confirmed solvable by software engineers.", src: "repo" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The guide states patches are applied to real repositories and the repository's tests are run to verify the issue is resolved. No LLM judging is described.", src: "guide" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The harness is public and the guide documents the resolved / unresolved / error categories it emits.", src: "guide" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on either fetched artifact.", src: "repo", unknown_reason: "Funding may be disclosed in the associated papers, which were not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "Leaderboard submission runs through a public CLI; no fee or sponsorship tier appears on either artifact.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "Neither artifact addresses pre-release or private testing of systems before public listing.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "Public splits are ungated, and the private multimodal test split is withheld from everyone alike rather than from some parties.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "A CHANGELOG file is published in the repository root.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate is published. The Verified subset is described as human-confirmed solvable — an item-quality intervention, but not a quantified error rate for the full set.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "A changelog exists, but neither artifact describes a route to report and correct a bad instance.", src: "repo", unknown_reason: "The repository has an issue tracker, but no corrections procedure is stated on the artifacts fetched." },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "MIT, stated on the README with a pointer to the licence file.", src: "repo" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The public leaderboard was not fetched in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "A published CHANGELOG gives the item set a dated version history.", src: "repo" },
    ],
  },
  // ── GPQA ─────────────────────────────────────────────────────────────────────────────────
  {
    id: "gpqa",
    benchmark: "GPQA (Graduate-Level Google-Proof Q&A)",
    publisher: "Rein et al.",
    homepage: "https://huggingface.co/datasets/Idavidrein/gpqa",
    scorer_kind: "unstated on the fetched dataset card",
    artifacts: [
      { key: "card", url: "https://huggingface.co/datasets/Idavidrein/gpqa", fetched: ASSESSED_ON, what: "the gated dataset card: access terms, licence, validation accuracies, corrections form" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The card instructs users not to reveal examples from the dataset in plain text or images online, to reduce leakage into foundation-model training corpora.", src: "card" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The card declares no dated cutoff and no refresh cadence.", src: "card" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The card describes no held-out portion withheld from the released set.", src: "card" },
      { id: "public_harness", result: "UNKNOWN", evidence: "The dataset card documents no harness.", src: "card", unknown_reason: "Only the dataset card was fetched; the authors' evaluation repository was not fetched in this pass, so no determination is recorded." },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The card states no environment or seed policy.", src: "card", unknown_reason: "Same reason: the evaluation repository was not fetched." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from the card.", src: "card", unknown_reason: "Not determinable from the single artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Validation figures are given as bare point accuracies — expert 65%, non-expert 34%, a GPT-4 baseline 39% — with no intervals.", src: "card" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between systems appears on the card.", src: "card" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Split row counts were not read on the fetched card.", src: "card", unknown_reason: "The card's split table was not captured in this pass; the published item counts may well be stated and simply were not read." },
      { id: "scoring_not_llm_judge", result: "UNKNOWN", evidence: "The card does not state how answers are scored.", src: "card", unknown_reason: "Undocumented on the artifact fetched. We do not infer a scorer from the item format." },
      { id: "public_rubric_or_scoring_code", result: "UNKNOWN", evidence: "No rubric or scoring code is published on the card.", src: "card", unknown_reason: "The authors' evaluation repository was not fetched in this pass." },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on the card.", src: "card", unknown_reason: "Funding may be disclosed in the paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "GPQA publishes items, not a ranking service; no fee, sponsorship, or paid submission path appears on the card.", src: "card" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The card does not address pre-release testing.", src: "card", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "FAIL", evidence: "Access is gated: the card requires users to share contact information and accept non-disclosure conditions before download. Access is therefore conditional and per-party, not open.", src: "card" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No dated lifecycle status or release changelog appears on the card.", src: "card" },
      { id: "label_error_rate_published", result: "PASS", evidence: "The card quantifies item error: expert accuracy 65%, rising to 74% when identified mistakes are excluded. That delta is a published item-error disclosure.", src: "card" },
      { id: "corrections_process_public", result: "PASS", evidence: "The card publishes a corrections submission form for reporting item problems.", src: "card" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "CC-BY-4.0, shown in the dataset card metadata.", src: "card" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The card carries no live leaderboard that was read in this pass.", src: "card", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "A corrections form exists, but no version history or published ledger of accepted corrections appears on the card — reports go in, nothing comes back out in public.", src: "card" },
    ],
  },
  // ── LiveBench ────────────────────────────────────────────────────────────────────────────
  {
    id: "livebench",
    benchmark: "LiveBench",
    publisher: "LiveBench authors",
    homepage: "https://livebench.ai",
    scorer_kind: "automatic scoring against objective ground-truth answers; the project states no LLM judge is used",
    artifacts: [
      { key: "repo", url: "https://github.com/LiveBench/LiveBench", fetched: ASSESSED_ON, what: "the repository README: contamination policy, scoring, harness, releases" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or non-republication instruction appears in the README; the contamination strategy is refresh, not marking.", src: "repo" },
      { id: "temporal_split_declared", result: "PASS", evidence: "The README states new questions are released monthly and that questions are drawn from recently-released datasets, arXiv papers, news articles and film synopses. A dated current release is named.", src: "repo" },
      { id: "private_heldout_described", result: "UNKNOWN", evidence: "The README names a current release date later than the date of the publicly-released questions.", src: "repo", unknown_reason: "The gap between the current release and the public question set suggests questions may be withheld, but the README does not state that they are. Inferring a held-out set from two dates would be a guess, so none is recorded." },
      { id: "public_harness", result: "PASS", evidence: "A single public script runs the whole pipeline — generating answers, scoring them, and showing results.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The README documents an editable pip install from a project file but quotes no pinned versions, container, or seed.", src: "repo", unknown_reason: "Whether the project file pins versions was not determined; the file itself was not fetched." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from the README.", src: "repo", unknown_reason: "Not determinable from the artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "No interval or uncertainty statement appears in the README.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears in the README.", src: "repo" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Question counts per release were not read on the fetched page.", src: "repo", unknown_reason: "Counts were not captured in this pass." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The README states every question has verifiable, objective ground-truth answers, scored automatically without the use of an LLM judge.", src: "repo" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The scoring stage is part of the published pipeline script in the public repository.", src: "repo" },
      { id: "funding_disclosed", result: "FAIL", evidence: "No funding or sponsorship statement appears in the README.", src: "repo" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears in the README.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The README does not address pre-release testing of systems.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "The released question set is public and ungated in the repository; no per-party access condition appears.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The README points to a changelog covering each LiveBench release, and names the current release by date.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate or quantified item-error disclosure appears in the README.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "No corrections route for a bad question is described in the README.", src: "repo", unknown_reason: "The repository has an issue tracker, but no corrections procedure is stated on the artifact fetched." },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", evidence: "A licence file is present in the repository, but its identifier was not read on the fetched page.", src: "repo", unknown_reason: "The licence file itself was not fetched, so no SPDX identifier is recorded. Naming one from memory would be a fabrication." },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The public leaderboard site was not fetched in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "Dated releases plus a published changelog give the question set a public version history.", src: "repo" },
    ],
  },
  // ── LMArena / Arena ──────────────────────────────────────────────────────────────────────
  {
    id: "lmarena",
    benchmark: "LMArena (Arena) model leaderboard",
    publisher: "Arena / LMArena",
    homepage: "https://arena.ai",
    scorer_kind: "human pairwise preference votes on anonymous side-by-side outputs",
    artifacts: [
      { key: "board", url: "https://arena.ai/leaderboard", fetched: ASSESSED_ON, what: "the leaderboard, reached via a 301 from lmarena.ai/leaderboard. Only navigation chrome was present in the served HTML." },
      { key: "how", url: "https://arena.ai/how-it-works", fetched: ASSESSED_ON, what: "the public method page: battle mode, voting, model testing" },
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary or leakage-control instruction appears on the method page; prompts come from users at vote time.", src: "how" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No dated cutoff or refresh cadence for a fixed item set is declared; there is no fixed item set.", src: "how" },
      { id: "private_heldout_described", result: "FAIL", evidence: "No private or held-out item set is described on the method page.", src: "how" },
      { id: "public_harness", result: "UNKNOWN", evidence: "The method page names no public harness a third party could run.", src: "how", unknown_reason: "The organisation publishes research code elsewhere; nothing was linked from the artifacts fetched, so no determination is recorded." },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "No environment or seed policy appears on the artifacts fetched.", src: "how", unknown_reason: "Not addressed on either page." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from either page.", src: "how", unknown_reason: "Not determinable from the artifacts fetched. Recomputation would also require the vote data, whose availability is not stated." },
      { id: "confidence_intervals_reported", result: "UNKNOWN", evidence: "The leaderboard HTML served to a non-browser client carried navigation only — no scores, no intervals.", src: "board", unknown_reason: "The leaderboard is client-rendered: its scores and any intervals are drawn after script execution, which this register does not perform. This predicate cannot be answered from the served artifact." },
      { id: "significance_test_between_ranked_systems", result: "UNKNOWN", evidence: "No statistical method is described on the method page, and the leaderboard itself did not render to the fetch.", src: "board", unknown_reason: "Same client-rendering limit. The method page is deliberately high-level and states no ranking mathematics." },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Vote counts were not present in the served leaderboard HTML.", src: "board", unknown_reason: "Same client-rendering limit." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The method page describes two anonymous models served side by side with the user deciding which answer fits better — a human vote, not a model judging a model.", src: "how" },
      { id: "public_rubric_or_scoring_code", result: "FAIL", evidence: "The vote criterion published is which answer best fits the voter's own needs. That is a preference, not a rubric a third party could apply consistently, and no scoring code is published on either page.", src: "how" },
      { id: "funding_disclosed", result: "FAIL", evidence: "Neither fetched page discloses funding, sponsorship, or model-provider commercial relationships.", src: "how" },
      { id: "no_pay_to_rank_mechanism", result: "UNKNOWN", evidence: "No paid-listing mechanism was observed on the artifacts fetched, and none is disclosed either way.", src: "how", unknown_reason: "Absence of a disclosure is not evidence that no commercial relationship with ranked parties exists. This is precisely the predicate that most needs a disclosure and does not have one, so it is recorded as unresolved rather than passed." },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "The method page discloses that since March 2024 the platform has helped test proprietary and open-source models from labs of all sizes, including pre-release models.", src: "how" },
      { id: "symmetric_data_access", result: "UNKNOWN", evidence: "Whether all providers receive the same access to battle and vote data is not addressed on either page.", src: "how", unknown_reason: "Not stated. Given that pre-release testing is disclosed, the symmetry question is live and unanswered on the public artifacts." },
      { id: "deprecation_or_status_changelog", result: "UNKNOWN", evidence: "No dated lifecycle or release changelog was observed on the artifacts fetched.", src: "board", unknown_reason: "Client-rendered surface; a changelog may exist on a page not fetched." },
      { id: "label_error_rate_published", result: "UNKNOWN", evidence: "Preference votes carry no gold label, and no vote-quality or error rate is published on the artifacts fetched.", src: "how", unknown_reason: "The predicate assumes a gold-labelled item set. For a preference leaderboard the analogous disclosure would be a vote-quality or noise estimate; none appears, and we do not convert a category mismatch into a FAIL." },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "No corrections or dispute route appears on the artifacts fetched.", src: "how", unknown_reason: "Not addressed on either page." },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", evidence: "No licence identifier appears on either fetched page.", src: "how", unknown_reason: "Leaderboard data licensing is not stated on the artifacts fetched." },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "Scores did not render to the fetch, so no separation between top systems could be read.", src: "board", unknown_reason: "Client-rendered leaderboard. Reporting a saturation verdict here would require reading numbers we did not read." },
      { id: "public_corrections_ledger_or_versioning", result: "UNKNOWN", evidence: "No public version history or corrections ledger was observed on the artifacts fetched.", src: "board", unknown_reason: "Client-rendered surface; not determinable from the served HTML." },
    ],

  // ── ARC-AGI ─────────────────────────────────────────────────────────────────────────────
  {
    id: "arc-agi",
    benchmark: "Abstraction and Reasoning Corpus for Artificial General Intelligence 2 (ARC-AGI-2)",
    publisher: "ARC Prize Foundation (nonprofit; co-founded by François Chollet and Mike Knoop, president Greg Kamradt)",
    homepage: "https://arcprize.org/arc-agi-2",
    scorer_kind: "Exact grid match: a task is solved only when the test-taker produces the correct output grid (dimensions plus every cell) for ALL test inputs. The readme is internally inconsistent on attempts: the 'Task success criterion' states 2 trials, while the 'Task file format' section states 3 trials (it also states 'Only *exact* solutions (all cells match the expected answer) can be said to be correct'). The site states the eval sets require pass@2 (solved by >=2 humans in <2 attempts). Scoring is done by the ARC-AGI Benchmarking repo / Kaggle-notebook verification pipeline, not by an LLM judge.",
    artifacts: [
      { key: "arc-agi-2-readme", url: "https://github.com/arcprize/ARC-AGI-2/blob/main/readme.md", fetched: "2026-08-23", what: "ARC-AGI-2 dataset readme: dataset composition (1,000 training / 120 eval), task success criterion, private-test-tier description, task JSON format, leakage warning." },
      { key: "arc-agi-2-site", url: "https://arcprize.org/arc-agi-2", fetched: "2026-08-23", what: "ARC-AGI-2 benchmark page: dataset-structure table (1,000 train / 120 public / 120 semi-private / 120 private), pass@2 calibration, 'easy for humans, hard for AI' claims." },
      { key: "arc-prize-policy", url: "https://arcprize.org/policy", fetched: "2026-08-23", what: "ARC Prize Verified Official Testing Policy: methodology, model selection, dataset tiers, verification process, reproducibility, funding/independence, verified badges." },
      { key: "arc-agi-2-changelog", url: "https://github.com/arcprize/ARC-AGI-2/blob/main/changelog.md", fetched: "2026-08-23", what: "Versioned public changelog of ARC-AGI-2 task corrections (off-by-one-pixel errors, ambiguities) with dates and commit hashes." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The readme explicitly warns against leakage: 'To ensure fair evaluation results, do not leak information from the evaluation set into your algorithm (e.g. by looking at the evaluation tasks yourself during development, or by repeatedly modifying an algorithm while using its evaluation score as feedback).' It also describes a 'semi-private set intended for testing remotely-hosted commercial models with low leakage probability' and a 'fully-private set... with near-zeo leakage probability.'", src: "arc-agi-2-readme" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The fetched readme/site describe only a task-tier split (public trainings, public eval, semi-private eval, private eval), not a temporal (time-based) train/test split; no temporal split is declared on the fetched artifacts.", src: "arc-agi-2-readme" },
      { id: "private_heldout_described", result: "PASS", evidence: "The readme states: 'ARC-AGI-2 also features two private test sets not included in the repo: A semi-private set intended for testing remotely-hosted commercial models... A fully-private set intended for testing self-contained models during the ARC Prize competition, with near-zeo leakage probability.' The site's table lists 'Semi-Private Eval Set 120 tasks... not public' and 'Private Eval Set 120 tasks... not public'.", src: "arc-agi-2-readme" },
      { id: "public_harness", result: "PASS", evidence: "The testing policy states: 'ARC-AGI-1 and 2 evaluations are run using the open source ARC-AGI Benchmarking repository' and 'How We Run Evaluations: ARC-AGI-1 & ARC-AGI-2' describe a reproducible invocation via a public repo.", src: "arc-prize-policy" },
      { id: "pinned_or_containerised_env", result: "PASS", evidence: "The policy fixes the runtime environment: 'Solutions must be submitted via a Kaggle notebook and run in <12 hours to ensure reproducibility'; 'The Kaggle notebook serves as the entry point and runtime environment for your submission... All configuration, setup, and compute provisioning must be automated within the Kaggle notebook itself.'", src: "arc-prize-policy" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "Policy: evaluation uses the open source 'ARC-AGI Benchmarking repository'; 'Public testing results (model outputs, evaluation durations, costs, and individual task scores) are published to HuggingFace'; and a verification fund states 'For each new verified high-score reproduction, we will reimburse up to $2,500.' With 'Solutions must be submitted via a Kaggle notebook and run in <12 hours to ensure reproducibility.'", src: "arc-prize-policy" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The policy reports only agreement thresholds ('ARC-AGI-1 - ... within ±10 percentage points. ARC-AGI-2 - ... within ±3 percentage points.'), which are pass/fail agreement bounds, not confidence intervals with a stated confidence level. Neither the readme nor the leaderboard text I fetched reports confidence intervals on scores.", src: "arc-prize-policy" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "The policy describes a verification/selection/agreement process but no statistical significance test between ranked systems is described on the fetched artifacts.", src: "arc-prize-policy" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The readme states 'ARC-AGI-2 contains 1,000 public training tasks and 120 public evaluation tasks' and the site table enumerates 1,000 / 120 / 120 / 120 per tier; each eval task is stated to have been 'solved by a minimum of 2 people... in 2 attempts or less in a controlled test.'", src: "arc-agi-2-readme" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The readme states the task success criterion: 'Only *exact* solutions (all cells match the expected answer) can be said to be correct.' Grids are compared cell-by-cell against a reference output, not graded by an LLM.", src: "arc-agi-2-readme" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The exact-match success criterion and pass@2 trial rule are spelled out in the readme ('A test-taker is said to solve a task when... they are able to produce the correct output grid for *all* test inputs... the test-taker is allowed 2 trials'), and the policy names the open-source 'ARC-AGI Benchmarking repository' used to score.", src: "arc-agi-2-readme" },
      { id: "funding_disclosed", result: "PASS", evidence: "Policy: 'ARC Prize Foundation is a nonprofit funded by donations from individuals, foundations, and AI labs. We publicly disclose all donors on our donation page.' It also states sponsorship 'has no influence over what we test, how we test, or when we publish.'", src: "arc-prize-policy" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "Policy: 'Sponsors receive no privileged access to our Private or Semi-Private Evaluation datasets, nor any special influence over the development of our benchmarks... No sponsor, regardless of contribution level, gains access to proprietary information.' Verification is not sold; the FAQ frames the leaderboard as a nonprofit transparency effort.", src: "arc-prize-policy" },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "Readme: 'Each task in `evaluation` has been solved by a minimum of 2 people (many tasks were solved by more) in 2 attempts or less in a controlled test.' Site: 'all tasks solved pass@2 by at least two humans.' Human pre-testing/validation of every public eval task is disclosed.", src: "arc-agi-2-readme" },
      { id: "symmetric_data_access", result: "FAIL", evidence: "The policy partitions data asymmetrically: 'Public Tasks - Fully open source and available for anyone to use... Private Evaluation Set - Access is extremely restricted to a small number of trusted parties. This set is used for the ARC Prize competition private leaderboard.' Different testers get different tiers (community gets public; verified/commercial get semi-private; competition gets private).", src: "arc-prize-policy" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The repo ships a versioned changelog (`changelog.md`) that tracks dataset state with dated entries (e.g. '2025-03-24 * 1,360 ARC-AGI-2 released', '2025-04-17 * Public eval task `d8e07eb2`...'). The site also publishes ARC-AGI-2 as a successor to ARC-AGI-1.", src: "arc-agi-2-changelog" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The changelog documents specific corrections (e.g. '2025-04-14 * Public Eval Tasks were updated with minor adjustments (off-by-one-pixel errors and slight ambiguities) to train and test pairs') and lists dozens of per-task commit fixes, but no aggregate label-error rate is published anywhere on the fetched artifacts.", src: "arc-agi-2-changelog" },
      { id: "corrections_process_public", result: "PASS", evidence: "The public changelog logs corrections with dates and commit links (e.g. 'Single test pair update... 385b7612', 'Train pair off by 2 error... PR #27'), i.e. corrections are made through a version-controlled public process.", src: "arc-agi-2-changelog" },
      { id: "spdx_license_machine_readable", result: "FAIL", evidence: "The fetched readme states no license; the repo provides a LICENSE file whose text is 'Apache License Version 2.0, January 2004', but no `SPDX-License-Identifier` line and no machine-readable license field (no package metadata `license` key) appear in what I fetched.", src: "arc-agi-2-readme" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The site states: 'Pure LLMs score 0% on ARC-AGI-2, and public AI reasoning systems achieve only single-digit percentage scores... every task in ARC-AGI-2 has been solved by at least 2 humans in under 2 attempts.' The readme states 'Average human performance on these tasks in our test sample was 66%.' The benchmark is designed so leading reasoning models still score far below human — i.e. it still separates top systems.", src: "arc-agi-2-site" },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "A dated, commit-linked changelog is publicly versioned in the repo (entries from 2025-03-24 through 2025-04-17, with per-task commit hashes/PRs), serving as a public corrections/versioning ledger.", src: "arc-agi-2-changelog" }
    ],
  },


  // ── GAIA ────────────────────────────────────────────────────────────────────────────────
  {
    id: "gaia",
    benchmark: "GAIA: a benchmark for General AI Assistants",
    publisher: "Meta (FAIR / GenAI), Hugging Face, AutoGPT, and collaborators (Mialon, Scialom et al.)",
    homepage: "https://huggingface.co/datasets/gaia-benchmark/GAIA",
    scorer_kind: "Quasi-exact match: 'evaluation is done via quasi exact match between a model's answer and the ground truth (up to some normalization that is tied to the \"type\" of the ground truth).' 'There is only one correct answer.' User responses are compared string-wise to the single ground-truth answer; not scored by an LLM judge.",
    artifacts: [
      { key: "gaia-arxiv-paper", url: "https://arxiv.org/abs/2311.12983", fetched: "2026-08-23", what: "GAIA technical paper: benchmark philosophy, dataset composition (466 questions, levels 1/2/3), validation, human baseline, exact-match scoring, reproducibility discussion." },
      { key: "gaia-hf-dataset-card", url: "https://huggingface.co/datasets/gaia-benchmark/GAIA", fetched: "2026-08-23", what: "Canonical GAIA HuggingFace dataset card (GATED — raw README and datasets-server API return HTTP 401 without authentication; card content could not be read)." },
      { key: "gaia-hf-leaderboard", url: "https://huggingface.co/spaces/gaia-benchmark/leaderboard", fetched: "2026-08-23", what: "GAIA leaderboard space (public benchmark leaderboard that the paper says hosts the held-out scoring)." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The paper documents leakage checks in question design: 'We type our questions in a search engine and check whether the answer can be deducted from the first page of results.' Question guidance: 'Make sure the answer to your question does not exist on the internet in plain text.' It also 'release[s] our questions while retaining answers to 300 of them to power a leader-board.'", src: "gaia-arxiv-paper" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The paper describes a level-based and annotation-based split (levels 1/2/3; 166 'annotated' developer questions + 300 'without annotations'), not a temporal (time-based) split; no temporal split is declared on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "private_heldout_described", result: "PASS", evidence: "The paper explicitly retains held-out answers: 'We release a developer set of 166 annotated questions and release the remaining 300 questions without annotations: the benchmark will be notably hosted as a leaderboard.'", src: "gaia-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The paper states 'We provide our scoring function along with the leaderboard. Section 3.3 Composition of GAIA' — a public scoring function accompanies the released leaderboard.", src: "gaia-arxiv-paper" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "The paper describes baselines run ad hoc ('Whenever an API is available, we run the model three times and report the average results'; 'we resort to manual ChatGPT queries' for GPT-4+plugins) but describes no pinned/containerised evaluation environment on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The paper provides the scoring function ('We provide our scoring function along with the leaderboard') and discusses reproducibility, while noting its limits: 'Reproducibility for closed-source assistants... an evaluation done at some point in time not reproducible.' The GPT-4+plugins score is explicitly flagged non-reproducible (an 'oracle' estimate).", src: "gaia-arxiv-paper" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Table 4 shows mean scores with margins such as 'GPT4 9.1 ± 2.5' and the text says 'Whenever we have direct API access, we run the model three times and report the average,' but the paper never describes these ± bounds as confidence intervals and gives no confidence level. No formal confidence interval is stated on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between the ranked baselines (GPT-4, GPT-4 Turbo, AutoGPT, GPT-4+plugins, search engine, human) is described on the fetched artifact — only mean scores per method.", src: "gaia-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper discloses question counts per level — 'Number of questions 146 245 75' (Level 1/2/3, total 466) — and states 'we run the model three times and report the average' for API baselines, and that times were obtained 'by running the API on 20 questions then averaging.'", src: "gaia-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The paper states: 'There is only one correct answer. Hence, evaluation is done via quasi exact match between a model's answer and the ground truth (up to some normalization that is tied to the \"type\" of the ground truth).' (Model-based grading is mentioned only as a future option.)", src: "gaia-arxiv-paper" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The paper both defines the scoring rule ('quasi exact match... up to some normalization that is tied to the \"type\" of the ground truth') and provides the scorer: 'We provide our scoring function along with the leaderboard.'", src: "gaia-arxiv-paper" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The paper lists author affiliations (FAIR/Meta, GenAI/Meta, Hugging Face, AutoGPT) and has an Acknowledgments list, but the fetched text states no specific funding/grant source for GAIA. (The generic arXiv footer acknowledging 'Simons Foundation...' is the standardized arXiv template, not a GAIA-specific disclosure.)", src: "gaia-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The paper frames GAIA as open scientific research ('We posit that the advent of AGI hinges on...'); it releases questions and hosts a public leaderboard, with no payment/rank mechanism described anywhere on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "The paper discloses pre-release validation: 'Validation phase. After question creation, we ask two new independent annotators to answer the questions to check it is not ambiguous,' and reports validation annotator scores (93.9 / 91.8 / 87.3 for levels 1/2/3).", src: "gaia-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "All leaderboard participants are scored against the same retained held-out set; the paper releases a single developer set (166 annotated) and keeps one set of 300 answers for ranking, with no public/private tiers for different classes of participant described on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No deprecation/status changelog or version history is published in the fetched paper or leaderboard artifacts.", src: "gaia-arxiv-paper" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The paper describes the validation phase (two independent annotators check ambiguity; human 'correct' rates 93.9/91.8/87.3) but publishes no quantitative label-error rate on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process is described for GAIA on the fetched artifacts.", src: "gaia-arxiv-paper" },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", unknown_reason: "The canonical HuggingFace dataset card (gaia-benchmark/GAIA) is gated — the raw README and datasets-server endpoints return HTTP 401 without authentication — and the fetched arXiv paper does not state a dataset license, so the license (the natural place to declare an SPDX identifier) could not be read.", evidence: "The license could not be determined: the dataset card is unreadable (gated/401) and the arXiv paper states no license.", src: "gaia-hf-dataset-card" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper states: 'the most capable LLMs do poorly on GAIA. Even equipped with tools, GPT4 does not exceed a 30% success rate for the easiest of our tasks, and 0% for the hardest. In the meantime, the average success rate for human respondents is 92%.' This large human-vs-AI gap shows GAIA still separates top systems.", src: "gaia-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No public corrections ledger or dataset versioning is described on the fetched GAIA artifacts.", src: "gaia-arxiv-paper" }
    ],
  },


  // ── MATH ────────────────────────────────────────────────────────────────────────────────
  {
    id: "math",
    benchmark: "MATH (Mathematics Aptitude Test of Heuristics)",
    publisher: "Dan Hendrycks, Collin Burns, Saurav Kadavath, Akul Arora, Steven Basart, Eric Tang, Dawn Song, Jacob Steinhardt (UC Berkeley / CMU)",
    homepage: "https://github.com/hendrycks/math",
    scorer_kind: "Exact match on the final boxed answer after normalization: 'These answers are unique after normalization, allowing MATH to be scored with exact match rather than with heuristic metrics such as BLEU.' Answer formatting is forced via rules; a `math_equivalence` utility decides whether two answers are equivalent. Not scored by an LLM judge.",
    artifacts: [
      { key: "math-github-readme", url: "https://github.com/hendrycks/math", fetched: "2026-08-23", what: "Repo README: 'This repository contains dataset loaders and evaluation code', with download links to the MATH and AMPS datasets and the NeurIPS 2021 citation." },
      { key: "math-arxiv-paper", url: "https://arxiv.org/abs/2103.03874", fetched: "2026-08-23", what: "Measuring Mathematical Problem Solving With the MATH Dataset: dataset composition (12,500 = 7,500 train + 5,000 test), exact-match scoring, difficulty/subject tagging, human-level comparison, MIT license statement." },
      { key: "math-license", url: "https://github.com/hendrycks/math/blob/main/LICENSE", fetched: "2026-08-23", what: "MIT License text (Copyright (c) 2021 Dan Hendrycks)." },
      { key: "math-setup", url: "https://github.com/hendrycks/math/blob/main/setup.py", fetched: "2026-08-23", what: "Packaging metadata for the `math_equivalence` scoring utility, including the Trove classifier 'License :: OSI Approved :: MIT License'." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control mechanism is described on the fetched artifacts; the paper describes a fully public train/test release and the 'Dataset Intended Uses' section discusses intended use/cheating but no leakage control. (The test set is released in full, so nothing is held out to control leakage.)", src: "math-arxiv-paper" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The split is by problem, not time: '12,500 problems (7,500 training and 5,000 test)'. No temporal (time-based) split is declared on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The paper states '12,500 problems (7,500 training and 5,000 test)' and the repo/README point to the full dataset being publicly downloadable (HuggingFace `qwedsacf/competition_math`). No private held-out set is described — the test set is public.", src: "math-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The README states: 'This repository contains dataset loaders and evaluation code'; the `math_equivalence` module in setup.py ('A utility for determining whether 2 answers for a problem in the MATH dataset are equivalent') is public scoring code.", src: "math-github-readme" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "No pinned/containerised evaluation environment is described; the repo provides setup.py, loaders and evaluation code but no container/pinned-runtime spec.", src: "math-github-readme" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The paper says 'the dataset and code for reproducing results is available at https://github.com/hendrycks/apps' (note: that URL on the fetched page points to the wrong repo, `apps` rather than `math`), and the repo publicly ships dataset loaders plus the `math_equivalence` scorer under an MIT license.", src: "math-arxiv-paper" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The paper reports single accuracy percentages per model (e.g. 4.9% for BART-Large on the test set) with no confidence intervals on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between models is described on the fetched artifact; results are reported as point accuracies.", src: "math-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper discloses composition: '12,500 problems (7,500 training and 5,000 test)', tagging 'by difficulty from 1 to 5' and 'seven subjects', and states the human comparison used '20 problems from the MATH test set.'", src: "math-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The paper states: 'These answers are unique after normalization, allowing MATH to be scored with exact match rather than with heuristic metrics such as BLEU.' Scoring is exact-match against a normalized ground-truth answer.", src: "math-arxiv-paper" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The paper specifies the formatting rules ('we force the final boxed answers to follow consistent formatting rules... probabilities are expressed as simplified fractions') and the repo provides the `math_equivalence` scorer (setup.py).", src: "math-setup" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The fetched paper text contains no acknowledgment or funding statement (no 'Acknowledgments'/'supported by' block was found in the fetched artifact).", src: "math-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The benchmark is a publicly released open dataset (MIT licensed) with no leaderboard, ranking, or payment mechanism described on the fetched artifacts.", src: "math-arxiv-paper" },
      { id: "private_pretesting_disclosed", result: "FAIL", evidence: "The paper describes a human-level comparison after release ('we randomly sampled 20 problems from the MATH test set and gave them to humans') but discloses no private pre-testing of the benchmark itself before release.", src: "math-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "The MATH train and test sets are fully public and identical for every user (README/HuggingFace link), so all participants have equal data access — including the reference answers.", src: "math-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No changelog or status/deprecation document is present on the fetched repo/paper artifacts.", src: "math-github-readme" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The paper documents the dataset and its Intended Uses but publishes no label-error rate on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process for the MATH dataset is described on the fetched artifacts.", src: "math-arxiv-paper" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "The repo LICENSE is canonical MIT text ('MIT License Copyright (c) 2021 Dan Hendrycks') and setup.py declares the machine-readable classifier 'License :: OSI Approved :: MIT License'. (Note: this is a Trove classifier, not a literal `SPDX-License-Identifier` string.)", src: "math-setup" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper states: 'Even though we are able to increase accuracy on MATH, our results show that accuracy remains relatively low, even with enormous Transformer models... scaling is not currently solving MATH.' Top models remain far from saturating it, so it still separates systems.", src: "math-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No public corrections ledger or dataset versioning is described on the fetched MATH artifacts.", src: "math-github-readme" }
    ],
  },


  // ── HumanEval ───────────────────────────────────────────────────────────────────────────
  {
    id: "humaneval",
    benchmark: "HumanEval (Hand-Written Evaluation Set)",
    publisher: "OpenAI",
    homepage: "https://github.com/openai/human-eval",
    scorer_kind: "Functional correctness via unit tests: a code completion is correct if it passes the problem's unit tests. Scores are reported as pass@k (e.g. 'pass@1', 'pass@10', 'pass@100') using an unbiased estimator. Not scored by an LLM judge.",
    artifacts: [
      { key: "humaneval-github-readme", url: "https://github.com/openai/human-eval", fetched: "2026-08-23", what: "HumanEval evaluation harness README: installation, sample format, `evaluate_functional_correctness` usage, pass@k output, untrusted-code sandbox warning, and a reproducible example yielding pass@1 = 0.5." },
      { key: "humaneval-arxiv-paper", url: "https://arxiv.org/abs/2107.03374", fetched: "2026-08-23", what: "Evaluating Large Language Models Trained on Code (Codex): HumanEval composition (164 problems, avg 7.7 tests/problem), functional-correctness metric, unbiased pass@k estimator, baseline scores (Codex 28.8%, GPT-3 0%, GPT-J 11.4%)." },
      { key: "humaneval-license", url: "https://github.com/openai/human-eval/blob/master/LICENSE", fetched: "2026-08-23", what: "MIT License text (Copyright (c) OpenAI)." },
      { key: "humaneval-setup", url: "https://github.com/openai/human-eval/blob/master/setup.py", fetched: "2026-08-23", what: "Packaging metadata declaring the `evaluate_functional_correctness` console entry point (version 1.0), with no license field set." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control mechanism is documented on the fetched artifacts; the README/paper describe a fully public, released evaluation set and a security-sandbox warning for executing code, but no leakage control.", src: "humaneval-github-readme" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No temporal (time-based) split is declared; HumanEval is a fixed, hand-written set of 164 problems. (The paper's only 'held-out split' reference is about a data-corpus cross-entropy eval, not HumanEval.)", src: "humaneval-arxiv-paper" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The paper states 'We release this data along with [the paper]' — the 164-problem HumanEval set is fully public; no private held-out set is described on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The README states: 'This is an evaluation harness for the HumanEval problem solving dataset' and provides the `evaluate_functional_correctness` command (registered as a console script in setup.py).", src: "humaneval-github-readme" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "The README only says 'Make sure to use python 3.7 or later' with `requirements.txt` (tqdm, fire, numpy) and warns that the program 'exists to run untrusted model-generated code... outside of a robust security sandbox.' No pinned container/environment is specified.", src: "humaneval-github-readme" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The harness is public and MIT-licensed, and the README shows a reproducible run: 'evaluate_functional_correctness data/example_samples.jsonl --problem_file=data/example_problem.jsonl' yields `{'pass@1': 0.4999999999999999}`.", src: "humaneval-github-readme" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The paper reports point pass@k estimates (Codex 28.8%, 70.2% with 100 samples) with no confidence intervals on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between the compared models (Codex vs GPT-3 vs GPT-J) is described on the fetched artifact; results are point accuracies.", src: "humaneval-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper states 'a set of 164 hand-written programming problems... average of 7.7 tests per problem'; the README example uses `num_samples_per_task = 200` and the paper notes the estimator constraint 'n=200 and k≤100' (pass@k not evaluated when fewer samples than k).", src: "humaneval-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The README shows running test suites and reporting 'whether the completion `passed` along with the execution `result` which is one of \"passed\", \"timed out\", or \"failed\"'; the paper says 'we evaluate the correctness of code samples automatically through unit tests.'", src: "humaneval-github-readme" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The repo ships `evaluate_functional_correctness` and per-problem unit tests; the paper provides the scoring formula and a 'numerically stable script for calculating an unbiased estimate of pass@k' (Figure 3).", src: "humaneval-github-readme" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The paper has an 'Acknowledgements' section (e.g. 'We thank Sandhini Agarwal...') but states no specific funding/grant source (authors are affiliated with OpenAI); no explicit funding disclosure is present on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The benchmark is an open-source MIT-licensed harness/dataset with no leaderboard, ranking, or payment-to-rank mechanism described on the fetched artifacts.", src: "humaneval-github-readme" },
      { id: "private_pretesting_disclosed", result: "FAIL", evidence: "No private pre-testing of the HumanEval benchmark before release is disclosed on the fetched artifacts.", src: "humaneval-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "The HumanEval set is fully public and identical for every user; all participants have equal access (including the public reference tests).", src: "humaneval-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No changelog or status/deprecation document is present on the fetched repo/paper artifacts.", src: "humaneval-github-readme" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate for the HumanEval problems is published on the fetched artifacts.", src: "humaneval-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process for the HumanEval set is described on the fetched artifacts.", src: "humaneval-github-readme" },
      { id: "spdx_license_machine_readable", result: "FAIL", evidence: "The repo LICENSE is MIT text ('The MIT License Copyright (c) OpenAI'), but `setup.py` declares no license field and no `SPDX-License-Identifier` string appears in the fetched artifacts, so the license is not machine-readable/SPDX-declared.", src: "humaneval-license" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper reports clear separation: 'our model solves 28.8% of the problems, while GPT-3 solves 0% and GPT-J solves 11.4%' — the benchmark distinguishes model capabilities. (Caveat for the register: because HumanEval is fully public, it is known to be prone to training-data contamination, which the paper does not address.)", src: "humaneval-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "The repo's only version marker is `version=\"1.0\"` in setup.py with no changelog; no public corrections ledger/versioning is published.", src: "humaneval-setup" }
    ],
  },
  },
];

/**
 * ── THE IMPARTIALITY FIREWALL ──────────────────────────────────────────────────────────────
 * Council of AI's own instruments MUST NOT appear on this register. A body that assesses its
 * own work is not an assessment body — ISO/IEC 17020 and 17025 both make organisational
 * independence from the subject a precondition, and the whole value of this register dies the
 * day we score ourselves well.
 *
 * This is enforced, not promised: applyImpartialityFirewall() drops any record whose id,
 * benchmark name, publisher, or homepage matches an excluded subject, and reports the drop in
 * the payload. If someone adds our own board here in a future edit, the code removes it and
 * says so.
 */
const EXCLUDED_SUBJECTS = [
  { id: "gspc-board", label: "The GSPC board and every axis on it (/api/gspc)", pattern: /\bgspc\b|councilof\.ai|csoai/i },
  { id: "csoai-benches", label: "GovBench, ProvBench, the AI Act benchmark and every other Council of AI instrument", pattern: /\b(gov|prov)bench\b|\bai[\s-]?act benchmark\b|council of ai|council academy/i },
  { id: "csoai-datasets", label: "The csoai/gspc-* dataset family and the boards published from it", pattern: /csoai\/|gspc-/i },
];

const IMPARTIALITY_POLICY =
  "Council of AI does not assess its own instruments on this register. The GSPC board, GovBench, " +
  "ProvBench, the AI Act benchmark and the csoai/gspc-* dataset family are structurally excluded, " +
  "and the exclusion is enforced in the code that builds this payload — a record matching an " +
  "excluded subject is dropped and the drop is reported. The reason is the independence " +
  "requirement that makes any assessment body's output worth reading (ISO/IEC 17020 and 17025 " +
  "doctrine): a body must not assess its own work. If you want Council of AI's own instruments " +
  "audited against these predicates, the correct answer is an independent party running this " +
  "same predicate set against us — the predicates and the export are published so that anyone can.";

const RESULT_SEMANTICS = {
  PASS: "The property is affirmatively evidenced in a named artifact fetched on the stated date. The evidence string records what was read.",
  FAIL: "Every fetched artifact that would ordinarily carry this property was readable, and none carries it. FAIL is scoped to the named artifacts on the named date — it is a statement about what the benchmark publishes there, not a claim about the project as a whole.",
  UNKNOWN: "The check could not be completed: the artifact that would answer it could not be read (client-rendered, gated, or not fetched in this pass), or the artifact is ambiguous. Every UNKNOWN carries its reason. An UNKNOWN is a correct outcome, never a placeholder for a guess.",
};

// ── record assembly ─────────────────────────────────────────────────────────────────────────

const byId = new Map(PREDICATES.map((p) => [p.id, p]));

interface BuiltRecord {
  id: string;
  benchmark: string;
  publisher: string;
  homepage: string;
  scorer_kind: string;
  record_type: "measured-current-state";
  not_a_certification: true;
  endorsement: "none";
  authored_by: "did:web:csoai.org";
  solicited: false;
  subject_participation: "none";
  access: "public_artifacts_only";
  assessed_on: string;
  claim: string;
  artifacts: Artifact[];
  tally: { checked: number; pass: number; fail: number; unknown: number };
  predicates: Array<
    PredicateDef & {
      result: PredicateResult;
      evidence: string;
      source_url: string;
      fetched: string;
      unknown_reason?: string;
    }
  >;
}

/**
 * Structural faults that must never ship as a silent pass. A record that fails any of these is
 * NOT rendered as a clean record — it is rejected into `rejected_records` where a reader sees it.
 */
function faultsOf(s: SubjectRecord): string[] {
  const faults: string[] = [];
  const keys = new Set(s.artifacts.map((a) => a.key));
  if (!s.artifacts.length) faults.push("no artifact was fetched for this subject");
  const seen = new Set<string>();
  for (const c of s.checks) {
    if (!byId.has(c.id)) faults.push(`check "${c.id}" is not in the predicate catalogue`);
    if (seen.has(c.id)) faults.push(`predicate "${c.id}" is answered twice`);
    seen.add(c.id);
    if (!keys.has(c.src)) faults.push(`check "${c.id}" cites artifact "${c.src}", which was not fetched`);
    if (c.result === "UNKNOWN" && !c.unknown_reason) faults.push(`UNKNOWN check "${c.id}" carries no reason`);
    if (!c.evidence) faults.push(`check "${c.id}" carries no evidence`);
  }
  return faults;
}

function build(s: SubjectRecord): BuiltRecord {
  const art = new Map(s.artifacts.map((a) => [a.key, a]));
  const predicates = s.checks.map((c) => {
    const def = byId.get(c.id) as PredicateDef;
    const a = art.get(c.src) as Artifact;
    return {
      ...def,
      result: c.result,
      evidence: c.evidence,
      source_url: a.url,
      fetched: a.fetched,
      ...(c.unknown_reason ? { unknown_reason: c.unknown_reason } : {}),
    };
  });
  const tally = {
    checked: predicates.length,
    pass: predicates.filter((p) => p.result === "PASS").length,
    fail: predicates.filter((p) => p.result === "FAIL").length,
    unknown: predicates.filter((p) => p.result === "UNKNOWN").length,
  };
  // The claim sentence is GENERATED, never hand-written, so it cannot drift from the data it
  // describes and can never acquire the word "certified".
  const named = predicates.map((p) => p.id).join(", ");
  const claim =
    `CSOAI measured ${s.benchmark} on ${ASSESSED_ON} using ${named} and recorded ` +
    `${tally.pass} PASS, ${tally.fail} FAIL and ${tally.unknown} UNKNOWN of ${tally.checked} predicates, ` +
    `each read from a named public artifact on that date.`;
  return {
    id: s.id,
    benchmark: s.benchmark,
    publisher: s.publisher,
    homepage: s.homepage,
    scorer_kind: s.scorer_kind,
    record_type: "measured-current-state",
    not_a_certification: true,
    endorsement: "none",
    authored_by: "did:web:csoai.org",
    solicited: false,
    subject_participation: "none",
    access: "public_artifacts_only",
    assessed_on: ASSESSED_ON,
    claim,
    artifacts: s.artifacts,
    tally,
    predicates,
  };
}

/** THE FIREWALL, IN CODE. Returns the records that may be published, and the ones removed. */
export function applyImpartialityFirewall(subjects: SubjectRecord[]) {
  const allowed: SubjectRecord[] = [];
  const blocked: Array<{ id: string; benchmark: string; excluded_by: string; reason: string }> = [];
  for (const s of subjects) {
    const hay = `${s.id} ${s.benchmark} ${s.publisher} ${s.homepage}`;
    const hit = EXCLUDED_SUBJECTS.find((e) => e.pattern.test(hay));
    if (hit) {
      blocked.push({
        id: s.id,
        benchmark: s.benchmark,
        excluded_by: hit.id,
        reason: `Matched the excluded subject "${hit.label}". Council of AI does not assess its own instruments; this record was removed from the register by the impartiality firewall.`,
      });
    } else {
      allowed.push(s);
    }
  }
  return { allowed, blocked };
}

const NOTICE_POLICY = {
  window_days: 14,
  procedure:
    "An adverse finding is sent to the benchmark's published maintainer contact at least 14 days " +
    "before it first appears on this register. The subject may reply, and the reply is published " +
    "beside the finding, unedited, whether or not we agree with it. If a subject shows a predicate " +
    "was read wrongly, the record is corrected and the correction is published — we never silently " +
    "edit a record.",
  right_of_reply: "https://councilof.ai/contact",
  corrections: "https://councilof.ai/api/corrections",
  applies_to: "Every record on this register, including records where every predicate passed.",
  first_publication_state:
    "This register is published as an open method with its first six records. Any subject on it may " +
    "invoke the right of reply at any time, and a reply arriving after publication is added to the " +
    "record exactly as one arriving during the notice window would be.",
};

const LIMITATIONS = [
  "These predicates measure PROCESS INTEGRITY — what a benchmark discloses about how it was built and scored. They are not a validity guarantee. A benchmark can pass every predicate here and still measure the wrong thing, and a benchmark can fail several and still be the best instrument in its field.",
  "CONSTRUCT VALIDITY IS DELIBERATELY NOT SCORED. Whether a benchmark measures the capability its name claims is an interpretive judgment, contested among the people who built it. We do not have a deterministic predicate for it, so we do not pretend to score it. Its absence here is a choice, not an oversight.",
  "A FAIL is scoped to the artifacts named on the record and the date they were fetched. It says a property was absent from what the benchmark publishes there. It does not say the property is absent from the project — a paper, a wiki, or an unfetched file may carry it.",
  "An UNKNOWN is a real result, not a gap to be filled later with a guess. Client-rendered leaderboards, gated datasets, and artifacts not fetched in a pass all produce UNKNOWN, and the reason is on every one.",
  "Predicate counts are not a score and must not be ranked. A benchmark with more PASSes than another is not thereby better; the predicates are not weighted, not independent, and not exhaustive. We publish no league table of benchmarks and no composite grade.",
  "No language model judged anything on this register. Every predicate was read off a fetched page by a human-directed process. This is a constraint we accept even where it costs coverage — an LLM-graded register of benchmark quality would fail its own scoring-transparency predicate.",
  "This register is unsolicited and the subjects did not participate. Nothing here is a certification, an accreditation, an endorsement, or a verification by any third party. Council of AI is a measurement body, not a certification or accreditation body and not a notified body.",
  "Coverage is small on purpose. Ten benchmarks whose artifacts were actually fetched are worth more than fifty whose properties were assumed. The register does not score construct validity, does not rank benchmarks, and never certifies.",
];

export function buildRegister() {
  const { allowed, blocked } = applyImpartialityFirewall(SUBJECTS);
  const records: BuiltRecord[] = [];
  const rejected: Array<{ id: string; faults: string[] }> = [];
  for (const s of allowed) {
    const faults = faultsOf(s);
    if (faults.length) rejected.push({ id: s.id, faults });
    else records.push(build(s));
  }
  const totals = records.reduce(
    (t, r) => ({
      pass: t.pass + r.tally.pass,
      fail: t.fail + r.tally.fail,
      unknown: t.unknown + r.tally.unknown,
      checked: t.checked + r.tally.checked,
    }),
    { pass: 0, fail: 0, unknown: 0, checked: 0 },
  );
  return {
    schema: SCHEMA,
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    register: "Benchmark-quality register — the process integrity of third-party AI benchmarks, measured with deterministic predicates",
    assessed_on: ASSESSED_ON,
    authored_by: "did:web:csoai.org",
    method:
      "Each predicate is a boolean question answerable from a public artifact. Someone fetched the " +
      "artifact, read the answer, and recorded the URL and the fetch date on the predicate. No " +
      "language model scored anything. Nothing was inferred from a benchmark's reputation.",
    no_model_judgment: true,
    record_type: "measured-current-state",
    not_a_certification: true,
    endorsement: "none",
    solicited: false,
    subject_participation: "none",
    access: "public_artifacts_only",
    result_semantics: RESULT_SEMANTICS,
    impartiality_policy: IMPARTIALITY_POLICY,
    impartiality: {
      enforced_in_code: true,
      enforced_by: "applyImpartialityFirewall() in functions/api/benchmark-quality.ts",
      excluded_subjects: EXCLUDED_SUBJECTS.map((e) => ({ id: e.id, label: e.label, pattern: e.pattern.source })),
      blocked_records: blocked,
      blocked_count: blocked.length,
    },
    notice_policy: NOTICE_POLICY,
    predicate_catalogue: PREDICATES,
    totals: {
      records: records.length,
      predicates_per_record: PREDICATES.length,
      ...totals,
      note: "Counts, not a score. Predicates are unweighted and non-exhaustive; do not rank benchmarks by them.",
    },
    records,
    rejected_records: rejected,
    limitations: LIMITATIONS,
    license: "CC-BY-4.0",
    license_note: "This register is CC-BY-4.0. Attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai.",
    export: "scripts/export-benchmark-quality.mjs writes a Croissant-aligned dataset export of this payload to dist/exports/benchmark-quality/.",
  };
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("benchmark");

  const body = buildRegister() as Record<string, unknown>;
  if (id) {
    const all = body.records as BuiltRecord[];
    const one = all.filter((r) => r.id === id);
    if (!one.length) {
      return new Response(
        JSON.stringify({ error: "unknown benchmark", known: all.map((r) => r.id) }, null, 2),
        { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
      );
    }
    body.records = one;
  }

  // ── site attestation ────────────────────────────────────────────────────────────────────
  // Signed at the edge with the board key (#board-attestation-1, a Cloudflare secret; its
  // public half is published in did.json). This attests the INTEGRITY of this payload as
  // published by the site — a stranger fetches the register, fetches did.json, and verifies
  // without trusting us. No key → no attestation field. Never a fabricated signature.
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
      const signedBytes = canonical(body); // body WITHOUT site_attestation — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.site_attestation = {
        attests: "integrity of this register snapshot as published by the site (NOT a re-assessment, and NOT a certification of any subject)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over canonical(payload minus site_attestation)",
      };
    } catch {
      body.site_attestation = { error: "board signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
