#!/usr/bin/env node
/** Generate the portable lm-eval pack and Auto-Measure's frozen inputs from the one grader.
 * First generation resolves each public bank to a Hub commit, then verifies axes.json's hash.
 * Subsequent builds use the checked-in bytes; --check is offline. --refresh re-resolves the Hub.
 * No model is called. Public task scores are measurements, never certification or admission.
 */
import { fetchText } from "./hub-fetch.mjs";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PACK = "public/bench/lm-eval";
const SPACE = "spaces/gspc-auto-measure";
const CHECK = process.argv.includes("--check");
const REFRESH = process.argv.includes("--refresh");
if (CHECK && REFRESH) throw new Error("--check and --refresh are mutually exclusive");
const PROMPT_KEYS = ["item", "scenario", "request", "text", "tool", "operation", "case", "prompt", "question"];
const SPACE_BANKS = new Set(["gspc-mcp", "gspc-oss", "gspc-prv", "gspc-det", "gspc-art5"]);
const j = value => JSON.stringify(value, null, 2) + "\n";
const sha256 = text => createHash("sha256").update(text).digest("hex");
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const millPath = "harness/gspc-top100/mill_hub_queue.py";
const mill = read(millPath);
// Copy the actual constants and function, including its explanation, verbatim. No second grader.
const graderStart = mill.indexOf("_ANSWER_PREFIX = re.compile(");
const graderEnd = mill.indexOf("\ndef js_safe_number(", graderStart);
if (graderStart < 0 || graderEnd < graderStart) throw new Error("canonical grader extraction boundary changed");
const grader = mill.slice(graderStart, graderEnd).trimEnd() + "\n";
const graderHash = sha256(grader);
const graderHeader = `"""Generated from ${millPath}; do not edit.\nread_label source SHA256: ${graderHash}\n"""\nimport re\n\n`;
const previous = existsSync(join(ROOT, PACK, "manifest.json")) ? JSON.parse(read(`${PACK}/manifest.json`)) : {};

function gradeable(row) {
  const keys = Object.keys(row);
  if (keys.every(k => ["_canary", "_note"].includes(k))) return false;
  return PROMPT_KEYS.some(k => row[k]) && row.expected !== null && row.expected !== undefined && row.expected !== "";
}

function utilsPy(axis) {
  return graderHeader + grader + `
import hashlib
import json
from pathlib import Path

LABELS = ${JSON.stringify(axis.label_menu)}
PROMPT_KEYS = ${JSON.stringify(PROMPT_KEYS)}
BANK_SHA256 = ${JSON.stringify(axis.bank_sha256)}
PROMPT_TEMPLATE = ${JSON.stringify(axis.prompt_template)}


def gradeable(doc):
    """The mill's load_bank selection, including numeric zero expected values."""
    if set(doc) <= {"_canary", "_note"}:
        return False
    return any(doc.get(key) for key in PROMPT_KEYS) and doc.get("expected") not in (None, "")


def load_bank(**kwargs):
    """Verify the distributed bytes before Arrow construction; never follow mutable main."""
    from datasets import Dataset
    raw = Path(__file__).with_name("bank.jsonl").read_bytes()
    if hashlib.sha256(raw).hexdigest() != BANK_SHA256:
        raise ValueError("GSPC bank SHA256 mismatch; refusing to evaluate")
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
    # from_list otherwise uses only the first row's keys (which may be a canary-only row).
    keys = sorted({key for row in rows for key in row})
    return {"train": Dataset.from_list([{key: row.get(key) for key in keys} for row in rows])}


def process_docs(documents):
    """lm-eval requires a Dataset back, including its features and select methods."""
    return documents.filter(gradeable)


def doc_to_text(doc):
    prompt = next(str(doc[key]) for key in PROMPT_KEYS if doc.get(key))
    return PROMPT_TEMPLATE.replace("{item}", prompt)


def sum_counts(values):
    return sum(values)


def process_results(doc, results):
    """Conditional accuracy plus explicit coverage; unparsed does not mean incorrect."""
    answer = read_label(results[0], LABELS)
    out = {"parse_rate": float(answer is not None), "n_graded": int(answer is not None), "n_attempted": 1}
    if answer is not None:
        out["exact_match"] = float(answer == str(doc["expected"]).strip().upper())
    return out
`;
}

