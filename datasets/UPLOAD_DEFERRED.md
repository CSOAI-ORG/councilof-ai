# Upload deferred — NEXT_300 #139 / #186 / #253

**Status:** staged + verified locally · Hub targets **missing** until write token.

| Check | Result |
|-------|--------|
| `npm run verify:staged-hf` | ✅ (measured_score null · dataset-card YAML) |
| `hf_fs stat hf://datasets/csoai/labour-economy-unmeasured` | missing |
| `hf_fs stat hf://datasets/csoai/rwa-testnet-unmeasured` | missing |
| Shell `HF_TOKEN` / `hf auth login` | unset |
| MCP `hf_whoami` | OAuth read + `contribute-repos` — **no upload tool** |

When write auth works:

```bash
npm run verify:staged-hf
npm run hf:upload-staged
```

Then confirm Hub `stat`, update `docs/HF_ORG_DATASET_INDEX.md`, and tick #139/#186/#253 in `docs/NEXT_300_MOVES.md` only after repos exist.

Never invent MEASURED labour scores. Per-slot cards (`csoai/gspc-*-labour-index`, `gspc-ai-economy-index`) are **not** substitutes for these unified packs.

As-of: 2026-08-28
