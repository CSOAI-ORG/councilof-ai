# 🔑 OWNER ACTIONS — everything prepped, ~10 min total (2026-07-12)

The 5 owner-gated moves, each reduced to copy-paste/click. Grounded in the actual env vars the deployable
code reads (grepped, not guessed). The agent can't do these (access-control/financial/account/DNS by
design) — but here every decision + value is pre-filled except the secrets only you hold.

---

## 1. GitHub write — the domino (clears every bundled lane + free-GPU clones) · ~1 min
- Go to: **github.com/organizations/CSOAI-ORG/settings/installations**
- Click **Claude** (the GitHub App) → **Configure**
- Under **Repository access**: add **`clawd`** (or "All repositories")
- Permission needed: **Contents: Read and write** (so pushes land)
- **Save**.
> Then the v5 bundle + every lane's branch pushes directly — no more bundle-passing. And the free-GPU
> runners (Kaggle etc.) can `git clone` the private kit without me hosting it.

---

## 2. Payments go-live — TWO rails (verified from the code) · ~4 min
Your code has **two** processors: **Stripe** (consumer/attestation) + **Paddle** (csoai-org-v2, `PAYMENT_PROVIDER=paddle`).
Set the LIVE values in **Vercel → each project → Settings → Environment Variables** (paste your live secrets — never me):

**Stripe rail** (consumer OS / attestation API):
- `STRIPE_SECRET_KEY` = your **live** `sk_live_…`
- `STRIPE_WEBHOOK_SECRET` = the live `whsec_…` (from the Stripe live webhook)
- `STRIPE_PRICE_*` = the live Price IDs for each tier once `pricing.json` is ratified

**Paddle rail** (csoai.org):
- `PAYMENT_PROVIDER` = `paddle`
- `PADDLE_API_KEY` = live key · `PADDLE_WEBHOOK_SECRET` = live signing secret · `PADDLE_API_BASE` = `https://api.paddle.com`

Then in each dashboard flip **Test → Live**, add the live webhook endpoint (your Vercel `/api/webhook`), redeploy.
> Honest: pick ONE processor per surface to avoid double-charging confusion. Ratify `pricing.json` first so the Price IDs match.

---

## 3. DNS — the broken domains · ~3 min
Found in the estate: **proofof.ai**, **cobolbridge.ai** (no site), **iokfarm.com** (down). *(Tell me the 4th if there is one — the reports say "4 broken"; I could only confirm these 3.)*
At your registrar / Vercel Domains:
- **proofof.ai** → the Vercel re-alias: in Vercel → the proofof project → Domains → add `proofof.ai`, then set the registrar's `A`/`CNAME` to Vercel (`76.76.21.21` A, or `cname.vercel-dns.com` CNAME).
- **cobolbridge.ai** → point to the cobolbridge landing (you have `cobolbridge-landing.html`) — deploy it, add the domain, same A/CNAME.
- **iokfarm.com** → confirm intent (retire or restore); if restore, same pattern.
> Exact record per domain: `A @ 76.76.21.21` + `CNAME www cname.vercel-dns.com` (Vercel's standard).

---

## 4. GPU accounts — sign in once, then I drive · ~2 min
Just **sign into** each in Browser 1 (I can't create accounts, but I CAN drive runs on your authed session):
- **kaggle.com** (T4×2, 30 GPU-hr/week) → then I submit `kaggle kernels push` runs
- **lightning.ai** (~22 GPU-hr/mo) → then I drive Studio runs
- **studiolab.sagemaker.aws** (T4, 4-hr free sessions) → then I drive notebooks
> Once you're logged in, the free-GPU bridge rotates them (~125 hr/wk) and I keep the OWEM growing. Colab you're already signed into (training now).

---

## 5. Smithery key rotation · ~1 min
- **smithery.ai** → account → API keys → **revoke** the old (redacted in repo, still in git history), **generate** new → store in Keystone.
> This is the one live exposed secret; rotating it makes the leaked one useless.

---

## What flips the moment you're done
- GitHub write → the L1 merge + every lane's bundle land directly.
- Pricing ratified + Stripe/Paddle live → the first honest **e2e sale test** can run.
- GPU sign-ins → the free-GPU rotation keeps SOV33 growing without you babysitting Colab.

**Fastest path: do #1 first (1 min) — it's the domino.** Everything else can follow at your pace.