async function main() {
  const axesDoc = JSON.parse(read("public/bench/axes.json"));
  const runnable = axesDoc.axes.filter(a => a.runnable && !a.refusal_reason);
  const refused = axesDoc.axes.filter(a => a.refusal_reason);
  const outputs = new Map();
  const taskRows = [];
  const spaceBanks = {};
  for (const axis of runnable) {
    const bankPath = `${PACK}/${axis.axis}/bank.jsonl`;
    const prior = previous.axes?.find(a => a.axis === axis.axis);
    let text, revision;
    if (!REFRESH && prior?.bank_revision && existsSync(join(ROOT, bankPath))) {
      text = read(bankPath);
      revision = prior.bank_revision;
    } else {
      if (CHECK) throw new Error(`${axis.axis}: missing frozen bytes/revision; generate once before --check`);
      const repoInfo = JSON.parse(await fetchText(`https://huggingface.co/api/datasets/csoai/${axis.bank_repo}`));
      revision = repoInfo.sha;
      if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`${axis.axis}: invalid Hub revision`);
      text = await fetchText(axis.bank_url.replace(/\/resolve\/[^/]+\//, `/resolve/${revision}/`));
    }
    if (sha256(text) !== axis.bank_sha256) throw new Error(`${axis.axis}: bank differs from axes.json hash; update the canonical bank inventory explicitly`);
    const rows = text.split("\n").filter(line => line.trim()).map(line => JSON.parse(line));
    const kept = rows.filter(gradeable);
    if (!kept.length || axis.label_menu.length < 2) throw new Error(`${axis.axis}: no measurable label task`);
    const allowed = new Set(axis.label_menu.map(v => String(v).trim().toUpperCase()));
    if (kept.some(row => !allowed.has(String(row.expected).trim().toUpperCase()))) throw new Error(`${axis.axis}: expected value outside declared label menu`);
    const task = `gspc_${axis.axis.replace(/-/g, "_")}`;
    const pinnedUrl = axis.bank_url.replace(/\/resolve\/[^/]+\//, `/resolve/${revision}/`);
    const yaml = [
      `# Generated by scripts/surface/build-lm-eval-tasks.mjs; do not hand-edit.`,
      `# Frozen source: ${pinnedUrl}`, `task: ${task}`, `dataset_path: json`,
      `custom_dataset: !function utils.load_bank`, `test_split: train`, `output_type: generate_until`,
      `doc_to_text: !function utils.doc_to_text`, `doc_to_target: "{{ expected }}"`,
      `num_fewshot: 0`, `generation_kwargs:`, `  until: ["\\n\\n"]`, `  do_sample: false`, `  temperature: 0.0`,
      `process_docs: !function utils.process_docs`, `process_results: !function utils.process_results`,
      `metric_list:`, `  - metric: exact_match`, `    aggregation: mean`, `    higher_is_better: true`,
      `  - metric: parse_rate`, `    aggregation: mean`, `    higher_is_better: true`,
      `  - metric: n_graded`, `    aggregation: !function utils.sum_counts`, `    higher_is_better: true`,
      `  - metric: n_attempted`, `    aggregation: !function utils.sum_counts`, `    higher_is_better: true`,
      `metadata:`, `  version: 2.0`, `  gspc_axis: ${axis.axis}`, `  gspc_labels: ${JSON.stringify(axis.label_menu)}`,
      `  gspc_bank_sha256: ${axis.bank_sha256}`, `  gspc_bank_revision: ${revision}`, `  gspc_items: ${kept.length}`,
      `  gspc_grader_sha256: ${graderHash}`, `  gspc_caveat: "measurement, never certification; no board admission"`, ""
    ].join("\n");
    outputs.set(`${PACK}/${axis.axis}/${axis.axis}.yaml`, yaml);
    outputs.set(`${PACK}/${axis.axis}/utils.py`, utilsPy(axis));
    outputs.set(bankPath, text);
    taskRows.push({axis: axis.axis, task, items: kept.length, labels: axis.label_menu,
      prompt_key: PROMPT_KEYS.find(k => kept[0][k]), bank_repo: axis.bank_repo,
      bank_sha256: axis.bank_sha256, bank_revision: revision, bank_url: pinnedUrl,
      bank_rows_raw: rows.length, canary_rows_dropped: rows.length - kept.length});
    if (SPACE_BANKS.has(axis.bank_repo)) {
      outputs.set(`${SPACE}/banks/${axis.bank_repo}.jsonl`, text);
      spaceBanks[`csoai/${axis.bank_repo}`] = {axis: axis.axis, labels: axis.label_menu,
        prompt_template: axis.prompt_template, file: `banks/${axis.bank_repo}.jsonl`,
        sha256: axis.bank_sha256, revision, url: pinnedUrl};
    }
  }
  const readme = `---
pretty_name: GSPC lm-eval task pack
tags:
  - evaluation
  - lm-eval
---

# Run a GSPC axis with lm-eval

The canonical ${taskRows.length}-axis pack replaces the earlier six-task Hub bridge. Each task carries the
published bank bytes, checks their SHA256 before loading, and records the exact Hub revision.
No account or network is required to load the bank. Model access depends on your chosen backend.

\`\`\`bash
pip install 'lm_eval[hf]==0.4.13'
git clone https://huggingface.co/datasets/csoai/gspc-lm-eval-tasks
cd gspc-lm-eval-tasks
lm_eval --model hf \\
  --model_args pretrained=YOUR_MODEL \\
  --tasks gspc_provenance --include_path ./lm-eval --log_samples --output_path ./results
\`\`\`

## Task and grader contract

${taskRows.map(t => `- \`${t.task}\`: ${t.items} eligible items`).join("\n")}

The grader is copied verbatim from \`harness/gspc-top100/mill_hub_queue.py::read_label\`.
\`scripts/surface/test_lm_eval_parity.py\` checks canonical label and row-selection parity.
\`scripts/surface/test_lm_eval_framework.py\` verifies bank integrity and the actual Dataset contract, loads all tasks through
lm-eval and exercises its evaluator with fixed fake responses, without a model call.

\`exact_match\` is accuracy **conditional on a parseable label**. \`parse_rate\`, \`n_graded\` and
\`n_attempted\` expose the denominator. An unparsed response leaves the accuracy denominator.
If every response is unparsed, accuracy is unavailable, not zero. Read coverage alongside accuracy.
The last-line/punctuation rules are exactly the canonical grader's; arbitrary label substrings do
not count. The task prompt matches the canonical axis template and does not include the gold answer.

## Migration from the six-task bridge

Use \`--include_path ./lm-eval\` and the canonical names. The Hub's old \`tasks/\` entry points remain
aliases for compatibility: \`gspc_mcp\` → \`gspc_conformance\`, \`gspc_oss\` → \`gspc_openness\`,
\`gspc_prv\` → \`gspc_provenance\`, \`gspc_asi\` → \`gspc_continuity\`,
\`gspc_det\` → \`gspc_detector_interop\`, \`gspc_art5\` → \`gspc_art5_safeguard\`.
Historical six-task results are not upgraded or admitted by replacing the task files.
The separate legacy garak probe is unchanged and is not covered by this qualification.

## Rebuild and verify

From the Council of AI monorepo, run \`node scripts/surface/build-lm-eval-tasks.mjs --check\`
and the two Python tests above. \`--check\` is offline. \`--refresh\` resolves current Hub revisions
but refuses any bank whose bytes differ from the declared hash in \`public/bench/axes.json\`.
The same producer freezes the five existing Auto-Measure banks and copies the canonical grader.

## Limits

This pack measures a run with a particular prompt, bank and grader. It does not establish a rank,
certification, safety, or independent GSPC admission. Fewer than 30 graded items remain unquotable
under the existing policy. No model measurements were made by the framework smoke test.

Excluded axes: ${refused.map(a => `\`${a.axis}\` (${a.refusal_reason})`).join("; ")}.
`;
  outputs.set(`${PACK}/README.md`, readme);
  outputs.set(`${SPACE}/grader.py`, graderHeader + grader + `\nGRADER_SHA256 = ${JSON.stringify(graderHash)}\n`);
  outputs.set(`${SPACE}/banks.json`, j(spaceBanks));
  const manifest = {schema: "csoai.gspc-lm-eval-tasks/2", generated_by: "scripts/surface/build-lm-eval-tasks.mjs",
    grader: `${millPath}::read_label`, grader_sha256: graderHash, lm_eval_tested_version: "0.4.13",
    unparsed_rule: "excluded from accuracy; reported in parse_rate and n_attempted", axes: taskRows,
    files: [...outputs.keys()].sort().map(path => ({path, sha256: sha256(outputs.get(path))}))};
  outputs.set(`${PACK}/manifest.json`, j(manifest));
  let bad = 0;
  for (const [rel, text] of outputs) {
    const abs = join(ROOT, rel);
    if (CHECK) { if (!existsSync(abs) || readFileSync(abs, "utf8") !== text) { console.error(`stale: ${rel}`); bad++; } }
    else { mkdirSync(dirname(abs), {recursive: true}); writeFileSync(abs, text); }
  }
  if (bad) process.exitCode = 3;
  console.log(`build-lm-eval-tasks: ${outputs.size} files ${CHECK ? "checked" : "written"}; ${taskRows.length} tasks; ${taskRows.reduce((n, t) => n + t.items, 0)} eligible items; ${refused.length} refused axes`);
}
await main();
