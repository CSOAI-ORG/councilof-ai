# Third-party sources, dataset licences and public evidence limits

**Scope:** `csoai/inspect-evidence` static demonstration; source pin and log hashes are in `evidence/evidence_manifest.json`. This is a provenance/redistribution notice, **not** a legal opinion or a grant of rights over third-party content. A cryptographic digest establishes byte integrity, not licence compliance, model truth or ownership.

The Space contains (a) CSOAI-authored static viewer and packaging scripts, which may be licensed MIT, and (b) Inspect `.eval` archives that can embed third-party prompts, expected answers, scorer outputs and dataset fragments. **The entire Space cannot be described as MIT.** Upstream licences and any distinct rights in individual dataset contents remain in force.

| Dataset recorded in manifest | Dataset revision (source-pinned declaration) | Data licence and provenance | Limit |
|---|---|---|---|
| `csoai/gspc-gov` | `c6ddc5a92c2354248e6b1328ebd341872ee80019` | [Dataset card](https://huggingface.co/datasets/csoai/gspc-gov), CC BY 4.0; derived from [AI Act Evaluation Benchmark](https://github.com/davidath/ai-act-evaluation-benchmark) (NCSR Demokritos). Credit upstream authors and Council, identify changes. | Scenario wording leaks class labels; not a legal-application assessment. |
| `stanford-crfm/air-bench-2024` | `976d9fbb0f52bce704dcbef5bd7a2652e65f2a21` | [Dataset card](https://huggingface.co/datasets/stanford-crfm/air-bench-2024), CC BY 4.0. Credit Stanford CRFM and dataset authors. | Its Space row uses a mock model, so no model-performance inference. |
| `allenai/coconot` | `2cbe16aabf9069f17e48c8daad8aeabc29469eb7` | [Dataset card](https://huggingface.co/datasets/allenai/coconot), [ODC-BY licence text](https://huggingface.co/datasets/allenai/coconot/blob/main/LICENSE.md). The dataset card *also* links [AI2 ImpACT Low Risk terms](https://allenai.org/licenses/impact-lr) and explicitly says users must follow underlying component licences. Credit Allen Institute for AI and the CoCoNot authors. | ODC-BY relates principally to the database; it does not necessarily license all underlying individual contents or waive other obligations. Review before onward commercial distribution. |

The included `Inspect AI` evaluation harness belongs to its upstream maintainers. These logs mention Inspect AI 0.3.291 and Inspect Evals 0.29.0; this Space is not endorsed or certified by AISI, NIST, Stanford, AllenAI or upstream research teams.

## Evidence status

- One **10-sample** Qwen2.5-0.5B-Instruct GovBench run: real-model smoke check, not a statistically useful evaluation or comparative safety claim.
- Four `mockllm` logs: integration fixtures, **not model measurements**.
- Manifest state: `CONTENT_ADDRESSED_UNSIGNED`. SHA-256 and a public Merkle root show internal byte consistency. They do not prove who ran the model, that the data was unmodified before sealing, or that an independent custodian approved the record.
- No customer data, real human approval, root-of-trust signing authority, paid acceptance or regulatory endorsement is asserted here.

## Reuse and publication gate

If using a row or redistributing a log, retain source attribution, its revision pin, this notice and the relevant upstream terms. Before commercial reuse, inspect the exact content and rights, particularly CoCoNot's individual contents. Publishing a Space is not itself a rights clearance. Report a rights issue or error to the Council's public corrections channel.

This notice is checked mechanically against the manifest by `tools/verify_release_notices.py`; that check only prevents missing attribution fields, **not** legal infringement.
