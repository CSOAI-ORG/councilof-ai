# Run and inspect a GSPC evaluation

This runner evaluates one model's replies against one published GSPC bank using the canonical mill grader and prompt builder. It writes a complete item ledger. It does not submit results, admit a model to the board or establish a ranking.

Python 3 and the repository checkout are sufficient for the runner. Run from the repository root. `--list` works offline; loading public banks requires network access. Scoring existing answers makes no model calls.

```bash
python3 harness/bench/run_bench.py --list
python3 harness/bench/run_bench.py --axis governance --model your-model \
  --answers answers.jsonl --out result.json
```

The answers file is JSONL: one object per reply, with a unique zero-based integer `index` and the exact reply in the string `answer`. Keep original model output, including explanations and malformed responses. Do not replace replies with the expected label. Missing items remain visible as unparsed rows. Duplicate, invalid or out-of-range indices are refused.

For a live evaluation, see `python3 harness/bench/run_bench.py --help`. Configure your own endpoint and budget before using it. `--limit` is a development smoke check, not a complete-bank comparison.

## Read the result

| Field | Meaning |
| --- | --- |
| `bank_sha256`, `grader_source_sha256` | Digests of the instrument bytes used. |
| `bank_items_total`, `items_total`, `evaluation_scope` | Full bank size, evaluated size and full/partial scope. |
| `accuracy`, `wilson95` | Accuracy and interval among parsed replies under the canonical rule. |
| `accuracy_over_all_items`, `wilson95_over_all_items` | Correct replies divided by every evaluated item, including unparsed replies. |
| `items_unparsed` | Missing or unparseable replies; inspect these alongside accuracy. |
| `rows` | Every item: original reply and digest, expected/observed label, correctness and prompt digest. |
| `execution_context`, `execution_context_sha256` | Declared access conditions, provider/model/route labels, generation limits and their digest. Missing knowledge is explicit. |
| `generation_parameters_source` | `runner_parameters` for a live runner's requested limits, `supplied_context` for retained-answer metadata, or `unknown`. Requested settings do not prove provider enforcement. |

Exit `0` means every reply was graded. Exit `3` means a result was written with some unparsed replies. Exit `2` means the run could not produce an honest graded result; inspect stderr and any output rather than treating it as a zero score.

## Compare complete runs

```bash
python3 harness/bench/paired_comparison.py \
  --frontier baseline.json --meok candidate.json --out comparison.json
```

The tool refuses different banks or graders, changed prompts or gold labels, duplicate indices and incomplete-bank coverage. It also refuses missing, unknown, inconsistent or changed execution metadata, unmatched generation limits and mixed cyber-access tiers. It reports both denominators and a paired test on items where both replies parsed. No parsed pairs produces `UNTESTED`.

The paired test alone does not validate equal compute budgets, uncontaminated test data, system identity, route independence or general superiority. Declare those conditions separately. Inspect differences in response coverage before interpreting a complete-case p-value. Account for multiple testing when selecting among many axes or candidates.

Older result files without grader hashes or full-bank coverage evidence remain historical records. Do not fill those fields by guessing. Re-evaluate retained original replies with the appropriate frozen source and bank, preserving the old artifact and documenting the derivation.

## Declare execution conditions

Normal single-model runs still work without additional configuration. They record unknown access conditions and remain readable; they cannot qualify a new paired comparison. Old receipts are preserved and are never silently treated as standard access. Re-score retained replies only when their original execution conditions are evidenced; a new declaration cannot recover unknown history.

For a known configuration, pass `--execution-context context.json`. This is measurement metadata, not a provider grant or a new authority/event store. The following is a **template**, not a statement about Council of AI's account or CVP status. Replace only facts you can support; keep unknowns explicit.

```json
{
  "version": 1,
  "provider": "example-provider",
  "model": "your-pinned-model-id",
  "route_id": "internal-evaluation-route",
  "access_channel": "direct_api",
  "access_program": "none",
  "cyber_tier": "standard",
  "safeguard_profile": "application-policy-v1",
  "generation": {"temperature": 0.0, "max_tokens": 1024},
  "provenance": {
    "source": "operator_declaration",
    "observed_at": "2026-11-10T00:00:00Z",
    "evidence_sha256": null
  }
}
```

```bash
python3 harness/bench/run_bench.py --axis governance --model your-pinned-model-id \
  --base-url YOUR_ENDPOINT --execution-context context.json \
  --temperature 0 --max-tokens 1024 --out result.json
```

The live runner rejects a declared model or generation limit that differs from its arguments, before any network request. For `--answers`, generation parameters describe the original run and are preserved as supplied evidence; today's CLI defaults do not overwrite them.

