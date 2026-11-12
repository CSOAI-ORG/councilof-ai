# Post-Merge Live Verification Record — 2026-11-03 (E1)

**Doc ID:** `csoai.verification-batch/2026-11-03` · **Script:** `scripts/verify-post-merge-batch.mjs` · **Status:** `4 / 4 PASS`
**Source URL:** https://councilof.ai/api/gspc (`schema: csoai.gspc-axes/0.5`, `as_of: 2026-11-01T15:09:42Z`)

## 1. Executed 4-Line Verification Batch (`node scripts/verify-post-merge-batch.mjs`)

```text
[PASS] 1_axes_reconciliation: public_count="34 axes · 34 measured", measured=34, unmeasured=0, axes_html_len=15696
[PASS] 2_cards_64hex_door: /cards/001e8bd830605eb149a4bc6423019f609e90a048919c9383adf28aea975a9429.json resolved sha256=001e8bd830605eb149a4bc6423019f609e90a048919c9383adf28aea975a9429
[PASS] 3_verify_roundtrip: verdict=VALID (64-hex leaf digest and 64-byte Ed25519 signature present in signed bundle) id=001e8bd830605eb149a4bc6423019f609e90a048919c9383adf28aea975a9429
[PASS] 4_root_leaf_coverage: missing_root_leaves=0, merkle_root=4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0, match=true
```

## 2. External Mirror Parity (`python3 scripts/spray/verify-gspc-parity.py --allow-stale-live-root`)

| Target Surface | Kind | Observed `as_of` | Observed `merkle_root` | Status |
|---|---|---|---|---|
| `https://councilof.ai/api/gspc` | Live API | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `MEASURED` (`34 / 34`) |
| `https://huggingface.co/datasets/csoai/gspc-board` | HF Dataset | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `EXTERNALLY_VERIFIED` |
| `https://huggingface.co/spaces/csoai/gspc-board` | HF Space | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `EXTERNALLY_VERIFIED` |
| `https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board` | Kaggle Dataset | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `EXTERNALLY_VERIFIED` |
| `https://www.kaggle.com/datasets/nicktempleman/gspc-one` | Kaggle Dataset | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `EXTERNALLY_VERIFIED` |
| `https://github.com/CSOAI-ORG/gspc-board` | GitHub Mirror | `2026-11-01T15:09:42Z` | `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0` | `EXTERNALLY_VERIFIED` |

Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
