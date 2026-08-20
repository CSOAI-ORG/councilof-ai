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
export const ASSESSED_ON = "2026-08-20";

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
  "Coverage is small on purpose. Six benchmarks whose artifacts were actually fetched are worth more than fifty whose properties were assumed.",
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
