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

## Overnight recheck log

| When (UTC) | Hub | Token | Notes |
|------------|-----|-------|-------|
| 2026-08-28 | missing | unset | packs verified; CI workflow on tip |
| 2026-08-28 ~21:20 | missing | unset | tip-health OK; vite `:43125`; vitest labourIndices 8/8; requested env + Actions secret |
| 2026-08-28 ~21:22 | missing | unset | CI run [33212232562](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/33212232562) verify ✅ · upload **skipped** (no Actions `HF_TOKEN`) · tip `77986283` |

As-of: 2026-08-28
