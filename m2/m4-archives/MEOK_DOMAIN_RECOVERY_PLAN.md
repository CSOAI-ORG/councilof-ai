# MEOK Domain Recovery Plan — 15-Minute Fix
## Critical Infrastructure Repairs | 28 May 2026

**Situation:** 4 domains down, 1 serving wrong content, 1 apex not promoted. Bleeding trust signal daily.

**Goal:** All domains serving correct content within 15 minutes.

---

## THE DAMAGE REPORT

| Domain | Status | Root Cause | Fix |
|--------|--------|------------|-----|
| **proofof.ai** | ❌ DOWN | Vercel deployment stale — DNS correct (→ 76.76.21.21) | Redeploy `clawd/proofof-ai` |
| **safetyof.ai** | ⚠️ WRONG CONTENT | Domain alias misconfigured in Vercel UI — serving councilof.ai | Fix alias in Vercel dashboard |
| **fishkeeper.ai** | ❌ DOWN | Redirect to meok.ai configured but not deployed | Redeploy `clawd/fishkeeper-site` |
| **koikeeper.ai** | ❌ DOWN | Redirect to meok.ai configured but not deployed | Redeploy `clawd/koikeeper-site` |
| **optomobile.ai** | ❌ DOWN | NO DNS RECORDS AT ALL | Add A record at Namecheap |
| **csoai.org** | ⚠️ STALE | May 21 deploy still live — new 172 pages built but not promoted | Redeploy `clawd/csoai-org` |

---

## THE FIXES (in order of impact)

### FIX 1: proofof.ai (2 min) — HIGHEST IMPACT

This is your **receipt/attestation layer** — the actual product moat. `meok-attestation-verify` PyPI package (192 dl/mo) calls back to this domain.

```bash
cd /Users/nicholas/clawd/proofof-ai
vercel --prod
```

**What this does:** Redeploys `index.html` + `verify.html` to Vercel project `prj_B96cIUC7NzS3rp5BbZTZjWStRb1I`.

**Verify:** `curl -I https://proofof.ai` should return 200.

---

### FIX 2: safetyof.ai (2 min) — HIGH IMPACT

This is the **HOW pillar** of your substrate. Currently serving councilof.ai content.

**The problem is NOT the code — it's the Vercel domain alias.**

The local `index.html` has the correct title: "SafetyOf.AI — Free AI Safety Posture Score (5 min)"

**Fix in Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Find project `safetyof-ai` (or `safetyofai`)
3. Go to **Settings → Domains**
4. Remove `safetyof.ai` if it's pointing to `councilof-ai`
5. Add `safetyof.ai` to the `safetyof-ai` project
6. Or simply run:

```bash
cd /Users/nicholas/clawd/safetyof-ai
vercel --prod
# Then in Vercel dashboard, ensure safetyof.ai domain is assigned to THIS project
```

**Verify:** `curl -s https://safetyof.ai | grep "<title"` should show "SafetyOf.AI" not "councilof-ai".

---

### FIX 3: csoai.org (2 min) — HIGH IMPACT

Your **172-page static site** (charter, frameworks, crosswalks, certify, ASTI, etc.) is built and ready in `clawd/csoai-org/public/`. The May 21 deploy is stale.

```bash
cd /Users/nicholas/clawd/csoai-org
vercel --prod
```

**What this promotes:**
- `/` — new homepage
- `/charter` — 52-article Charter page
- `/asti` — ASSTI benchmark
- `/certify` — Certification flow
- `/crosswalks` — Framework crosswalks
- `/frameworks/*` — 13 framework deep-dives (EU AI Act, NIST, TC260, DORA, GDPR, etc.)

**Verify:** `curl -s https://csoai.org/charter | head -5` should return HTML, not 404.

---

### FIX 4: fishkeeper.ai + koikeeper.ai (2 min) — MEDIUM IMPACT

Both are configured to **301 redirect to meok.ai**. The configs are correct — they just need redeployment.

```bash
cd /Users/nicholas/clawd/fishkeeper-site && vercel --prod
cd /Users/nicholas/clawd/koikeeper-site && vercel --prod
```

**Verify:**
```bash
curl -I https://fishkeeper.ai | grep -i location  # should show meok.ai
curl -I https://koikeeper.ai | grep -i location    # should show meok.ai
```

---

### FIX 5: optomobile.ai (5 min) — MEDIUM IMPACT

This domain has **zero DNS records**. You need to add an A record at Namecheap (or wherever you manage the domain).

**Namecheap DNS Setup:**
1. Log into Namecheap → Domain List → Manage `optomobile.ai`
2. Go to **Advanced DNS**
3. Add A Record:
   - Type: `A Record`
   - Host: `@`
   - Value: `76.76.21.21`
   - TTL: Automatic
4. Save

**Then deploy:**
```bash
cd /Users/nicholas/clawd/optimobile-site
vercel --prod
```

**Verify:** `dig +short optomobile.ai` should return `76.76.21.21` within 5-30 minutes.

---

## ONE-SHOT DEPLOY SCRIPT

Save this as `~/recover-domains.sh` and run it:

