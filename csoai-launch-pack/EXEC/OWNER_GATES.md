# CSOAI — OWNER GATES (one-page card)

**Date:** 2026-07-08 · **Path:** owner-unlock revenue (per EAT directive 2026-07-02)

Everything else is autonomous. Everything below needs Nick's hands.

---

## A. Fire the Vercel deploys (90 sec)
Unblocks: tabs live + API scoring fix.

```bash
cd /Users/nicholas/clawd/csoai-org-v2 && PATH="$HOME/.local/node/bin:$PATH" vercel --prod --yes
cd /Users/nicholas/clawd/csoai-static-deploy2 && PATH="$HOME/.local/node/bin:$PATH" vercel --prod --yes
```

Then verify (1 min, 6 curls — see `csoai-launch-pack/EXEC/DEPLOY_README.md`).

---

## B. Stripe live flip (5 min)
Unblocks: every £999 / £4,950 sale.

Per `/Users/nicholas/clawd/csoai-launch-pack/01-stripe-999-packet.md`:

1. Stripe Dashboard → View test data → **OFF** (live)
2. Products → Add → name `DEFONEOS Signed Assurance Starter`, price `£999`, One-off
3. Payment Links → New → enable card + collect name+email+company
4. Copy the `https://buy.stripe.com/…` link
5. ~~(Already done by sibling Hermes: `/api/signup` wired to live Stripe URL per Jul 8 board entry — confirm dashboard)~~

The send-email is in `01-stripe-999-packet.md` (~200 words, copy-paste).

---

## C. First outreach email (10 min)
Unblocks: first demo booking.

Pick first contact from `EXEC/OUTREACH_FIRST_3.md` (lands in current subagent run — should be present).

Three templates ready in `csoai-launch-pack/outreach/`:
- `email_soc_analyst.txt` — JADEPUFFER/TeamPCP angle for Sarah persona
- `email_dpo.txt` — EU AI Act 28-day countdown for Marcus persona
- `email_ai_founder.txt` — Series A pitch deck shortcut for James persona

---

## D. (Optional) First VC intro (20 min)
Unblocks: Series A pipeline.

Per `EXEC/WARM_LEADS_VC.md`, top 3 targets:
- LocalGlobe — Saul Klein — online application form
- Plural — Ian Hogarth — online application form
- IQ Capital — Max Bautomi + Kerry Baldwin — iqcapital.vc team page

---

## E. (Optional) Modal GPU auth (10 min, not blocking D2-4)
Unblocks: threat/dependency NN retraining.

```bash
cd /Users/nicholas/clawd && modal setup
# browser-based OAuth; needed before Day 4 if we want to retrain NNs
```

---

## F. (Optional) First closed-won customer (after Gate B+C)

When the first £999 sale lands:
1. Mark the contact in `WARM_LEADS_BUYER.md`
2. Add row to `EXEC/MRR_TRACKER.md` (today's MRR > 0!)
3. Run `./EXEC/daily-metrics.sh` for the baseline
4. Use the gap-analysis template (`csoai-launch-pack/02-gap-analysis-4950-onepager.md`) for the £4,950 upsell
5. Book the 7-day review per `EXEC/STATUS_REPORT.md` plan

---

## Time-budget reality

- **Tonight (10 min):** Gates A + C → first demo booked
- **Tomorrow (5 min):** Gate B → revenue path open
- **This week (1 hr total):** Gates D + E + first close

The plan was always staged so each gate is <10 minutes.

---

## Status as of Phase 535

- ✅ 528-534 done (commit chain through `66df6d87`)
- ✅ Sibling Hermes did Phases 1-6 of THE DAY OF REAL PROGRESS (board entry Jul 8 ~06:00) — defoneos-seriesa fix + Stripe wired + 10 pages + 7 endpoints
- 🔄 Phases 537-540 (subagent running)
- 🔧 Phase 541 (feedback form — done, deploying)
- 🔧 Phase 543 (this card — done)
- ⏳ Phase 544-549 — TBD; depends on owner firing Gates A-D

---

**SIGIL:** OWNER-GATES-CARD · 2026-07-08 · Ed25519