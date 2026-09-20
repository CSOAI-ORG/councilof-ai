# Recovery Inventory — evidence-audit item 3

Generated: 2026-09-20T02:36:00Z · Method: read-only git + anonymous `curl` (no auth) · Machine-readable receipt: `recovery-inventory.json`

## This clone (canonical candidate #1)

| What | Command | Observed |
|---|---|---|
| Origin | `git remote -v` | `https://github.com/CSOAI-ORG/councilof-ai.git` |
| Branch | `git branch --show-current` | `fix/deploy-trigger-coupling` |
| HEAD | `git rev-parse HEAD` | `3dfb20e36b20004024a1897481f66d9c9e4393ed` |
| Commits (HEAD) | `git rev-list --count HEAD` | 1036 |
| Commits (origin/master) | `git rev-list --count origin/master` | 1037 |
| Refs | `git for-each-ref \| wc -l` | 132 |
| `.git` size | `du -sh .git` | 459M |
| fsck | `git fsck --no-progress` | 46 dangling objects (commits+trees); no errors; finished <60s |
| Worktree | `git status --porcelain \| wc -l` | 1022 modified/untracked (expected multi-lane dirty tree) |

## Nested clones (depth ≤ 3)

| Path | Origin | Branch | HEAD | Commits |
|---|---|---|---|---|
| `condor/` | `https://github.com/hummingbot/condor.git` | `gspc-market-swarm-20260919` | `d89e74f2e3e273bea102c64e4977118e6a88084f` | 1 (shallow) |
| `hummingbot-api/` | `https://github.com/hummingbot/hummingbot-api.git` | `main` | `2494e847538bb7b819495cbc30eb4ef828feaacd` | 1 (shallow) |

## External mirror candidates (anonymous reachability, 2026-09-20T02:34:55–02:35:15Z)

| Mirror | URL | HTTP | Note |
|---|---|---|---|
| GitHub CSOAI-ORG/councilof-ai | github.com/CSOAI-ORG/councilof-ai (+ API) | **404** | UNKNOWN: private, renamed, or deleted — auth check out of scope |
| HF datasets csoai/gspc-agi, gspc-hub-cards, x402-settlement-census (sample of 40+ declared) | huggingface.co/datasets/csoai/* | 200 | all three sampled repos live |
| HF space csoai/gspc-board | huggingface.co/spaces/csoai/gspc-board | 200 | |
| HF author API | huggingface.co/api/models?author=csoai | 200 | prior audit recorded 38 public spaces |
| PyPI csoai-gspc | pypi.org/project/csoai-gspc (+ JSON API) | 200 | published |
| npm csoai-gspc | registry.npmjs.org/csoai-gspc | **404** | not published (web 403 = bot-block, not evidence) |
| npm csoai-gspc-mcp | registry.npmjs.org/csoai-gspc-mcp | 200 | published |
| Zenodo | doi.org/10.5281/zenodo.21991104 | 200 | resolves; CITATION.cff DOI |
| Kaggle nicktempleman/csoai-canonical-20260911 | kaggle.com/... | **404** | UNKNOWN: possible login wall |
| hummingbot/condor, hummingbot/hummingbot-api | github.com | 200 | upstream origins of nested clones |

## Licences

- `LICENSE` — MIT, © 2024-2026 COAI - Council of AIs
- `condor/LICENSE`, `hummingbot-api/LICENSE` — MIT, © 2023 Hummingbot Foundation
- `CITATION.cff` — MIT, DOI 10.5281/zenodo.21991104

## Latest verified build artifacts

- `dist/client` — present, 359M (freshness UNKNOWN)
- `public/root.json` — as_of **2026-09-15T07:13:43Z**, 24454 bytes
- `public/interop/card-root-2026-09-20.json` — committed today in HEAD `3dfb20e` (2026-09-20T03:21:43+01:00); as_of 2026-09-20T02:12:24Z; merkle_root `3490a275…e10583`; n_leaves 1424, n_skipped 953; self-declares `not_a_certificate: true`

## Known unknowns

1. CSOAI-ORG GitHub repo status (404 anonymous — cannot distinguish private/renamed/deleted).
2. Kaggle dataset existence (anonymous 404 may be login wall).
3. Full reachability of the 40+ declared `csoai/*` HF repos (only 3 sampled).
4. `dist/client` build freshness.
5. Branch divergence: HEAD branch has 1036 commits vs origin/master 1037; ancestry not analysed.
