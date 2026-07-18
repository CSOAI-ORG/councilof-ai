# ☀️ Morning Unlockers — do these first thing, ~15 min total → revenue can flow

Nick, you said you'll do all unlockers first thing. Here they are in exact order, each a few clicks. These are the ONLY things between "£0" and "money can flow" — everything else is built.

---

## 🔴 UNLOCKER 1 — Make the verifier live (THE blocker, ~5 min)
**Why:** every cold email + every of.ai page says "your auditor verifies at a public URL." That URL (proofof.ai) has no SSL cert → it's dead → you CANNOT send outreach until it resolves.

**Do this (Vercel dashboard):**
1. vercel.com → log in → find the **meok-attestation-api** project.
2. Settings → **Deployment Protection** → set to **Disabled** (or Standard Protection OFF for production). Save.
3. Find the **proofof.ai** domain (Settings → Domains on whichever project owns it). If it shows "Invalid Configuration" / no cert → click **Refresh / Verify**. If it's attached to the wrong project, move it to meok-attestation-api.
4. Wait ~2 min, then visit **https://proofof.ai** in a browser. Green padlock + page loads = ✅ done.

**Test it worked:** `curl -sI https://proofof.ai | head -1` should show `HTTP/2 200`.

---

## 🔴 UNLOCKER 2 — Send the outreach (the traffic, ~5 min to start)
**Why:** live shop, zero footfall. The emails are written + legally correct (€15M not €35M). Once Unlocker 1 is green, send.

**Do this:**
1. Open `~/clawd/revenue/COLD_EMAILS_V3_INDUSTRY_VOICE.md`.
2. Send the **first 3** (Beamery, Tractable, Multiverse) from **nicholas@csoai.org** — max 3/day to avoid spam flags.
3. The £5k and £79 links in them are now SPLIT (see new links below) — paste the right one per offer.
4. Log sends in `~/clawd/revenue/_outreach_log.csv`.

---

## 🟠 UNLOCKER 3 — Post Show HN (the spike, ~3 min)
**Why:** brew install meokclaw is LIVE + smoke-tested. HN is free distribution.
**Do this:** open `~/clawd/revenue/SHOW_HN_READY_2026-05-29.md`, post **Angle A (TUI)** to news.ycombinator.com/submit. Best window: **Tue–Thu 8am ET (1pm UK)**. Post the first comment within 60s. Reply to everything for 2 hours.

---

## 🟢 UNLOCKER 4 — One number for the facility (10 sec)
Reply to Claude with your **target trout tonnage/year** (e.g. "25t" or "50t"). It unlocks the Phase-1 facility BOM + supplier brief.

---

## ✅ Already done for you (no action needed)
- **Stripe links SPLIT** (no more shared-checkout leak):
  - **48h Assessment £5,000** → https://buy.stripe.com/00w14p2G0aEGbEx7ew8k914
  - **Compliance Pro £79/mo** → https://buy.stripe.com/4gMfZja8seUWbEx1Uc8k915
- All sales pages + checkouts verified resolving (no dead links).
- Playbook tactics (your 6 growth patterns) ingested to SOV3.
- Research corpus + white papers in SOV3; docs truth-aligned + entity-fixed.

---

## The honest scoreboard
- **Plumbing:** ✅ done (pages live, checkouts work, links split)
- **Blocker:** 🔴 verifier (Unlocker 1) — 5 min, yours
- **Traffic:** 🔴 send emails + post HN (Unlockers 2-3) — 8 min, yours
- **Then:** money *can* flow. First £79 sub or £5k assessment = the first real signal.

Do 1→2→3 in order tomorrow morning and the shop has its first footfall. That's the EAT. 💰
