# 5 Cold-Email Drafts — Paste-Ready

**Send channel: BRANDED EMAIL — `nicholas@csoai.org` (MEOK AI Labs / CSOAI LTD, CH 16939677). NOT Gmail.** Use either (a) **Mail.app** with the csoai.org mailbox (one-off / small batches), or (b) **`hive-mailer`** (auto-fires 25/day from `hello@mail.meok.ai` once DNS lands; reply-to = `nicholas@csoai.org`), or (c) **n8n** (cleaner for large personalised merges — n8n mailer is the proven reliable channel per the OFFER_EMAIL_LAUNCH50.md notes). The "Gmail" line above is deprecated and wrong — branded email is the rule.

Just update `[bracketed]` placeholders + the `To:` recipient, then send from `nicholas@csoai.org`.

---

## #1 — Transport consultancy (DVSA-OCRS-focused)

**To:** [consultancy partner@theirfirm.com]
**Subject:** DVSA OCRS forecast tool — signed evidence, 25% rev-share for partner consultancies

Hi [First name],

Saw [consultancy name] handles DVSA O-licence + Public Inquiry briefs for [region/sector] operators — wanted to share something your clients might find useful.

We've just shipped `meok-tacho-audit-mcp` on PyPI. It does one specific thing: forecasts a fleet's DVSA OCRS score 90 days out and gives a "weeks-to-RED" estimate, signed with HMAC-SHA256 so the forecast holds up as audit evidence.

Free to try (`pip install meok-tacho-audit-mcp`), public verifier endpoint at meok-attestation-api.vercel.app/verify so your clients can prove the forecast chain to a regulator without installing anything.

If you'd find it useful for client work, I'm running a 25% lifetime rev-share for transport-consultancy partners — details at haulage.app/partners.

Happy to set up a 15-min call if it'd be quicker than email.

Cheers,
Nick

Nicholas Templeman
MEOK AI Labs / CSOAI LTD (Companies House 16939677)
nicholas@meok.ai · https://haulage.app
LAUNCH50 = 50% off first 6 months for any operator you refer

---

## #2 — FORS auditor

**To:** [auditor@theirfirm.com]
**Subject:** FORS Bronze→Gold dossier auto-generator + 25% lifetime rev-share

Hi [First name],

You audit FORS Bronze→Silver→Gold for [client base] — figured this'd be relevant.

We just shipped `meok-fors-clocs-mcp` + `meok-haulage-governance-bridge-mcp`. Two specific moves:

1. Auto-generates the FORS dossier (Bronze + Silver + Gold) from the operator's tacho + drivers' hours data — signed, HMAC-chain verifiable, holds in front of FORS auditors as evidence.
2. The governance bridge maps every signed compliance check to EU AI Act + UK AI Bill + NIST AI RMF + ISO 42001 — handy when a client's bigger procurement asks for AI-conformity sign-off.

Public verifier endpoint at meok-attestation-api.vercel.app/verify — you verify the operator's chain from your own machine, no install.

Partner program at haulage.app/partners pays 25% lifetime rev-share for auditor referrals. Co-branded signed evidence reports if you want them.

Happy to walk through a sample dossier on a quick call.

Cheers,
Nick

---

## #3 — UK fleet operator (mid-market, 25-100 trucks)

**To:** [transport.manager@theirfleet.com]
**Subject:** Smart Tachograph 2 deadline (Jul 2026) — free OCRS 90-day scan

Hi [First name],

[Company] runs [N] trucks across [region]. Quick heads-up if it's not already on your radar — Smart Tachograph 2 retrofit deadline is July 2026 for any vehicle doing international/cabotage work.

We've just shipped `meok-tacho-audit-mcp` — checks your current tacho readiness, forecasts your DVSA OCRS 90 days out, and gives you "weeks-to-RED" estimates for any vehicle drifting toward Public Inquiry territory. Every output is HMAC-signed so it stands up to a DVSA audit.

