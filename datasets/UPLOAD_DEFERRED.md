# Upload deferred — NEXT_300 #139 / #186 / #253

**Status:** staged + verified locally · Hub targets **missing** until write path succeeds.

| Check | Result |
|-------|--------|
| `npm run verify:staged-hf` | ✅ (measured_score null · dataset-card YAML) |
| `hf_fs stat hf://datasets/csoai/labour-economy-unmeasured` | missing |
| `hf_fs stat hf://datasets/csoai/rwa-testnet-unmeasured` | missing |
| Shell `HF_TOKEN` / `hf auth login` | unset |
| MCP `hf_whoami` | OAuth read + `contribute-repos` — **no upload tool** |
| Linked Cursor environment | null (secrets cannot inject until env linked) |
| Actions secret `HF_TOKEN` | **absent** — token upload skipped |
| Trusted Publisher OIDC | CI ready (`id-token: write`) · Hub publishers **not configured** · empty repos **missing** |

### Owner unblock (either)

1. **Path A:** set Cloud/`Actions` secret `HF_TOKEN` → `npm run hf:upload-staged` / workflow `auth=token|auto`.
2. **Path B:** create empty Hub datasets → Settings → Trusted Publishers (GitHub Actions: `repository=CSOAI-ORG/councilof-ai`, `workflow=hf-upload-staged.yml`) → workflow `auth=oidc|auto`.

When write auth works:

```bash
npm run verify:staged-hf
npm run hf:upload-staged
```

CI: `.github/workflows/hf-upload-staged.yml` always verifies; uploads via token or OIDC (OIDC soft-skips if publishers missing).

Then confirm Hub `stat`, update `docs/HF_ORG_DATASET_INDEX.md`, and tick #139/#186/#253 in `docs/NEXT_300_MOVES.md` only after repos exist.

Never invent MEASURED labour scores. Per-slot cards (`csoai/gspc-*-labour-index`, `gspc-ai-economy-index`) are **not** substitutes for these unified packs.

Owner tracker: https://github.com/CSOAI-ORG/councilof-ai/issues/887

**Agent-shipable tip honesty outside HF is exhausted** except CI/docs for upload paths. Remaining open NEXT_300 rows are ⛔ custody/counsel/merge, freeze ☐, human send ☐, or this HF upload 🔄.

## Overnight recheck log

| When (UTC) | Hub | Token | Notes |
|------------|-----|-------|-------|
| 2026-08-28 | missing | unset | packs verified; CI workflow on tip |
| 2026-08-28 ~21:20–22:30 | missing | unset | stacked timer rechecks; tip honesty ships |
| 2026-08-28 ~23:38 | missing | unset | CI [33221090655](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/33221090655) verify ✅ · upload **skipped**; tip `20c572f9` |
| 2026-08-28 ~23:39 | missing | unset | full route smoke 200; tip-health OK; vitest labourIndices 8/8; agent work blocked only on `HF_TOKEN` |
| 2026-08-28 ~23:50 | missing | unset | recheck: tip `0df18859`; MCP OAuth admin/`contribute-repos` but `hf_fs` read-only; Hub both missing; tip-health OK; vitest 8/8; routes 200; requested Cloud `HF_TOKEN` + Actions secret |
| 2026-08-28 ~23:55 | missing | unset | shipped Trusted Publisher OIDC path in `hf-upload-staged.yml` + runbook path B; still need empty Hub repos + publishers **or** `HF_TOKEN` |

As-of: 2026-08-28
