# Per-axis report contract (draft v0.1)

**Status:** DRAFT for owner review, 21 Nov 2026. Not in force. Nothing here changes `/api/gspc` or any published board file.
**Parent plan:** [`CSOAI-RELIANCE-PLAYBOOK.md`](CSOAI-RELIANCE-PLAYBOOK.md) §5.4 and §5.5. **Machine-readable form:** [`axis-report.schema.json`](axis-report.schema.json) (JSON Schema 2020-12).

Each of the 34 GSPC axes is published as its own report, one per frozen snapshot. A report is a measurement record, not a certificate or a rating.

## 1. Fields

| Field | Required | Meaning |
|---|---|---|
| `contract_version` | yes | `"0.1"` |
| `axis_id`, `family`, `kind` | id, kind | `kind` is `model-comparison`, `deterministic-facts` or `measured-subject` |
| `snapshot_id` | yes | Frozen snapshot id (playbook §5.3). Never "the live board". |
| `method_sha`, `bank_sha`, `dataset_revision` | yes (bank/revision may be `null` where not applicable) | Pinned inputs. Pinning the HF dataset revision closes the gap that Inspect logs do not record it. |
| `method_status` | no | e.g. `meets-rule`, `legacy` |
| `measured_at` | when MEASURED or STALE | Date of the measurement run |
| `population` | yes | `unit`, `denominator`, `tested`, `failures`, `inaccessible`. Coverage is never implied. |
| `result` | when MEASURED or STALE; must be `null` when UNMEASURED/UNCHECKABLE | `metric`, `value`, optional `unit`, optional `ci{level, low, high, method}` |
| `separation` | yes | `verdict` SEPARATED / TIE / UNTESTED / NOT_APPLICABLE. SEPARATED needs `test`, `p_value`, `leader`; TIE needs `test`, `p_value`; UNTESTED needs `reason_code`. Model-comparison axes cannot use NOT_APPLICABLE. |
| `status` | yes | MEASURED (fresh) / STALE (older than `stale_after_days`) / UNMEASURED / UNCHECKABLE |
| `stale_after_days` | yes | Freshness threshold for this axis. The owner sets N per axis kind (proposal: 30 days for model-comparison). |
| `reproductions[]` | yes (may be empty) | Independent reruns: `by`, `at`, `outcome` REPRODUCED / DIFFERED / FAILED, `ref` |
| `reliance[]` | yes (may be empty) | Named acceptances, **only with consent** (`consent: true`) |
| `anchor` | yes | `merkle_root`, `state` ANCHORED / PENDING / SIMULATED / NONE, `ots`, `rekor` |
| `disclaimer` | yes | States that this is a measurement record, not a certificate, rating or conformity assessment |
| `access_level` | no (v1.1 addition) | What access the measurer had: `outside-in`, `api-key`, `weights` or `privileged`. CSOAI's own runs are `outside-in` |
| `funder`, `publication_control` | no (v1.1 addition) | Who paid for the run, and who decided that it was published |
| `min_detectable_change` | no (v1.1 addition) | `metric`, `value`, optional `basis`: the smallest change this run could have detected at its n |
| `right_of_reply` | no (v1.1 addition) | `notified_at`, `reply_ref`: notice given to a named provider before publication, and any reply. `null` when no provider is named |

## 2. Publication rules

1. One report per axis per snapshot. All 34 are published, including STALE, UNMEASURED and UNCHECKABLE ones.
2. No composite score over UNMEASURED or STALE axes. Any aggregate (e.g. the DORADO evidence index) states its coverage, e.g. "covers 6/34".
3. `status` is computed, not asserted: MEASURED becomes STALE once `measured_at + stale_after_days` has passed.
4. While the signing root is simulated, `anchor.state` is `SIMULATED` or `PENDING`, never `ANCHORED`.
5. A correction is a new report in a new snapshot that cites the one it corrects. Published reports are never edited.

## 3. Axes covered (34; ids and kinds as of 20 Nov 2026)

Kinds: 14 model-comparison, 9 deterministic-facts, 11 measured-subject.

