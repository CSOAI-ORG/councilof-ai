#!/usr/bin/env node
// Read-only evidence reconciliation. This is not an axis grader or board writer.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalBytes, sha256hex } from "../claim-capture.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = "public/interop/subject-axis-live-20261027/";
const source = (file) => { const bytes = readFileSync(path.join(root, file)); return { file, sha256: sha256hex(bytes) }; };
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const requirements = {
  "lab-practice": "Freeze artifact-level criteria for evaluations, safety frameworks and incident reports; verify the named documents and dates rather than matching words on a landing page.",
  "company-practice": "Bind each advertised capability to a scoped observed outcome or independent source; a company's own description is not evidence that it does what it says.",
  "measurer-integrity": "Pin actual methods, test-set availability/licensing and replayable result artifacts; run a disclosed reproduction and record access restrictions separately.",
  "harness-fidelity": "Run the same model digest and frozen bank through at least two pinned harnesses with the canonical grader; freeze parity tolerances before paired runs.",
  "interop-conformance": "Check linked versioned specifications, actual test-suite artifacts and conformance records; distinguish publication presence from implementation conformance.",
  "humanoid-deployment": "Resolve deployment identities against a named public registry with dates and independent corroboration; a robotics repository is not a deployment record.",
  "regulator-transparency": "Freeze factual artifact-presence checks and dated source references without a composite score or rating; public pages retain the existing owner hold.",
  "interpretability-reproducibility": "Select licensed runnable work, pin code/model/data/environment and reproduce a stated result with predeclared tolerance; repository text is only discovery.",
  "serving-fidelity": "Locate the reviewed 60-item private bank and BFCL gold by their full hashes, pin model and serving configurations, then run qualified reference/target pairs within the existing resource authorization.",
};
const args = process.argv.slice(2);
if (args[0] !== "--out" || !args[1] || ![2, 4, 6].includes(args.length) || (args.length >= 4 && args[2] !== "--artifacts") || (args.length === 6 && args[4] !== "--reproduction"))
  throw new Error("use --out NEW_PATH [--artifacts RETAINED_REPORT [--reproduction RESULT]]");
const artifactBytes = args[3] ? readFileSync(args[3]) : null;
const artifacts = artifactBytes ? JSON.parse(artifactBytes) : null;
if (artifacts && (artifacts.schema !== "csoai.subject-artifact-evidence/0.1" || artifacts.admission_eligible !== false || artifacts.axes_promoted !== 0))
  throw new Error("artifact inventory cannot grant axis admission");
const reproductionBytes = args[5] ? readFileSync(args[5]) : null;
const reproduction = reproductionBytes ? JSON.parse(reproductionBytes) : null;
if (reproduction && (reproduction.schema !== "csoai.tracr-example-result/0.1" || reproduction.admission_eligible !== false || reproduction.axes_promoted !== 0))
  throw new Error("example reproduction cannot grant axis admission");
