# Apex clobber — owner actions (2026-08-22)

Observed: `https://councilof.ai/` = **7016 bytes** thin Vite shell.
Fat gated build lives on `csoai-site.pages.dev` / hash previews after GHA.
`DEPLOY-LOCK.md` already names the race: Pages Git auto-build (or Mac wrangler)
overwrites the production alias ~2–4 minutes after official deploy.

## Do this (dashboard — this agent cannot)

1. Cloudflare Dashboard → Pages → project **`councilof-ai`**
2. **Settings → Builds & deployments → Disable automatic deployments** from Git
   (or disconnect the Git integration). Builds must come only from
   `.github/workflows/deploy.yml`.
3. GitHub → Actions → **Build + deploy site** → Run workflow (`workflow_dispatch`).
4. Wait for green, then:
   ```bash
   node scripts/assert-prerender-live.mjs --label post-owner-fix \
     --host https://councilof.ai \
     --also https://councilof-ai.pages.dev
   sleep 150
   node scripts/assert-prerender-live.mjs --label clobber-window \
     --host https://councilof.ai \
     --also https://councilof-ai.pages.dev
   ```
5. Pass criteria: homepage ≥ `canon.json.min_homepage_bytes` (20000),
   CouncilLobby chunk present, `/gspc-verify/` and `/gspc-scoreboard` 200,
   still fat after the trailing-clobber window.

## Do not
- `wrangler pages deploy` this project from a laptop
- Treat a fat `/os/` as proof `/` is gated
- Ship while drift-guard is RED

## Related
- Living board API still healthy: `/api/gspc` (14 axes, site_attestation)
- ClaimGuard: https://github.com/CSOAI-ORG/claimguard
- Estate plan: https://github.com/CSOAI-ORG/.github/blob/cursor/gspc-axis-canon-inventory-ff6e/docs/MASTER_PLAN.md
