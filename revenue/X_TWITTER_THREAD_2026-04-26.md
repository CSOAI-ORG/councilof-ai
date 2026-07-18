# X/Twitter thread — Show HN companion

**Why a thread:** Show HN brings developer audience. X/Twitter brings the EU compliance + AI policy crowd (different overlap). Post AFTER Show HN goes live so you can cross-link.

**Best window:** Tuesday-Thursday 14:00-17:00 UTC (compliance crowd in EU)
**Post AS:** @CSOAI_Org or @nicholastempleman (whichever is your active account)

---

## The thread (10 tweets)

### Tweet 1 (the hook)

> Most EU AI Act compliance tooling costs £30K-£200K/yr, locks evidence in proprietary formats, and doesn't cover the post-Omnibus delays.
> 
> I've spent 6 months building the open-source alternative.
> 
> 234 MCP servers. 18 EU regulatory frameworks. All MIT.
> 
> Here's what I learned 👇

### Tweet 2 (the diagnosis)

> The compliance industry runs on PDFs, screenshots, and Word docs.
> 
> When a regulator asks "how do we know this isn't a fabricated post-hoc artifact?" — the answer today is "trust us."
> 
> That answer doesn't scale. And it's why the audit-prep cycle is so painful.

### Tweet 3 (the wedge)

> So every MEOK MCP signs its output with HMAC-SHA256 against a public attestation API.
> 
> Output a DPIA → get a verification URL.
> 
> Anyone (auditor, regulator, internal committee) can curl that URL and cryptographically confirm the doc hasn't been tampered with.
> 
> meok-attestation-api.vercel.app/health

### Tweet 4 (the flagships)

> The 5 flagships hit the nearest EU cliff dates:
> 
> • meok-omnibus-tracker (8 cliff dates post-Omnibus delays)
> • meok-watermark-attest (Article 50, Nov 2026)
> • meok-cra-annex-iv-classifier (EU CRA)
> • meok-nis2-de-register (Germany NIS2 BSI)
> • meok-mcp-injection-scan (April 2026 RCE class)

### Tweet 5 (the workflow)

> The unlock isn't the MCPs. It's that compliance review now lives inside an AI agent loop.
> 
> Auditor opens Claude Code, says "check this Python service against EU AI Act Article 6"
> 
> The MCP runs the classifier, emits a signed attestation, hands it back.
> 
> 6 weeks → 2 days.

### Tweet 6 (the case study link)

> I wrote up an anonymised case study showing how a German Mittelstand HR-tech firm compressed their AI Act audit dry-run from 230 hours of consultant time to 14 hours of agent time.
> 
> [link to meok.ai/case-study or the markdown file]

### Tweet 7 (the post-Omnibus reality check)

> One thing most teams I talk to get wrong:
> 
> EU AI Act high-risk DELAYED to Dec 2027 (Annex I) / Aug 2028 (Annex III)
> 
> But Article 50 transparency / watermarking is STILL on time. Nov 2026.
> 
> Don't sleep on the cliff that didn't move.

### Tweet 8 (the open-source pricing)

> Pricing model:
> 
> • Free forever — full MCP fleet, public attestation API
> • £29 Starter — for solo founders
> • £79 Pro — your own signing keys
> • £1,499 Enterprise — multi-product orgs needing audit-grade BU separation
> 
> Free covers what most teams actually need.

### Tweet 9 (the ask)

> Trying to figure out:
> 
> 1. Is "MCP server with signed compliance output" a real category, or am I overfitting to my own workflow?
> 
> 2. Has anyone here actually used a compliance MCP in a real audit? Curious about failure modes.
> 
> Reply / DM. Genuine interest > likes.

### Tweet 10 (the close + links)

> 🔗 Repos: github.com/CSOAI-ORG
> 🔗 PyPI: pypi.org/search/?q=meok
> 🔗 Verifier: meok-verify.vercel.app
> 🔗 EU AI Act pillar: meok-eu-ai-act.vercel.app
> 
> Built solo from a UK farm. £0 ARR today. Trying to build a real revenue floor without selling out.
> 
> 👋

---

## Engagement plan

**First 30 min:**
- Reply to your own thread with a link to the Show HN post (cross-pollinate audiences)
- Tag 3-5 EU AI policy people you respect (no more — looks spammy)
- Pin to profile

**First 4 hours:**
- Reply to every comment with substance (not "thanks!")
- If anyone has a real question, write a 200-word reply, not a 1-liner

**24 hours:**
- Quote-tweet the best reply with a follow-up insight
- Post a short video of the workflow if engagement is strong (Loom screen-recording)

**Don't:**
- Spam-tag big accounts (Casey, Simon Willison, etc.) hoping for retweets
- Buy engagement
- Edit-and-repost — just leave the thread as-is and reply with corrections if needed

## What "good" looks like

- 50+ likes on tweet 1 = decent
- 10+ retweets = good
- 5+ DMs from EU compliance people = excellent
- 1 person says "I'd buy the Pro tier" in replies = drop everything and DM them with the case study