const summary = read(base + "subject-axis-live-run-20261027.json");
const method = source(base + "subject-axis-live-run.mjs");
const rows = [];
for (const s of summary.subject_axes_banks) {
  if (!Object.hasOwn(requirements, s.axis)) throw new Error(`unexpected axis ${s.axis}`);
  const file = base + `bank-${s.axis}-live-20261027.json`, bank = read(file);
  const payloads = bank.items.filter((i) => i.payload);
  const digestMatches = payloads.filter((i) => sha256hex(canonicalBytes(i.payload)) === i.expected_payload_sha256).length;
  const tamperCaught = payloads.filter((i) => sha256hex(canonicalBytes({ ...i.payload, content_sha256: "0".repeat(64) })) !== i.expected_payload_sha256).length;
  const grouped = new Map();
  for (const item of bank.items) {
    const key = new URL(item.url).href;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item.item_id);
  }
  const rejectionReasons = ["KEYWORD_DISCOVERY_DOES_NOT_ESTABLISH_DECLARED_CONSTRUCT", "SUBJECT_IDENTITY_AND_APPLICABILITY_NOT_REVIEWED", "INDEPENDENT_REVIEW_NOT_EVIDENCED"];
  if (bank.score_caveat.includes("after today's data was seen")) rejectionReasons.push("THRESHOLD_SELECTED_AFTER_OBSERVATION");
  if (payloads.some((i) => i.payload.bytes === 400000)) rejectionReasons.push("RESPONSE_BYTES_AT_OLD_READER_CAP");
  if (bank.n_subjects_in_grid !== bank.items.length) rejectionReasons.push("PRIOR_UNREACHABLE_FRAME_MEMBERS_OMITTED_FROM_BANK");
  if (s.axis === "regulator-transparency" && ("score" in bank || "bar_scores" in bank)) rejectionReasons.push("COMPOSITE_SCORE_FORBIDDEN_FOR_REGULATOR_AXIS");
  const artifactSources = artifacts?.rows.filter((r) => r.candidates.some((c) => c.axis === s.axis)) || [];
  rows.push({ axis: s.axis, state: "DISCOVERY_AUDITED_NOT_AXIS_MEASUREMENT", public_axis_n: 0,
    evidence: source(file), generated_at: bank.generated_at, discovery_items: bank.n_items,
    reported_discovery_valid: bank.n_valid, payloads: payloads.length,
    payload_digest_matches: digestMatches, altered_payloads_rejected: tamperCaught,
    responses_at_reader_byte_cap: payloads.filter((i) => i.payload.bytes === 400000).length,
    bank_method_matches_retained_source: bank.method_sha256 === method.sha256,
    posthoc_threshold: bank.score_caveat.includes("after today's data was seen"),
    original_frame_rows: bank.n_subjects_in_grid,
    original_frame_rows_omitted_from_bank: bank.n_subjects_in_grid - bank.items.length,
    exact_url_duplicates: [...grouped.entries()].filter(([, ids]) => ids.length > 1).map(([url, item_ids]) => ({ url, item_ids })),
    admission_rejection_reasons: rejectionReasons,
    ...(artifacts ? { artifact_inventory: {
      source_records: artifactSources.length,
      original_frame_memberships: artifactSources.reduce((n, r) => n + r.candidates.filter((c) => c.axis === s.axis).length, 0),
      pinned_repository_sources: artifactSources.filter((r) => r.state === "PINNED_REPOSITORY_INVENTORY").length,
      verified_file_artifacts: artifactSources.reduce((n, r) => n + (r.artifacts || []).filter((a) => a.state === "PINNED_BYTES_VERIFIED").length, 0),
      retained_web_sources: artifactSources.filter((r) => r.state === "SOURCE_BYTES_RETAINED").length,
      unavailable_sources: artifactSources.filter((r) => r.state === "UNAVAILABLE").length,
      interpretation: "These are source and artifact counts, not valid subjects or completed measurement cases. Semantic, identity and applicability review remains open.",
    } } : {}),
    ...(s.axis === "interpretability-reproducibility" && reproduction ? { scoped_reproduction: {
      result_sha256: sha256hex(reproductionBytes), status: reproduction.status, counts: reproduction.counts,
      source_url: reproduction.source_url, input_sha256: reproduction.input_sha256,
      scope: reproduction.scope, limit: reproduction.limit, review_state: reproduction.review_state,
      report: "tracr-example-20261030/result.json", admission_eligible: false,
    } } : {}),
    admission_eligible: false, completion_requirement: requirements[s.axis],
    control_limit: "Digest controls check consistency of the authored payload. They do not validate the subject claim, keywords or measured construct.",
  });
}
const waveFile = "public/interop/claim-maintenance-wave-2026-10-30.json", wave = read(waveFile);
rows.push({ axis: "claim-maintenance", state: "CORRECTED_REREAD_REPLAYED_NOT_AXIS_ADMITTED", public_axis_n: 0,
  evidence: source(waveFile), generated_at: wave.completed_at, ...wave.counts,
  input_sha256: wave.input_sha256, admission_eligible: false,
  completion_requirement: "Review source-edit disclosure and withdrawal criteria, source clustering and sampling; bind independent review and authorized admission to the exact retained wave.",
});
rows.sort((a, b) => a.axis.localeCompare(b.axis));
if (rows.length !== 10 || new Set(rows.map((r) => r.axis)).size !== 10) throw new Error("expected ten distinct axes");
const humanoidFile = "public/interop/humanoid-registry-unsigned.json", humanoid = read(humanoidFile);
const regulatorFile = "public/interop/regulator-census.json", regulator = read(regulatorFile);
const humanoidStatuses = Object.fromEntries(["announced", "pilot", "deployed"].map((status) => [status, humanoid.rows.filter((r) => r.status === status).length]));
if (humanoid.rows.length !== humanoid.n || new Set(humanoid.rows.map((r) => r.id)).size !== humanoid.rows.length || Object.values(humanoidStatuses).reduce((a, b) => a + b, 0) !== humanoid.rows.length)
  throw new Error("humanoid registry membership inconsistent");