| axis_id | family | kind | bench |
|---|---|---|---|
| `governance` | gspc | model-comparison | GovBench |
| `safety` | gspc | model-comparison | DefBench |
| `provenance` | gspc | model-comparison | ProvBench |
| `continuity` | gspc | model-comparison | PQCBench |
| `conformance` | gspc | model-comparison | MCPBench |
| `openness` | gspc | model-comparison | OSSBench |
| `machinery-conformity` | gspc | model-comparison | MachBench |
| `care` | gspc | model-comparison | CareBench |
| `cross-reality` | gspc | model-comparison | XRAIV |
| `detector-interop` | gspc | model-comparison | DetBench |
| `art5-safeguard` | gspc | model-comparison | Art5Bench |
| `swarm` | gspc | model-comparison | SwarmBench v2b |
| `affect` | gspc | model-comparison | AffectBench |
| `jail` | gspc | model-comparison | GoldBank-Detector |
| `effect-binding` | gspc | deterministic-facts | EffectBench v0.1 (server probe) |
| `provenance-controls` | financial | deterministic-facts | ChainFacts |
| `reserve-attestation` | financial | deterministic-facts | ReserveFacts |
| `regulatory-framework` | financial | deterministic-facts | RegimeFacts |
| `distribution-integrity` | financial | deterministic-facts | DistributionFacts |
| `custody-disclosure` | financial | deterministic-facts | CustodyFacts |
| `ai-adoption-components` | financial | deterministic-facts | Eurostat |
| `labour-components` | financial | deterministic-facts | Eurostat |
| `humanoid-labour-index` | financial | deterministic-facts | Disclosure |
| `lab-practice` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `company-practice` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `measurer-integrity` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `harness-fidelity` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `interop-conformance` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `humanoid-deployment` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `regulator-transparency` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `interpretability-reproducibility` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `claim-maintenance` | subject | measured-subject | claim-maintenance v0.2 re-read wave |
| `serving-fidelity` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |
| `watchdog-ingest` | subject | measured-subject | frozen presence bank (5 classes, 3-of-5 bar) |

## 4. Example (illustrative; hashes and snapshot id are placeholders)

Built from the governance axis as read on 20 Nov 2026. It is a TIE (McNemar p = 0.3787), measured on 12 Aug 2026, so it is STALE under a 30-day threshold. The root is still simulated.

```json
{
  "contract_version": "0.1",
  "axis_id": "governance",
  "family": "gspc",
  "kind": "model-comparison",
  "snapshot_id": "EXAMPLE-NOT-A-REAL-SNAPSHOT",
  "method_sha": "0000000000000000000000000000000000000000000000000000000000000000",
  "method_status": "meets-rule",
  "bank_sha": "0000000000000000000000000000000000000000000000000000000000000000",
  "dataset_revision": null,
  "measured_at": "2026-08-12",
  "population": {
    "unit": "items",
    "denominator": 237,
    "tested": 237,
    "failures": 0,
    "inaccessible": 0
  },
  "result": {
    "metric": "accuracy (leader)",
    "value": 0.5865
  },
  "separation": {
    "verdict": "TIE",
    "test": "McNemar",
    "p_value": 0.3787,
    "leader": "mistral:7b (base model)"
  },
  "status": "STALE",
  "stale_after_days": 30,
  "reproductions": [
    {
      "by": "independent rerun",
      "at": "2026-11-20",
      "outcome": "REPRODUCED",
      "ref": "McNemar 70/59 p=0.3787"
    }
  ],
  "reliance": [],
  "anchor": {
    "merkle_root": null,
    "state": "SIMULATED",
    "ots": null,
    "rekor": null
  },
  "disclaimer": "Measurement record. Not a certificate, rating or conformity assessment."
}
```

## 5. Validation

```bash
python -m pip install jsonschema
python -c "import json,jsonschema; s=json.load(open('docs/canonical/axis-report.schema.json')); jsonschema.Draft202012Validator(s).validate(json.load(open('report.json')))"
```
