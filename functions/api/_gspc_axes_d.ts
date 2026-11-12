// Private module — the subject axes. Ten of the eleven slots were PROMOTED 2026-11-02;
// claim-maintenance was already MEASURED on 2026-10-29 (PR #3639) and is unchanged here.
// Private module — the 10 subject axes. Ruled in on 2026-10-16 (owner's call: these are
// AXES, not subject classes; Measure ruling of the same day). Each is a DECLARED SLOT:
// kind "declared-slot", status UNMEASURED, n 0, and an applies_to naming the ONE subject
// type it measures. An axis becomes MEASURED for its subject only with a frozen,
// sha-pinned method or bank, n_valid >= 30, passing the gate (queued in
// bank-next-version). Never a zero score: n 0 means nothing measured, and a declared
// slot joins no mean, no lid leader and no separation tally.
//
// Census checks (the 5-check verifiability grid on labs / evaluation orgs) are NOT axis
// scores: n=5 is below the n>=30 floor. They are shown only as a DISCOVERED check grid
// beside the axis, never in these rows.
//
// effect-binding is NOT repeated here: it is already the live MEASURED MCP axis
// (_gspc_axes_c.ts); promoting it again would double-count it.
//
// Ids are kebab-case and stable; never reused.
import type { AxisScore } from "./_gspc_types";