const recoveredRegistries = {
  humanoid: { ...source(humanoidFile), published_at: humanoid.published_at, original_axis: humanoid.axis,
    named_program_rows: humanoid.rows.length, historical_status_counts: humanoidStatuses,
    distinct_evidence_urls: new Set(humanoid.rows.map((r) => r.evidence_url)).size,
    missing_site_or_region: humanoid.rows.filter((r) => !r.site_or_region).length,
    use: "Recovered candidate registry for deployment review. Announced and pilot programs are not deployed units; historical source-status labels are not freshly verified deployments. The labour index and deployment axis are different constructs.",
    admission_eligible: false },
  regulator: { ...source(regulatorFile), as_of: regulator.as_of, target_records: regulator.targets.length,
    use: "The old plan counted 126 text lines. This artifact contains six targets, not 126 regulators or completed checks. Applicability and actual artifact types still need review.", admission_eligible: false },
};
rows.find((r) => r.axis === "humanoid-deployment").recovered_registry = recoveredRegistries.humanoid;
rows.find((r) => r.axis === "humanoid-deployment").completion_requirement = "Review and refresh the recovered 30-program named registry against its distinct source URLs; resolve lab, operator, site and lifecycle identities, and separate announcements/pilots from deployed units before considering a deployment-axis method.";
rows.find((r) => r.axis === "regulator-transparency").recovered_census = recoveredRegistries.regulator;
const report = { schema: "csoai.subject-axis-evidence-audit/0.2", generated_at: new Date().toISOString(),
  scope: "Reconcile historical discovery, corrected claim reread and optional pinned source artifacts. No new axis score, signature or public admission.",
  source_files: [source("functions/api/_gspc_axes_d.ts"), source(base + "subject-axis-live-run-20261027.json"), method,
    source(base + "sampling-frames-10-subject-axes-20261028.json")],
  rows, axes_audited: rows.length, axes_promoted: 0, recovered_registries: recoveredRegistries,
  ...(artifacts ? { artifact_inventory: { sha256: sha256hex(artifactBytes), input_sha256: artifacts.input_sha256,
    frame_rows: artifacts.frame_rows, sources: artifacts.sources, verified_artifacts: artifacts.verified_artifacts,
    review_state: artifacts.review_state, report: "TEN-AXIS-ARTIFACT-EVIDENCE-2026-10-30.json" } } : {}),
  exclusions: ["Formula-generated candidate metrics from the 25 October bank builder are not observations.",
    "Posthoc 3-of-5 keyword thresholds cannot qualify the declared behavioral or artifact-level constructs.",
    "Script-produced materiality labels do not prove human adjudication.",
    "Private replay bytes are retained on the execution host; public digests alone do not provide external reproduction."] };
writeFileSync(args[1], JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ axes_audited: 10, axes_promoted: 0,
  discovery_payloads: rows.reduce((n, r) => n + (r.payloads || 0), 0),
  payload_digest_matches: rows.reduce((n, r) => n + (r.payload_digest_matches || 0), 0),
  altered_payloads_rejected: rows.reduce((n, r) => n + (r.altered_payloads_rejected || 0), 0),
  responses_at_reader_byte_cap: rows.reduce((n, r) => n + (r.responses_at_reader_byte_cap || 0), 0) }));