Two things you might find immediately useful:
- 1 vehicle scan free (no card needed)
- Full fleet for £79/mo Pro tier — first 10 customers get 50% off 6 months with code **LAUNCH50**

5-min install: https://haulage.app/docs/quickstart

If easier, I can drop you a Loom showing the OCRS forecast on a sample fleet your size.

Cheers,
Nick

---

## #4 — Crane / hiab operator

**To:** [ops.director@theirfirm.com]
**Subject:** Avoid Baldwins-style £951k claim — BS 7121 lift plans signed in 12 min

Hi [First name],

[Company] runs [N] cranes/hiabs in [region]. The Baldwins case (£951k damages on a misclassified Hire vs Contract Lift) hopefully isn't keeping you up at night — but the CPA Hire vs Contract Lift triage trips up even sharp ops directors.

Two MCPs we've just shipped that solve this:

- `meok-bs7121-mcp` — full lift plan compliance, appointed-person signoff, LOLER scheduling, signed evidence.
- `meok-cpa-contract-lift-mcp` — auto-triage of every hire request: Hire (you keep insurance burden) vs Contract Lift (operator's). Generates the CPA T&C bundle either way, signed.

Lift plan turnaround drops from ~90 min to ~12 min per job in pilot operators. Free trial, £79/mo Pro tier (50% off 6 months with **LAUNCH50**).

5-min install: https://haulage.app/docs/quickstart

Happy to walk through the Baldwins-style avoidance flow if useful.

Cheers,
Nick

---

## #5 — Cold-chain pharma operator

**To:** [compliance.head@theirpharma.com]
**Subject:** GDP signed evidence chain — MHRA verifies without installing anything

Hi [First name],

[Company] does pharma GDP cold-chain in [region]. Temperature excursions + qualified-person sign-offs + audit-trail integrity — the part that always feels like 80% paperwork.

We've just shipped `meok-cold-chain-pharma-mcp` on PyPI. Handles:

- Temp excursion alerts with HMAC-signed evidence (regulator-proof)
- Qualified Person sign-off chain
- Auto-generated audit packs for MHRA WDA(H) inspections
- Bridges to EU AI Act / UK AI Bill if you use AI for route or load optimisation

Public verifier at meok-attestation-api.vercel.app/verify — MHRA inspector verifies the chain from their own laptop without installing anything.

Free to try, £79/mo Pro tier (**LAUNCH50** = 50% off 6 months).

5-min install: https://haulage.app/docs/quickstart

Worth a 15-min call if you'd like to see a sample audit pack.

Cheers,
Nick

---

## Submit-now URLs (one-click open)

| Channel | URL |
|---|---|
| **Show HN submit** | https://news.ycombinator.com/submit |
| **LinkedIn compose** | https://www.linkedin.com/feed/?shareActive=true |
| **wong2/awesome-mcp-servers** | https://github.com/wong2/awesome-mcp-servers |
| **mcp.so submit issue** | https://github.com/chatmcp/mcp.so/issues/new |
| **Anthropic Skills repo** | https://github.com/anthropic/skills |
| **VS Code Marketplace publish** | https://marketplace.visualstudio.com/manage/publishers/ |
| **OpenAI GPT Builder** | https://chat.openai.com/gpts/editor |
| **Slack Marketplace submit** | https://api.slack.com/apps |
| **Microsoft AppSource (Teams)** | https://partner.microsoft.com/dashboard/marketplace |
| **Reddit /r/mcp post** | https://www.reddit.com/r/mcp/submit |
| **Better Stack sign-up** (status page) | https://betterstack.com/users/sign-up |

## What to do FIRST (lowest-friction wins)

1. **mcp.so issues** (7 issues × 2 min = 14 min) — fastest catalogue exposure
2. **wong2 PR** (15 min) — first social proof
3. **LinkedIn launch post** (5 min) — your network's the warmest channel
4. **Show HN** — wait for Tue/Wed 9am PT (5pm UK) for peak
5. **5 cold emails staggered** — 1-2 per day this week to avoid spam triage