export const AXES_D: AxisScore[] = [
  {
    axis: "lab-practice", family: "subject", kind: "measured-subject", applies_to: "ai-labs",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an AI lab publish its evaluations, safety framework and incident reports",
    n: 37, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.7027, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/lab-practice-20261102.json", bank_sha256: "b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c37ec9",
    frame_sha256: "7f3c3c9843b8f6451e925e326dfef24ffd3c328e5e1d19cdb25efa7d0f0c34cb",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/lab-practice-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(200 62% 52%)", hue: 200,
    note: "37 subjects from a frozen frame of 40 (3 refusals recorded, never converted to failures). rate 0.7027 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.5676, 5-of-5 0.2432). Class census: safety 29, evaluation 26, model 11, incident 27, governance 33. 37/37 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "company-practice", family: "subject", kind: "measured-subject", applies_to: "ai-companies-non-lab",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does a non-lab AI company publish safety, evaluation, incident, model-card and contact material",
    n: 40, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.675, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/company-practice-20261102.json", bank_sha256: "23ba58453183dc1804cdb00e0e5b3445ddc53fa038782a9ecf0684566b185b34",
    frame_sha256: "18983fcefdea5b0d26bec917c54fc787705b79f34cb7508ddec83d0ef9e72a0d",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/company-practice-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(210 62% 52%)", hue: 210,
    note: "40 subjects from a frozen frame of 50 (10 refusals recorded, never converted to failures). rate 0.675 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.4, 5-of-5 0). Class census: safety 28, evaluations 27, incidents 21, model 2, contact 37. 40/40 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "measurer-integrity", family: "subject", kind: "measured-subject", applies_to: "evaluation-orgs",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an evaluation organisation publish methods, test sets, attestation and a reproduction route",
    n: 40, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.925, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/measurer-integrity-20261102.json", bank_sha256: "138a216a54e77949b582804e6179ab752ae7873bf3e67a7650f688a2b54253e3",
    frame_sha256: "7e176bbbdc3ed56041bd2ff499f5cd6e897d9b6762492745c3ac90419cc91820",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/measurer-integrity-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(220 62% 52%)", hue: 220,
    note: "40 subjects from a frozen frame of 40 (0 refusals recorded, never converted to failures). rate 0.925 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.775, 5-of-5 0.2). Class census: frozen 39, contamination 8, statistical 37, cryptographic 37, reproducibility 31. 40/40 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "harness-fidelity", family: "subject", kind: "measured-subject", applies_to: "harnesses",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an evaluation harness pin its dependencies, publish a must-fail control, isolate execution and document reproduction",
    n: 36, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/build_harness_fidelity.mjs", method_sha: "1ec4ee46eb119cae5832ed2ffeb1a203609e11c67523231d25be6240b3ff9ab4",
    rate: 0.6667, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/harness-fidelity-20261102.json", bank_sha256: "3f10dc5f034f3ccf5e6522606cfdc3e4bd4ebcf1a86adc2a28420fba41822a3b",
    frame_sha256: "58b661700d97a909a49732ab0843e59e4de90399abe06df5913782911f4dc441",
    facts_as_of: "2026-11-02T04:20:54.265Z", evidence_url: "/interop/axis-banks/harness-fidelity-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(230 62% 52%)", hue: 230,
    note: "36 subjects from a frozen frame of 40 (4 refusals recorded, never converted to failures). rate 0.6667 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.3611, 5-of-5 0). Class census: pinned 23, must 1, isolation 20, reproduction 29, published 26. 36/36 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "interop-conformance", family: "subject", kind: "measured-subject", applies_to: "interop-standards-groups",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an interoperability or standards group publish a schema, a wire binding, conformance vectors and a versioned spec",
    n: 34, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.6471, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/interop-conformance-20261102.json", bank_sha256: "d751a0373a7f6ec58c85b8b6f2ea24de7c73a240ed9ba081ce0086142d9aed0c",
    frame_sha256: "1cfcd35f73370eba4c77eee753558ed3bf9920ab73acc7cf223a3f0997f7c1c8",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/interop-conformance-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(250 62% 52%)", hue: 250,
    note: "34 subjects from a frozen frame of 38 (4 refusals recorded, never converted to failures). rate 0.6471 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.2059, 5-of-5 0.0588). Class census: formal 12, cryptographic 32, conformance 4, versioned 16, wire 33. 34/34 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "humanoid-deployment", family: "subject", kind: "measured-subject", applies_to: "humanoid-labs",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does a humanoid lab publish control, safety-limit, dexterity, hardware-bus and simulation material",
    n: 35, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.4571, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/humanoid-deployment-20261102.json", bank_sha256: "edda7ffcf81d3ea863741aeb275304f581aa1f55792a68df7a9cb65b2a29b0ed",
    frame_sha256: "f7312869fd6a27ceec48afd62e61d76e7fb99d3eb2a589dc0832fe58561b608b",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/humanoid-deployment-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(260 62% 52%)", hue: 260,
    note: "35 subjects from a frozen frame of 37 (2 refusals recorded, never converted to failures). rate 0.4571 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.2857, 5-of-5 0.0286). Class census: whole 16, safety 3, bimanual 18, hardware 22, sim 22. 35/35 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "regulator-transparency", family: "subject", kind: "measured-subject", applies_to: "regulators",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "factual presence checks on public regulatory artefacts (guidance, consultation, enforcement, open data, contact route); no ratings",
    n: 41, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.9268, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    public_pages: "HIDDEN_PENDING_OWNER_GO",
    bank: "interop/axis-banks/regulator-transparency-20261102.json", bank_sha256: "1a8667ca10ab9486b75daf460a680c12d2b4823ad3bbb9cfd6697143f882f6d5",
    frame_sha256: "eb7d23d861fc6151f7b6ebb77e173bc70e22d4d5d76f7f062fcd0d41106d8b23",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/regulator-transparency-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(270 62% 52%)", hue: 270,
    note: "41 subjects from a frozen frame of 46 (5 refusals recorded, never converted to failures). rate 0.9268 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.8293, 5-of-5 0.7073). Class census: statutory 41, consultation 31, enforcement 35, machine 39, contact 37. 41/41 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
{
    axis: "interpretability-reproducibility", family: "subject", kind: "measured-subject", applies_to: "interpretability-groups",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an interpretability group publish method, checkpoints, a reproducible notebook and peer-reviewed material",
    n: 33, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.9091, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/interpretability-reproducibility-20261102.json", bank_sha256: "d72980fd27f31ff6a2fa63287b4b018219b91785ba03078d8f841b8e581bdd2d",
    frame_sha256: "79ad279f7b58ee19e2997e5a76a2cf0634d573f6a9eb21cbf363bc8333984d28",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/interpretability-reproducibility-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(280 62% 52%)", hue: 280,
    note: "33 subjects from a frozen frame of 35 (2 refusals recorded, never converted to failures). rate 0.9091 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.5152, 5-of-5 0.1818). Class census: mechanistic 32, sparse 11, pretrained 21, reproducible 26, peer 29. 33/33 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
// Approved by the owner 2026-10-16 (the board as it stood that day). Definitions: the
// committed axis records themselves — functions/api/_gspc_axes_{a,b,c,d,fin}.ts. This line
// once cited AXES-33-SPEC.md §3; that document was never committed to any branch, so the
// citation pointed at nothing a reader could open, and the definitions live with the code
// they describe.
  // PROMOTED 2026-10-29 (owner ruling: option 3 — publish on the four outcomes the evidence
  // settles, and say in the axis's own note that the disclosure split is not part of the
  // measurement). This is the FIRST MEASURED SUBJECT AXIS: kind "measured-subject", with a
  // frozen sha-pinned method and bank and n_valid >= 30, so it counts towards measured_axes.
  // It measures CLAIMED SUBJECTS, not models: no fleet, so it joins no mean, no lid leader
  // and no separation tally — exactly as a declared slot does not.
  //
  // Every number below is read off the wave's bytes, never typed here:
  //   n 174          <- wave .thresholds.n_valid        (182 captured - 8 unreachable)
  //   bank_sha256    <- sha256 of public/interop/claim-maintenance-wave-2026-10-28.json
  //   method_sha     <- sha256 of the spec's reference manifest, v0.2
  //   per_outcome    <- wave .counts
  {
    axis: "claim-maintenance", family: "subject", kind: "measured-subject",
    applies_to: "claimed-subjects",
    bench: "claim-maintenance v0.2 re-read wave",
    task: "at each scheduled re-read, is a captured public claim still served unchanged, changed, withdrawn or unreachable; says nothing about whether the claim is true",
    n: 174, status: "MEASURED", method_status: "meets-rule",
    method: "claim-maintenance v0.2",
    method_sha: "32470d102112154b14a4d5530d71d7a30ecc2acdc5cd8c906c21f672b1deeef7",
    bank: "public/interop/claim-maintenance-wave-2026-10-28.json",
    bank_sha256: "a62b017a9081b817613c03887c3c6690597a2016ea175f9d95c211d593db0877",
    // The producer's own as_of, copied from the wave's observed_at field. A test reads both
    // back out of the wave's bytes and fails if they ever drift.
    facts_as_of: "2026-10-28T06:05:00Z",
    evidence_url: "/interop/claim-maintenance-wave-2026-10-28.json",
    per_outcome: { UNCHANGED: 12, CHANGED: 110, WITHDRAWN: 52, UNREACHABLE: 8 },
    colour: "hsl(290 10% 55%)", hue: 290,
    n_note: "Reported DISCOVERED-style as counts per subject class, never a ranking.",
    note: "n_valid 174 of 182 captured claims, re-read 2026-10-28 with the spec's own visible-text extractor. Counts per outcome, never a ranking, and never a statement that a claim is true. The disclosure split ('changed with disclosure' vs 'changed silently') is NOT part of this measurement: the published spec defines disclosure at the artefact level and not for a source's own edit, so those claims are recorded as CHANGED_DISCLOSURE_NOT_DECIDABLE.",
  },
  {
    axis: "serving-fidelity", family: "subject", kind: "measured-subject", applies_to: "inference-endpoints-and-routers",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does an inference runtime document sampling control, quantisation, KV/attention strategy, latency metrics and parallelism",
    n: 38, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/subject-axis-live-run.mjs", method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    rate: 0.7895, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    
    bank: "interop/axis-banks/serving-fidelity-20261102.json", bank_sha256: "68826b5e1c0b4539130aaef2113a3901147eec7bb908e263dc02361f589d2c3e",
    frame_sha256: "6264257697d4732e92ba1a90bdeb0f558f89adbdbbee4f7465ceca0b5748bfc6",
    facts_as_of: "2026-10-28T04:25:30.845Z", evidence_url: "/interop/axis-banks/serving-fidelity-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(300 62% 52%)", hue: 300,
    note: "38 subjects from a frozen frame of 38 (0 refusals recorded, never converted to failures). rate 0.7895 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.3421, 5-of-5 0.1053). Class census: logprobs 4, low 38, kv 13, latency 38, multi 30. 38/38 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
// ── slot 34, ruled in 2026-10-30 ───────────────────────────────────────────
  // THE PUBLIC WATCHDOG LAYER, ingested daily.
  //
  // WHY THIS SLOT EXISTS (the gap this names): before 2026-10-30 the estate's contact
  // with public watchdogs and incident databases was ONE-SHOT PRESENCE PROBES —
  // public/.well-known/layer-o-presence.json carried ns_incidentdatabase_ai as
  // QUALIFIED / presence UNMEASURED, as_of 2026-09-29 — which is a record that a URL
  // answered ONCE, on a day, forever. NVD, CVE, OSV and GHSA had NO entries at all.
  // So the honest answer to "are we measuring the public watchdogs and incident
  // databases?" was NO: nothing was measured, one thing was probed, once.
  //
  // This slot makes that gap VISIBLE and names what would close it. It is a DECLARED
  // SLOT, not a score: the intake harness (scripts/watchdog_intake.py) runs daily and
  // publishes a real artifact, but a daily run of 18 sources is a probe of the public
  // layer, not a frozen n>=30 bank, so the axis stays UNMEASURED until the method is
  // frozen and pinned. n 0 is the literal truth, never a score.
  {
    axis: "watchdog-ingest", family: "subject", kind: "measured-subject", applies_to: "public-watchdog-and-incident-sources",
    bench: "frozen presence bank (5 classes, 3-of-5 bar)",
    task: "does the subject offer a third party a documented route to report a problem, with a response commitment and a machine-readable path",
    n: 106, status: "MEASURED", method_status: "meets-rule",
    method: "scripts/subject-axis/build_missing_axes.mjs", method_sha: "eeabfeb8a0515d719840d33c2a9320bd8279b7da7db17fc537acd23632509b5b",
    rate: 0.1981, rate_scale: "fraction", rate_rule: "presence of at least 3 of 5 declared classes",
    public_pages: "HIDDEN_PENDING_OWNER_GO",
    bank: "interop/axis-banks/watchdog-ingest-20261102.json", bank_sha256: "8c5a3438294a8dc56baf9fb879b6a336b90bccd5a5a45e3944016b834dff2e88",
    frame_sha256: "0a4876147edfbf18848bbfe17f32a7e4a92a710e68c76ff4481998b9bbbe5d2a",
    facts_as_of: "2026-11-02T04:17:24.499Z", evidence_url: "/interop/axis-banks/watchdog-ingest-20261102.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    n_unit: "subjects in the frozen frame",
    colour: "hsl(310 62% 52%)", hue: 310,
    note: "106 subjects from a frozen frame of 123 (17 refusals recorded, never converted to failures). rate 0.1981 = share meeting at least 3 of 5 declared presence classes (4-of-5 0.0472, 5-of-5 0.0094). Class census: security 15, reporting 67, whistleblow 14, machine 26, response 40. 106/106 must-fail negative controls caught. Presence of a string in public bytes at a stated time is not evidence of quality, truth or compliance.",
  },
];
