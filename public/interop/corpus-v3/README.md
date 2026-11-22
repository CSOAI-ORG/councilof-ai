# Frozen corpus v3: global AI regulatory registry and provision texts

Built 2026-11-21. Normaliser v1.0.0 (`scripts/mechanism/normaliser_v1.py`). Root algorithm as v1: `sha256(concat(sorted(provision_id + provision_sha256)))`.

| | |
|---|---|
| Instruments in the registry | 678 across 135 jurisdiction codes |
| Frozen as full text / identifiers only / registry only | 272 / 39 / 367 |
| Provisions hashed | 8178 (text published for 7359; hash only for 819 where the reuse licence is unverified, across 18 instruments) |
| In force or enacted instruments frozen as text | 264 of 573 |
| Corpus v3 root | `8d057a301973ec0307566152362cf711a661eea956426fe960ee9e28a49c25c0` |

Verify: `python3 scripts/mechanism/verify_corpus_v3.py` (re-hashes every published text) and `npx vitest run scripts/mechanism/corpus-v3.test.ts`.

Built from corpus v2 (root `3c435dfb…`) plus four waves on 21 Nov 2026: US federal and states; Latin America, Africa and the Middle East; EU member states and sector regulators; APAC gaps and the standards/frameworks layer. Each wave's search scope, split rules, exclusions, unverified statuses and blocked hosts (with the human route for each) are in `coverage/`.

## Relation to v1 (`public/interop/frozen-provision-hashes.json`, root `37e2e10d…`, unchanged)
405 v1 provisions are carried with identical hashes. 9 provisions that v1 hashed over text cut at 10,000 characters carry full text here. 32022L2464:25, :29 and :40 are excluded as misidentified fragments. See `v1-corrections.jsonl`.

## What this does NOT claim
- No provision is measured, tested or satisfied by appearing here. Registry rows are routing records, not regulator relationships. No compliance label is implied.
- Coverage is not complete. 309 in-force or enacted instruments are registry-only or identifiers-only: official hosts that block automated clients were never bypassed, some licences are unverified, and some instruments were out of time. Whole areas are thin or absent: about 18 US states are not enumerated; many African, Caribbean, Pacific, South and Central Asian states have no row; most EU national DPA guidance and the Commission AI Act guidelines are missing (ec.europa.eu failed TLS). The coverage notes list each gap.
- Statuses were verified on 20/21 Nov 2026 from cited sources. Many rest on one secondary source and are provisional (listed in the coverage notes). 16 instruments carry a null status.
- Frozen texts are as-enacted or latest-consolidated as each wave recorded. There is no point-in-time history yet; the provision-spine daily watcher in CSOAI-ORG/corpus-watch adds drift detection.
- Standards (ISO/IEC, IEEE) are identifiers only.
