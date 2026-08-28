# Upload deferred — NEXT_300 #139 / #186 / #253

**Status:** staged + verified locally · Hub targets **missing** until write token.

| Check | Result |
|-------|--------|
| `npm run verify:staged-hf` | ✅ (measured_score null · dataset-card YAML) |
| `hf_fs stat hf://datasets/csoai/labour-economy-unmeasured` | missing |
| `hf_fs stat hf://datasets/csoai/rwa-testnet-unmeasured` | missing |
| Shell `HF_TOKEN` / `hf auth login` | unset |
| MCP `hf_whoami` | OAuth read + `contribute-repos` — **no upload tool** |
| Linked Cursor environment | null (secrets cannot inject until env linked) |
| Actions secret `HF_TOKEN` | **absent** — upload step skipped on tip runs |

When write auth works:

```bash
npm run verify:staged-hf
npm run hf:upload-staged
```

CI: `.github/workflows/hf-upload-staged.yml` runs verify always; uploads only when org/repo secret `HF_TOKEN` is set (`workflow_dispatch` or pack-path pushes).

Then confirm Hub `stat`, update `docs/HF_ORG_DATASET_INDEX.md`, and tick #139/#186/#253 in `docs/NEXT_300_MOVES.md` only after repos exist.

Never invent MEASURED labour scores. Per-slot cards (`csoai/gspc-*-labour-index`, `gspc-ai-economy-index`) are **not** substitutes for these unified packs.

Owner tracker: https://github.com/CSOAI-ORG/councilof-ai/issues/887

**Agent-shipable tip honesty outside HF is exhausted** (tip `20c572f9`: sitemap+slugs, tip-honesty CI, designed regulator PDF, PDF CI npm ci + rebase, pre-deploy index slugs). Remaining open NEXT_300 rows are ⛔ custody/counsel/merge, freeze ☐, human send ☐, or this HF upload 🔄.

## Overnight recheck log

| When (UTC) | Hub | Token | Notes |
|------------|-----|-------|-------|
| 2026-08-28 | missing | unset | packs verified; CI workflow on tip |
| 2026-08-28 ~21:20–22:30 | missing | unset | stacked timer rechecks; tip honesty ships |
| 2026-08-28 ~23:38 | missing | unset | CI [33221090655](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/33221090655) verify ✅ · upload **skipped**; tip `20c572f9` |
| 2026-08-28 ~23:39 | missing | unset | full route smoke 200; tip-health OK; vitest labourIndices 8/8; agent work blocked only on `HF_TOKEN` |
| 2026-08-28 ~23:50 | missing | unset | recheck: tip `0df18859`; MCP OAuth admin/`contribute-repos` but `hf_fs` read-only; Hub both missing; tip-health OK; vitest 8/8; routes 200; requested Cloud `HF_TOKEN` + Actions secret |

As-of: 2026-08-28
