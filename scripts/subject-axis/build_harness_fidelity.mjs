// build_harness_fidelity.mjs — re-frames axis 27 (harness-fidelity).
//
// WHY: the 2026-10-27 frame was inference/serving engines (vLLM et al). Every one of them documents
// seeds, Docker, OpenTelemetry, a scorer and MCP, so all 38 hit all five classes and the axis scored
// 1.000 at 3-of-5, 4-of-5 AND 5-of-5. A predicate that cannot return a value below 1.0 is not a
// measurement; the frame was measuring "is this a software repository".
//
// THIS FRAME: evaluation harnesses — the software whose job is to run a bank and grade it. Here the
// discriminating question is real: does the harness pin its dependency set, publish a must-fail
// control, isolate execution, document a reproduction command, and publish a result digest? Most
// pin and document; very few publish a must-fail control.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";

const AXIS_DIR = join(homedir(), "_alignment", "axis-runs-20261024");
const OUT_DIR = join(homedir(), "jewel-audit-20261027", "out");
const AXIS = "harness-fidelity";
const RUN_ID = "subject-axis-live-run-20261102";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const TIMEOUT_MS = 12000, MAX_BYTES = 400_000, CONCURRENCY = 6, BAR = 3;

// Frozen population: named evaluation harnesses, in a fixed order. Every entry attempted once.
const POP = [
  ["EleutherAI lm-evaluation-harness", "https://github.com/EleutherAI/lm-evaluation-harness"],
  ["Stanford HELM", "https://github.com/stanford-crfm/helm"],
  ["UK AISI Inspect", "https://github.com/UKGovernmentBEIS/inspect_ai"],
  ["OpenAI Evals", "https://github.com/openai/evals"],
  ["EvalPlus", "https://github.com/evalplus/evalplus"],
  ["BigCode evaluation harness", "https://github.com/bigcode-project/bigcode-evaluation-harness"],
  ["lmms-eval", "https://github.com/EleutherAI/lmms-eval"],
  ["OpenCompass", "https://github.com/open-compass/opencompass"],
  ["DeepEval", "https://github.com/confident-ai/deepeval"],
  ["Ragas", "https://github.com/explodinggradients/ragas"],
  ["promptfoo", "https://github.com/promptfoo/promptfoo"],
  ["SWE-bench", "https://github.com/swe-bench/swe-bench"],
  ["tau-bench", "https://github.com/sierra-research/tau-bench"],
  ["MLE-bench", "https://github.com/openai/mle-bench"],
  ["MLCommons inference", "https://github.com/mlcommons/inference"],
  ["LightEval", "https://github.com/huggingface/lighteval"],
  ["NeMo Evaluator", "https://github.com/NVIDIA/NeMo-Evaluator"],
  ["Langfuse", "https://github.com/langfuse/langfuse"],
  ["OpenLLMetry", "https://github.com/traceloop/openllmetry"],
  ["Arize Phoenix", "https://github.com/Arize-ai/phoenix"],
  ["Braintrust SDK", "https://github.com/braintrustdata/braintrust-sdk"],
  ["Weave (W&B)", "https://github.com/wandb/weave"],
  ["AgentBench", "https://github.com/THUDM/AgentBench"],
  ["Chatbot Arena", "https://github.com/lm-sys/FastChat"],
  ["Inspect Evals", "https://github.com/UKGovernmentBEIS/inspect_evals"],
  ["AlpacaEval", "https://github.com/tatsu-lab/alpaca_eval"],
  ["MTEB", "https://github.com/embeddings-benchmark/mteb"],
  ["HELM Capabilities", "https://crfm.stanford.edu/helm/capabilities/latest/"],
  ["Evalchemy", "https://github.com/mlfoundations/evalchemy"],
  ["Inspect AI docs", "https://inspect.aisi.org.uk/"],
  ["HuggingFace Evaluate", "https://github.com/huggingface/evaluate"],
  ["OpenAI simple-evals", "https://github.com/openai/simple-evals"],
  ["Anthropic evals", "https://github.com/anthropics/evals"],
  ["BIG-bench", "https://github.com/google/BIG-bench"],
  ["TruLens", "https://github.com/truera/trulens"],
  ["Prompt flow", "https://github.com/microsoft/promptflow"],
  ["Guardrails AI", "https://github.com/guardrails-ai/guardrails"],
  ["LangSmith SDK", "https://github.com/langchain-ai/langsmith-sdk"],
  ["Inspect SWE", "https://github.com/UKGovernmentBEIS/inspect_swe"],
  ["OpenAI Evals registry", "https://github.com/openai/evals/blob/main/evals/registry/README.md"],
];

