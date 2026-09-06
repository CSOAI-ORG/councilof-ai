# codex/readiness-100 — mining table

Every file the branch has that master does not, with a verdict and a reason. Measured
2026-09-06 against `origin/master`. Nothing deleted; the branch is untouched.

```bash
B=codex/readiness-100
for f in $(git diff --name-only origin/master...$B); do
  git cat-file -e "origin/master:$f" 2>/dev/null || echo "ABSENT $f"; done   # 32
```

| files | verdict | reason |
|---|---|---|
| `scripts/__pycache__/*.pyc` × **11** | **REFUSE** | Compiled Python bytecode — build output, never source. Two interpreter generations of the same modules (`cpython-312` and `cpython-314`), plus pytest caches. Committing them makes the tree non-reproducible and leaks the local interpreter version. |
| `functions/api/card-sign.ts` + `.test.ts` | **OWNER GATE** | A **new signing surface**. GitHub-OIDC-only, pinned to pubkey `d4cb0eaa…` (= `did:web:csoai.org#card-attestation-1`), deliberately separate from `/api/board-sign` "so a board snapshot signature cannot be relabelled as a measurement-card signature". Needs a new secret `CARD_SIGN_KEY_PKCS8_B64`. `/api/card-sign` is **404 live** today. Adding a signing endpoint is the owner's decision, not a lane's. |
| `functions/api/_boardCounts.{ts,test.ts}`, `_chatAxis.{ts,test.ts}` | **LAND** | Self-contained helpers with tests. 4 tests, all pass against master unmodified. |
| `scripts/build_hf_card_candidate.py`, `hf_one_lineage.py`, `watch_public_root.py` + their 3 `test_*.py` | **LAND** | Producers plus their tests. Master ships none of them. Syntax-checked; `pytest` is not installed on this Mac, so the python tests are landed unrun — stated, not implied. |
| `functions/api/lead.test.ts` | **HOLD** | A test for `lead.ts`; master's implementation differs, so it belongs with a `lead.ts` decision, not alone. |
| `evidence/hf-reference-loop/` × 4 | **ALREADY MINED** | Mined in **PR #1370** into `public/interop/hf-observations-2026-09/staged-qwen3-0.6b-governance.json` — signature preserved, verdict `VALID_BUT_UNANCHORED_SIGNER`. The source files stay out: the staged artefact is the published form. |
| `public/interop/mill-cards-unsigned/unsigned-gspc-governance-765795125635.json` | **HOLD** | An unsigned mill card. Its directory is the right shape (`mill-cards-unsigned`), but a card should arrive from the mill producer, not by hand — producer artefacts are never hand-placed. |

## What this PR lands
The 10 files marked LAND: 2 function helpers + 2 tests (4 tests, passing), 3 python producers +
3 python tests. Nothing signed, nothing published, no producer artefact hand-edited.
