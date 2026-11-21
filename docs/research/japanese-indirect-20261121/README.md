# Japanese indirect-injection classifier stress probe — 21 November 2026

**Third-party source, self-run classifier test; no benign controls. This is NOT an LLM canary-following test, independent endorsement, production action prevention, or GSPC board admission.**

The model is the same pinned [Horizon-Labs Prompt Injection Guard Small](https://huggingface.co/Horizon-Labs/prompt-injection-guard-small) from the [English published-source study](../external-guard-benchmark-20261121/README.md). The source is [Masahiro Nakatsugawa's Japanese Indirect Prompt-Injection Probes](https://huggingface.co/datasets/masahiroid/japanese-indirect-prompt-injection-probes), 2026, CC BY 4.0, [DOI: 10.57967/hf/10739](https://doi.org/10.57967/hf/10739).

**Question we measured:** Does the classifier flag the injected instruction inside (A) an untrusted document, and (B) the full task plus document? The source dataset originally tests whether *generative LLMs obey* a harmless output canary. Those are different objectives. **We did not run a generative LLM, execute any tools or measure an agent's canary-following.**

## Observed result

- **58/60** externally authored injection probes flagged from the untrusted document alone at threshold 0.5.
- **58/60** flagged from the full task-plus-document context.
- All six probes flagged in nine out of ten categories; the **obfuscation-script** category flagged **4/6** in both conditions, leaving two missed probes.
- The dataset contains **no benign examples**. There is no false-positive denominator and no basis for saying 96.7% real-world protection.

Both conditions, denominators and all category counts are in [record.json](record.json). A partial, unsigned [canonical evidence event](event.json) carries source revision, method and limits. Neither record includes the prompt text. Any future experiment claiming agent resistance would need a generative agent running the canary tasks with independently observed final responses and separate permission effects.

## Pinned facts and repeatability

- Dataset revision: `c6cf9746f76f58468c0979a3c50596e6958c7f79`.
- Source file: `probes.jsonl`, SHA-256 `f83bc3fc30385520e7abe66b5fe5f5339d5ce611447fe596740472404c12520d`.
- Model revision: `2efc2ed5abecd21eb45c2506d231a65d6e392b85`.
- ONNX weights SHA-256: `61cd0741cdbfcc229e32e1de1392f352736d87d1e8b3c2b67ad9836bb7910d5d`.
- Normalizer SHA-256: `768931fc0b38fb141796abf181e0bafe96308e92c8832c817dbd6df7fc41ac79`.
- Source version is attributed to the original author and publisher; no source text redistributed.
- Report consists of 60 IDs, categories, positions, scores and input hashes per condition.
- There was no reviewer acting independently of CSOAI, no signing or trusted timestamp anchor.

With Python 3.12+ and the CPU dependencies in `.github/workflows/self-run-open-model-guard-sample.yml`:

~~~sh
python3 -m unittest discover -s scripts/research -p 'test_japanese_indirect_classifier.py' -v
python3 scripts/research/japanese-indirect-classifier.py verify \
  --result docs/research/japanese-indirect-20261121/record.json \
  --event docs/research/japanese-indirect-20261121/event.json --check-source
python3 scripts/research/japanese-indirect-classifier.py run \
  --result new-ja-record.json --event new-ja-event.json
python3 scripts/research/japanese-indirect-classifier.py verify \
  --result new-ja-record.json --event new-ja-event.json --check-source
~~~

### Research next steps

The two unflagged examples become category-specific error candidates, not a source for automatic test-set tuning. The next honest measure is a new independently prepared Japanese benign counter-set plus an actual *generative agent* canary-following test, with fixed prompting and source placement. Do not merge this 60-positive-only denominator with the 116-case English test to create a synthetic global accuracy score.