| Field | Contract |
| --- | --- |
| `provider`, `model` | Public provider and model identifiers. Use a pinned model revision where available and retain its evidence. A reused model alias does not prove unchanged weights. |
| `route_id` | A public pseudonym for the route. Keep its mapping to real organisations/workspaces private. |
| `access_channel` | `direct_api`, `third_party`, `self_hosted`, or `unknown`. |
| `access_program`, `cyber_tier` | `none` with `standard` or `not_applicable`; `anthropic_cvp` with `defense`, `red_team` or `specialized`; otherwise both `unknown`. `not_applicable` does not mean no other safeguards exist. |
| `safeguard_profile` | A versioned public label for the **non-treatment application/system/tool policy**, excluding the separately recorded cyber tier. Retain the underlying settings. |
| `generation` | Requested `temperature` and `max_tokens`, or null when unknown. Other provider defaults/settings still require separate review. |
| `provenance.source` | `operator_declaration`, `provider_record`, or `unknown`. A provider record requires a timestamp and SHA-256 of retained evidence; the harness does **not** authenticate the record or assert approval. |

The input accepts only documented fields. Label checks reduce accidental publication of common credential/account shapes; they are not complete secret detection. Review every label before publishing. Never include credentials, raw account/workspace IDs, private URLs, identity documents or verification screenshots. A digest detects changed metadata, not a false declaration or false evidence.

### Model comparisons and access-condition experiments

Default `--comparison-mode model` permits different declared models, providers and routes and lists those differences. It requires equal known cyber programme/tier, application policy profile and recorded generation limits. This compares declared deployments; it does not isolate underlying model weights or establish equal effective compute.

`none/standard` and `none/not_applicable` are distinct conditions and are refused as an ordinary matched comparison. Do not relabel a self-hosted, unknown or inapplicable condition merely to pass the check. Individual receipts remain available for descriptive review.

To study standard versus CVP access (or two CVP tiers) for the **same declared model identifier, provider and route**, use an explicit access-treatment experiment:

```bash
python3 harness/bench/paired_comparison.py --frontier standard.json \
  --meok defense.json --comparison-mode access-treatment --out access-comparison.json
```

The `--meok` argument is retained for CLI compatibility; in this mode it means access condition B, not a MEOK product. Both complete receipts must carry known, valid context and unchanged non-treatment conditions. The report binds both context digests and labels any paired result `CONFIGURATION_DIFFERENCE`, `NO_DETECTED_CONFIGURATION_DIFFERENCE`, or `UNTESTED`. It never emits a model-superiority verdict for an access treatment. Matching identifiers do not prove an unchanged provider snapshot or a causal access effect; preserve provider evidence and the controlled experimental design separately. This software does not assert CVP enrolment or provide cyber authorisation.

## Validate the software

```bash
python3 -m pytest -q harness/bench/test_comparison_integrity.py \
  harness/bench/test_paired_comparison.py harness/bench/test_run_bench.py
```

These are software checks, not new model measurements. To run the separate live public-bank loading check, use `python3 harness/bench/test_run_bench.py`; it reports unavailable banks as failures.

See [the product and benchmark qualification guide](../../docs/measurement/GSPC-MEOK-PRODUCT-QUALIFICATION-2026-10-30.md) for holdouts, external benchmark tracks and product acceptance.

## Inspect integration

The optional adapter imports the same canonical loader, prompt builder and grader.
Install its qualified dependency in an isolated environment:

```bash
python -m pip install -r harness/bench/requirements-inspect.txt
python -m pytest -q harness/bench/test_inspect_task.py
```

Download the intended bank at a fixed Hub commit, retain its original JSONL bytes,
and record their SHA-256. Supply both to Inspect:

```bash
inspect eval harness/bench/inspect_task.py@gspc \
  -T axis=governance -T bank_path=/absolute/path/items.jsonl \
  -T bank_sha256=THE_RECORDED_64_CHARACTER_SHA256 --model YOUR_CONFIGURED_MODEL
```

Add `-T execution_context_path=/absolute/path/context.json` to retain the same context and digest in Inspect metadata. The context's model must match Inspect's provider-side model name. Its non-null temperature/max_tokens are applied by the generation solver and take precedence over generic Inspect overrides, so change the context when changing those limits. Other Inspect settings remain in the native evaluation log and must be reviewed before exporting a comparison receipt. Omit the context to preserve the adapter's original configuration behaviour; access then remains unknown.

This command performs model calls under the selected provider configuration.
The adapter refuses changed bytes and unsound label menus. It reports accuracy
over all completed items, parsed coverage, and accuracy among parsed replies
(undefined when none parse). The original reply and its digest remain in each
Inspect log sample. Check the completed sample IDs against `bank_items_total`: an
Inspect `--limit`, error or interruption does not qualify as full-bank coverage.

Tests run the actual Inspect framework with synthetic local replies, including
correct, wrong, malformed, empty and zero-parsed cases. These are integration
checks, not measured model performance or external leaderboard acceptance.
The older draft adapter bundled on HF remains historical; use this canonical path.
