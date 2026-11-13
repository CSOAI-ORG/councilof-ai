# Submit a GSPC run

Prepare a reproducible receipt for review. Running the harness does not submit a result, admit it to the board or establish a ranking.

## 1. Retain the instrument and declare the conditions

Keep the source checkout revision, original bank JSONL and its expected SHA-256. Prefer a fixed dataset commit; a download from a moving URL must still match the digest you intended. The example below uses `affect` and the bank hash recorded when this guide was built.

Create `context.json` from the [execution-context template](https://github.com/CSOAI-ORG/councilof-ai/blob/master/harness/bench/README.md) using facts you can support: provider/model/route, cyber programme and tier, non-treatment application policy, generation limits and provenance. Keep credentials and private account/workspace identifiers out of it. Missing or unknown conditions remain readable but cannot qualify a paired comparison; a declaration is not provider approval.

```bash
git clone https://github.com/CSOAI-ORG/councilof-ai
cd councilof-ai
git rev-parse HEAD
curl --fail --location --output bank-items.jsonl https://huggingface.co/datasets/csoai/gspc-affect/resolve/main/items.jsonl
```

The public bank and source are available without our permission. Your chosen model service may require its own account, credentials and paid usage.

## 2. Run the model or replay retained replies

For live calls, choose an OpenAI-compatible base URL accepting `/chat/completions`, your model, `temperature` and `max_tokens`, and returning `choices[0].message.content`; confirm your budget. If authentication is required, set `GSPC_RUN_BENCH_API_KEY` or the fallback `OPENAI_API_KEY` in your environment. Scripts reading Council Pages endpoints should send a descriptive application `User-Agent` as [Cloudflare recommends](https://developers.cloudflare.com/pages/platform/known-issues/#browser-integrity-check-on-pages); the runner and comparator already do this, but arbitrary library defaults are not guaranteed to work.

```bash
python3 harness/bench/run_bench.py --axis affect --model YOUR_MODEL \
  --bank-path bank-items.jsonl --bank-sha256 5ce11c084a6e968cc49314cfec2898725fb7b01513dc117f869be17b4a263bc7 \
  --base-url YOUR_ENDPOINT --execution-context context.json \
  --temperature 0 --max-tokens 1024 --out result.json
```

Match `YOUR_MODEL` and generation limits to your context. A bank-hash mismatch or inconsistent live context stops before model calls. Do not use `--limit` for a complete-bank submission.

To score retained replies without network or model calls, replace `--base-url YOUR_ENDPOINT` with `--answers answers.jsonl`. Each JSONL row must contain a unique zero-based `index` and the exact original string `answer`. Preserve malformed replies and evidence of the original conditions; do not reconstruct missing history. Local replay records `bank_source: local_file`, a null bank URL and `generation_parameters_source: supplied_context`; the digest binds bytes, not their origin.

## 3. Inspect the complete receipt

The runner writes `result.json`. Exit 0 means all replies parsed; exit 3 still writes the ledger with unparsed replies; exit 2 refuses the run and must not be treated as a zero score.

| Field | What it records |
|---|---|
| `bank_sha256` | Digest of the exact loaded bank bytes; retain their fixed dataset reference separately. |
| `bank_repo, bank_source, bank_url` | Declared bank mapping and source type; local paths are never published. |
| `grader, grader_source_sha256` | Canonical mill rule and digest of the grader source used. |
| `bank_items_total, items_total, evaluation_scope` | Full bank size, evaluated size and full/partial scope. |
| `items_graded, items_unparsed, hits` | Parsed coverage, unparsed replies and correct replies. |
| `accuracy, wilson95, accuracy_over_all_items, wilson95_over_all_items` | Both parsed-only and all-item denominators and intervals. |
| `rows[].answer, rows[].answer_sha256, rows[].prompt_sha256` | Original reply, reply digest and exact prompt digest for every item. |
| `execution_context, execution_context_sha256` | Declared conditions and integrity digest; neither authenticates provider approval. |
| `generation_parameters_source` | Live requested parameters versus supplied original-run metadata. |

## 4. Review comparability and submission evidence

1. Verify the receipt's `bank_sha256` against its retained original bytes, even if the current Hub bank has changed. Review the fixed dataset/source references; a digest alone does not authenticate provenance or qualify a historical bank for the current board.
2. Re-run the original replies through the declared grader and bank, reproducing prompt hashes, per-item grades, counts and intervals. Do not replace raw replies with expected labels.
3. Require complete-bank coverage and inspect unparsed replies. `items_graded < 30` remains below the board's quotation threshold; a small or incomplete receipt is not made quotable by the comparison tool.
4. Retain the resolvable model identity and pinned revision where available. Reused provider aliases do not prove unchanged weights; record that limitation.
5. Exclude the bank's canary row; it is a contamination tripwire, never a task.
6. Before paired inference, require complete, compatible execution context and matching bank, grader, prompt hashes and item coverage. Historical missing conditions must not be filled by guessing.

```bash
python3 harness/bench/paired_comparison.py \
  --frontier baseline.json --meok candidate.json --out comparison.json
```

The legacy `--meok` flag names the second arm; it does not assert a product identity. Default mode compares deployments with matched access and recorded generation conditions. Use `--comparison-mode access-treatment` only for an intentional same-declared-model/route cyber-access experiment; it reports a configuration difference, not model superiority. See the [full comparison and retained-answer guide](https://github.com/CSOAI-ORG/councilof-ai/blob/master/harness/bench/README.md).

## 5. Submit for review

[Open a pull request](https://github.com/CSOAI-ORG/councilof-ai/compare) using your GitHub account, adding your receipt under `submissions/` with fixed bank/source references, derivation notes and any paired report. Retain the original answers and evidence behind public context labels. Review the contents for sensitive data before publication. Do not edit generated board files by hand.

Submission is a request for review, not automatic publication or board admission. A receipt remains a measurement, not certification or a rank. The board's fixed test determines separation; TIE does not establish a winning model.

[Current board](https://councilof.ai/api/gspc) · [Methodology](https://councilof.ai/methodology/)

## Banks available to run

- `affect` — `gspc-affect`, 42 items — DISCLOSE | NULL | PERMITTED | PROHIBITED
- `art5-safeguard` — `gspc-art5`, 36 items — PERMITTED | PROHIBITED
- `care` — `gspc-care`, 200 items — 0 | 1
- `conformance` — `gspc-mcp`, 35 items — CONFORMS | VIOLATES
- `continuity` — `gspc-asi`, 33 items — NOT_APPLICABLE | QUANTUM_SAFE | QUANTUM_VULNERABLE
- `cross-reality` — `gspc-xr`, 32 items — CONFIRM | PROCEED | REFUSE
- `detector-interop` — `gspc-det`, 33 items — DIVERGENT | INTEROPERABLE
- `governance` — `gspc-gov`, 237 items — HIGH_RISK | LIMITED_RISK | MINIMAL_RISK | PROHIBITED
- `machinery-conformity` — `gspc-mach`, 33 items — NOT_SAFETY_FUNCTION | OUT_OF_SCOPE | PART_A
- `openness` — `gspc-oss`, 32 items — PERMITTED | RESTRICTED
- `provenance` — `gspc-prv`, 32 items — DESTROYED | SURVIVES
- `safety` — `gspc-agi`, 36 items — COMPLY | REFUSE