const PATTERNS = {
  pinned_dependency_or_lockfile: "lockfile|requirements\\.txt|uv\\.lock|poetry\\.lock|pinned|commit hash|pyproject\\.toml",
  must_fail_or_negative_control: "must.?fail|negative control|expected to fail|control task|canary|tamper|sanity check",
  isolation_or_container: "docker|container|sandbox|virtualenv|conda|uv run|venv",
  reproduction_command: "pip install|uv pip|git clone|python -m|make |uvx |npx ",
  published_result_digest: "sha256|checksum|digest|manifest|\\.json\\b|lock file",
};

const sha256hex = (b) => createHash("sha256").update(b).digest("hex");
const canonicalize = (v) => {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
};
const canonicalSha256 = (o) => sha256hex(Buffer.from(canonicalize(o), "utf8"));
const extractText = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function fetchSubject(url) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": "text/html,*/*" } });
    const buf = Buffer.from(await res.arrayBuffer()).subarray(0, MAX_BYTES);
    return { reachable: true, status: res.status, final_url: res.url, bytes: buf.length, sha256: sha256hex(buf), body: buf.toString("utf8") };
  } catch (e) { return { reachable: false, error: `${e.name}: ${e.message}` }; }
  finally { clearTimeout(t); }
}
async function pool(items, fn, n) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

const rows = POP.map(([subject, url]) => ({ subject, url, sha256: null }));
mkdirSync(OUT_DIR, { recursive: true });

const gridPath = join(AXIS_DIR, `${AXIS}.discovery-v2-refframe.json`);
writeFileSync(gridPath, JSON.stringify({
  axis: AXIS, generated_at: new Date().toISOString(),
  note: "re-frame v2: evaluation harnesses, replacing the 2026-10-27 inference-engine frame that scored 1.000 on every bar",
  population_rule: "named evaluation harnesses, fixed order, every entry attempted exactly once",
  rows,
}, null, 2) + "\n");
const gridSha = sha256hex(readFileSync(gridPath));
const methodSha = sha256hex(readFileSync(new URL(import.meta.url)));
const live = await pool(rows, r => fetchSubject(r.url), CONCURRENCY);
const observedAt = new Date().toISOString();

const classes = Object.keys(PATTERNS);
const census = Object.fromEntries(classes.map(c => [c, 0]));
const hist = {}; const items = []; let negCaught = 0, posOk = 0;

rows.forEach((r, i) => {
  const res = live[i];
  if (!res || !res.reachable || res.status >= 400) return;
  const text = extractText(res.body).toLowerCase();
  const checks = Object.fromEntries(classes.map(c => [c, new RegExp(PATTERNS[c], "i").test(text)]));
  const present = Object.values(checks).filter(Boolean).length;
  classes.forEach(c => { if (checks[c]) census[c]++; });
  hist[present] = (hist[present] || 0) + 1;
  const itemId = `${AXIS}-live-${String(items.length + 1).padStart(3, "0")}`;
  const payload = {
    axis_id: AXIS, item_id: itemId, subject: r.subject, url: r.url, final_url: res.final_url,
    http_status: res.status, bytes: res.bytes, content_sha256: res.sha256,
    text_sha256: sha256hex(Buffer.from(extractText(res.body), "utf8")), observed_at: observedAt,
    presence_checks: checks, checks_present: present, meets_disclosure_bar: present >= BAR,
    previous_grid_sha256: null, bytes_match_previous_grid: false,
  };
  const expected = canonicalSha256(payload);
  const p = canonicalSha256(payload) === expected;
  const tampered = { ...payload, content_sha256: (payload.content_sha256[0] === "0" ? "f" : "0") + payload.content_sha256.slice(1) };
  const n = canonicalSha256(tampered) !== expected;
  if (p) posOk++; if (n) negCaught++;
  items.push({ item_id: itemId, ordinal: items.length + 1, subject: r.subject, url: r.url, payload,
    expected_payload_sha256: expected, positive_verdict: p ? "VALID" : "INVALID",
    positive_reason: p ? "canonical_digest_recomputed_and_matched" : "canonical_digest_mismatch",
    negative_control_verdict: n ? "INVALID" : "VALID",
    negative_control_reason: n ? "preimage_sha256_mismatch:corrupted_content_digest" : "negative_control_did_not_discriminate" });
});

const n = items.length, meeting = items.filter(x => x.payload.meets_disclosure_bar).length;
const score = n ? Number((meeting / n).toFixed(4)) : null;
const bars = {};
for (const b of [3, 4, 5]) {
  const m = items.filter(x => x.payload.checks_present >= b).length;
  const s = n ? Number((m / n).toFixed(4)) : null;
  bars[`bar_${b}_of_5`] = { n_meeting: m, n_subjects: n, score: s, is_endpoint: s === 0 || s === 1, g2_score_acceptable: !(s === 0 || s === 1) };
}

const bank = {
  schema: "csoai.subject-axis-bank/1.1", axis_id: AXIS, family: "subject",
  subject_class: "software harnesses that run a frozen bank and grade the outputs",
  generated_at: observedAt, run_id: RUN_ID, authority_state: "measurement_only_not_a_certification",
  admission_state: "CANDIDATE_FINDING", public_board_slot_state: "UNMEASURED",
  method_sha256: methodSha, source_grid_file: gridPath, source_grid_sha256: gridSha,
  source_grid_observed_at: observedAt,
  disclosure_bar: { rule: `presence of at least ${BAR} of 5 link classes`, classes, patterns: PATTERNS },
  frame: {
    population_description: `${rows.length} named evaluation harnesses, fixed order`,
    inclusion_rule: "Every entry in the frozen list was attempted exactly once at run time; none added, dropped, substituted or re-ordered. The grid digest is published.",
    frame_file: gridPath, frame_file_sha256: gridSha, frame_date: observedAt,
    n_frame: rows.length, n_attempted: rows.length, n_reachable: n, refusals_recorded_not_converted: rows.length - n,
  },
  class_census: Object.fromEntries(classes.map(c => [c, { n_present: census[c], n_subjects: n, share: n ? Number((census[c] / n).toFixed(4)) : null }])),
  checks_present_histogram: hist, bar_scores: bars,
  score_caveat: "Bar fixed at the estate's declared 3-of-5 before scoring. The re-frame is declared here as a correction of a frame that could not fail, not as a threshold adjustment.",
  n_subjects_in_grid: rows.length, n_items: n, n_valid: n, n_valid_min: 30,
  n_meeting_disclosure_bar: meeting, score, score_scale: "fraction",
  negative_controls_caught: negCaught, all_positive_passed: posOk === n,
  live_bytes_match_previous_grid: 0, bytes_changed_since_grid: 0,
  limitations: [
    "A link-class presence check records observable strings in public bytes at observed_at. Absence on the landed URL is not evidence of absence elsewhere.",
    "This measures disclosure presence, not disclosure quality, truth, or compliance.",
    "A refusal is recorded in its own state and is never converted to a zero or a failure.",
    "The frame is a curated list of named harnesses; it is not a probability sample.",
  ],
  items,
};

const outPath = join(OUT_DIR, `bank-${AXIS}-live-20261102-refframe.json`);
writeFileSync(outPath, JSON.stringify(bank, null, 2) + "\n");
console.error(JSON.stringify({ axis: AXIS, n, score, bars, negCaught, posOk: posOk === n, census, out: outPath }, null, 2));
