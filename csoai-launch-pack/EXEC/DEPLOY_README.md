# Phase 529 + Tabs — READY TO FIRE (one command)

**Status:** All working-tree fixes in place. One Vercel deploy makes them live.

## What changed

| Item | Where | Status |
|------|-------|--------|
| API scoring fix | `csoai-org-v2/src/app/api/assess/route.ts` + 2 helper files | Code written, deploy pending |
| 4 SOV3 OOWM tabs | Copied to `clawd/csoai-static-deploy2/SOV3_OOWM_*.html` | Build will include them |
| EXEC dashboard | Copied to `clawd/csoai-static-deploy2/EXEC/EXEC_DASHBOARD.html` | Build will include it |

## The 1-command fix (fires both Vercel deploys)

```bash
# Run these in order, takes ~2 min total

# 1. Deploy the fixed passport API to csoai-org-v2
cd /Users/nicholas/clawd/csoai-org-v2
PATH="$HOME/.local/node/bin:$PATH" vercel --prod --yes

# 2. Deploy the new OOWM tabs + EXEC dashboard to csoai-static-deploy2
cd /Users/nicholas/clawd/csoai-static-deploy2
PATH="$HOME/.local/node/bin:$PATH" vercel --prod --yes
```

After both:
- `/api/assess` returns framework-specific gaps ✅
- `csoai-static-deploy2.vercel.app/SOV3_OOWM_TAB.html` returns 200 ✅
- `csoai-static-deploy2.vercel.app/SOV3_OOWM_VISUAL.html` returns 200 ✅
- `csoai-static-deploy2.vercel.app/SOV3_OOWM_MODELTYPES.html` returns 200 ✅
- `csoai-static-deploy2.vercel.app/SOV3_OOWM_OPS.html` returns 200 ✅
- `csoai-static-deploy2.vercel.app/EXEC/EXEC_DASHBOARD.html` returns 200 ✅

## Verification (1 minute post-deploy)

```bash
# 1. API scoring test — different frameworks should produce different gaps
echo "=== EU AI ACT ==="; curl -sX POST https://csoai-org-v2.vercel.app/api/assess -d '{"system":"test-eu","framework":"EU_AI_ACT","claimed_controls":["art12_logging"]}' --max-time 8 | jq .body.result.gaps
echo "=== SOC2 ==="; curl -sX POST https://csoai-org-v2.vercel.app/api/assess -d '{"system":"test-soc","framework":"SOC2","claimed_controls":["soc2_access_control"]}' --max-time 8 | jq .body.result.gaps
echo "=== HIPAA ==="; curl -sX POST https://csoai-org-v2.vercel.app/api/assess -d '{"system":"test-hi","framework":"HIPAA","claimed_controls":["hipaa_audit_logging"]}' --max-time 8 | jq .body.result.gaps

# 2. Tabs all live
for tab in SOV3_OOWM_TAB SOV3_OOWM_VISUAL SOV3_OOWM_MODELTYPES SOV3_OOWM_OPS; do
  echo -n "$tab: "
  curl -so /dev/null -w "%{http_code} %{size_download}b\n" --max-time 8 https://csoai-static-deploy2.vercel.app/${tab}.html
done

# 3. Dashboard reachable
curl -so /dev/null -w "Dashboard: %{http_code} %{size_download}b\n" --max-time 8 https://csoai-static-deploy2.vercel.app/EXEC/EXEC_DASHBOARD.html
```

## What this fires (in this order)

1. **csoai-org-v2** deploys the API fix first. ~30s, builds, aliases to existing prod domain.
2. **csoai-static-deploy2** deploys new tabs + dashboard. Already in the build source tree (just copied), so this just compiles + ships.

## What does NOT get fired

- ❌ DNS (no change)
- ❌ Stripe (still needs separate live flip)
- ❌ Outreach (warm lead list staged only)
- ❌ Modal auth

## After fire (next moves)

1. Run verification curls above
2. Run `csoai-launch-pack/EXEC/daily-metrics.sh` (already executable) for first metrics baseline
3. Send first outreach email per the `EXEC/WARM_LEADS_BUYER.md` contact list
4. Stripe live flip for the £999 packet
5. Book first demo

## SIGIL

PHASE-529+TABS-DEPLOY-READY · Ed25519
