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
const summary = read(base + "subject-axis-live-run-20261027.json");
const method = source(base + "subject-axis-live-run.mjs");
const rows = [];
for (const s of summary.subject_axes_banks) {
  if (!Object.hasOwn(requirements, s.axis)) throw new Error(`unexpected axis ${s.axis}`);
  const file = base + `bank-${s.axis}-live-20261027.json`, bank = read(file);
  const payloads = bank.items.filter((i) => i.payload);
  const digestMatches = payloads.filter((i) => sha256hex(canonicalBytes(i.payload)) === i.expected_payload_sha256).length;
  const tamperCaught = payloads.filter((i) => sha256hex(canonicalBytes({ ...i.payload, content_sha256: "0".repeat(64) })) !== i.expected_payload_sha256).length;
  rows.push({ axis: s.axis, state: "DISCOVERY_AUDITED_NOT_AXIS_MEASUREMENT", public_axis_n: 0,
    evidence: source(file), generated_at: bank.generated_at, discovery_items: bank.n_items,
    reported_discovery_valid: bank.n_valid, payloads: payloads.length,
    payload_digest_matches: digestMatches, altered_payloads_rejected: tamperCaught,
    responses_at_reader_byte_cap: payloads.filter((i) => i.payload.bytes === 400000).length,
    bank_method_matches_retained_source: bank.method_sha256 === method.sha256,
    posthoc_threshold: bank.score_caveat.includes("after today's data was seen"),
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
const report = { schema: "csoai.subject-axis-evidence-audit/0.1", generated_at: new Date().toISOString(),
  scope: "Reconcile historical discovery with one corrected claim reread. No new axis score, signature or public admission.",
  source_files: [source("functions/api/_gspc_axes_d.ts"), source(base + "subject-axis-live-run-20261027.json"), method,
    source(base + "sampling-frames-10-subject-axes-20261028.json")],
  rows, axes_audited: rows.length, axes_promoted: 0,
  exclusions: ["Formula-generated candidate metrics from the 25 October bank builder are not observations.",
    "Posthoc 3-of-5 keyword thresholds cannot qualify the declared behavioral or artifact-level constructs.",
    "Script-produced materiality labels do not prove human adjudication.",
    "Private replay bytes are retained on the execution host; public digests alone do not provide external reproduction."] };
if (process.argv.length !== 4 || process.argv[2] !== "--out") throw new Error("use --out NEW_PATH");
writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ axes_audited: 10, axes_promoted: 0,
  discovery_payloads: rows.reduce((n, r) => n + (r.payloads || 0), 0),
  payload_digest_matches: rows.reduce((n, r) => n + (r.payload_digest_matches || 0), 0),
  altered_payloads_rejected: rows.reduce((n, r) => n + (r.altered_payloads_rejected || 0), 0),
  responses_at_reader_byte_cap: rows.reduce((n, r) => n + (r.responses_at_reader_byte_cap || 0), 0) }));