```bash
#!/bin/bash
set -euo pipefail

echo "🚀 MEOK Domain Recovery — deploying all stale projects"
echo ""

# Check vercel login
if ! vercel whoami &>/dev/null; then
  echo "❌ Not logged into Vercel. Run: vercel login"
  exit 1
fi

echo "1/6 — Deploying proofof.ai (receipt layer)..."
cd /Users/nicholas/clawd/proofof-ai && vercel --prod --yes

echo "2/6 — Deploying safetyof.ai (HOW pillar)..."
cd /Users/nicholas/clawd/safetyof-ai && vercel --prod --yes

echo "3/6 — Deploying csoai.org (172 pages)..."
cd /Users/nicholas/clawd/csoai-org && vercel --prod --yes

echo "4/6 — Deploying fishkeeper.ai (redirect to meok.ai)..."
cd /Users/nicholas/clawd/fishkeeper-site && vercel --prod --yes

echo "5/6 — Deploying koikeeper.ai (redirect to meok.ai)..."
cd /Users/nicholas/clawd/koikeeper-site && vercel --prod --yes

echo "6/6 — Deploying optimobile-site (requires DNS fix first)..."
cd /Users/nicholas/clawd/optimobile-site && vercel --prod --yes

echo ""
echo "✅ All deployments triggered."
echo ""
echo "⏳ DNS propagation for optomobile.ai may take 5-30 minutes."
echo "🔧 REMEMBER: Fix safetyof.ai domain alias in Vercel dashboard if still wrong."
echo "🧪 Verify with:"
echo "   curl -I https://proofof.ai"
echo "   curl -I https://csoai.org/charter"
echo "   curl -s https://safetyof.ai | grep '<title'"
```

---

## WHAT'S ALREADY WORKING (Don't Touch)

| Domain | Status | Why It's Fine |
|--------|--------|---------------|
| **meok.ai** | ✅ Live | Homepage indexed, serving correctly |
| **councilof.ai** | ✅ Live | Indexed, "Shopify of AI compliance" framing active |
| **templeman-opticians.com** | ✅ Live | 10+ pages deeply indexed. Real Essex SEO. Your income safety net. |
| **aquaponics.app** | ✅ Live | Indexed by Google |
| **biasdetectionof.ai** | ✅ Live | Serving, just not indexed yet (too new) |
| **haulage.app** | ✅ Live | Serving, just not indexed yet |
| **cobolbridge.ai** | ✅ Live | Serving, just not indexed yet |
| **meok-kits-host** | ✅ Live | Updated today with cross-links |
| **meok-attestation-api** | ✅ Live | Clean compliance MCP catalogue |
| **meok-eu-ai-act** | ✅ Live | Pillar page live |
| **meok-verify** | ✅ Live | Verify-attestation page live |
| **meok-compliance** | ✅ Live | 48-hour compliance landing live |

---

## THE PYPI MOMENTUM

**6,798 downloads/month across 25 packages.** Not theoretical. Real installs.

| Package | Monthly | Notes |
|---------|---------|-------|
| meok-cra-annex-iv-classifier-mcp | 1,347 | 🥇 Lead magnet working |
| meok-watermark-attest-mcp | 1,084 | 🥈 Strong secondary |
| meok-mcp-injection-scan-mcp | 730 | Security-focused |
| meok-nis2-de-register-mcp | 726 | EU compliance |
| meok-fria-generator-mcp | 519 | EU AI Act |
| meok-dora-tlpt-planner-mcp | 496 | Financial services |
| meok-bft-governance-mcp | 422 | Governance |
| meok-neural-health-monitor-mcp | 387 | Health vertical |

**8 packages at 0 downloads** — these need either:
1. Better PyPI long_description/keywords
2. Rename + republish with clearer naming
3. Outreach (blog post, tweet, HN submission)
4. Check if the install URL from blog/email is wrong (especially `meok-omnibus-tracker-mcp` — EU AI Act lead magnet getting 0 means the funnel is broken)

---

## VERIFICATION CHECKLIST (run after deploy)

```bash
# Core domains
curl -s -o /dev/null -w "proofof.ai: %{http_code}\n" https://proofof.ai
curl -s -o /dev/null -w "csoai.org: %{http_code}\n" https://csoai.org
curl -s -o /dev/null -w "csoai.org/charter: %{http_code}\n" https://csoai.org/charter
curl -s -o /dev/null -w "safetyof.ai: %{http_code}\n" https://safetyof.ai
curl -s -o /dev/null -w "fishkeeper.ai: %{http_code}\n" https://fishkeeper.ai
curl -s -o /dev/null -w "koikeeper.ai: %{http_code}\n" https://koikeeper.ai

# Check safetyof.ai title is correct
curl -s https://safetyof.ai | grep "<title" | head -1

# Check redirects
curl -s -I https://fishkeeper.ai | grep -i location
```

---

## BONUS: app.csoai.org Deployment

The React platform **builds successfully** (3642 modules, 29.26s). Ready to deploy.

```bash
cd "/Users/nicholas/Desktop/jan - feb 2026/JAN 2026/CSOAI"
vercel --prod
```

**Note:** This requires a Vercel project configured for `app.csoai.org` with SPA rewrites (`/* → /index.html`).

---

*Prepared: 28 May 2026 | All project IDs and paths verified from local `.vercel/project.json` files.*
