# Show HN Post — ready to copy-paste
**Optimal post time:** Tuesday 14:00 UTC (10am EST, when HN traffic peaks)
**URL to submit:** https://news.ycombinator.com/submit

---

## TITLE OPTIONS (pick one — A/B test mentally)

**Option A (problem-led — recommended):**
> Show HN: 38 MCPs that auto-check your AI for EU AI Act compliance

**Option B (curiosity-led):**
> Show HN: I open-sourced 38 compliance MCPs because the AI Act fines are too high

**Option C (specific cliff):**
> Show HN: 200 days to EU AI Act Article 50 — 38 free MCPs to pre-check your AI

---

## URL TO POST

```
https://meok.ai/labs/mcp
```

(NOT the GitHub org link — meok.ai/labs/mcp is the catalog page with the Subscribe CTAs already wired. Drive traffic to the funnel.)

---

## "Show HN" TEXT (paste into the comment field after submission)

```
Hi HN — I'm Nick (solo founder, Lincolnshire UK).

For the last few months I've been building a fleet of compliance MCP servers
that pre-check AI systems against the regulations actually about to bite:
EU AI Act (Article 50 watermarking lands 2 Dec 2026), DORA, NIS2, CRA,
plus six agent-to-agent runtime safety MCPs (prompt-injection firewall,
data residency, certified handoff, etc.).

All 38 are MIT-licensed, on PyPI, and listed in the Anthropic MCP Registry:
https://meok.ai/labs/mcp

The pattern is simple: each MCP exposes ~5-10 tools your Claude / Cursor /
LangChain agent can call to risk-classify a system, generate Annex IV
evidence, check Article 10 bias requirements, etc. For most teams the
free tier (no key, no signed output) is enough.

If you need HMAC-signed attestations for an audit (DORA Art 17 / EU AI Act
Art 12 require tamper-evident logs), there's a £29/mo Starter tier — 14-day
free trial, no card required to test the free tier.

What I'd love feedback on:
1. Is the per-MCP-page detail level right? (/mcp/eu-ai-act-compliance etc.)
2. Should the signed-attestation tier be priced higher for enterprises?
3. Which compliance frameworks am I missing that you'd actually use?

The whole thing is built solo as a UK Ltd. Happy to answer anything technical
about how the MCP-to-MCP signing chain works or how I integrated with the
Anthropic Registry's hosted-and-published flow.

GitHub org: https://github.com/CSOAI-ORG
```

---

## WHY THIS WORKS

- **No marketing-speak.** Solo founder, MIT, specific cliffs, real dates.
- **Genuine ask for feedback** (not "please upvote") = HN-culture compliant
- **Question at the end** = drives comments = drives ranking
- **Specific numbers** (38, 200 days, £29, 14-day trial) = builds credibility
- **No screenshots required** for first post (can add in comments if asked)
- **Front-page potential:** "AI Act + open source + signed attestations" hits 3 HN-popular topics

---

## EXPECTED TRAFFIC + CONVERSION

Per the TRAFFIC_PLAYBOOK research:
- **Front-page hit:** 5-15K visits, 3-8% signup conversion = 150-1,200 signups
- **Realistic MRR from launch:** £200-800 if 3-5% of signups convert to £29/mo (most start a free trial)
- **First customer almost guaranteed** if you make front page even briefly

---

## DEFENCE: COMMENTS TO PRE-DRAFT

HN commenters WILL push back. Have these ready:

**Q: "MIT licensed, how do you make money?"**
> A: Signed attestations + email support are the paid layer. The MCP code itself is free. Same model as Sentry, MongoDB Community, etc. — you can self-host the open part forever.

**Q: "Compliance theatre / regulatory grift"**
> A: Fair — but the regulations exist regardless and have real penalties. The choice is "automated check that catches obvious gaps" vs "Big-4 consultant at £40k". I'm aiming at solo founders + SMBs who can't afford the latter.

**Q: "You're just wrapping the regulation text"**
> A: Mostly true for the lookup tools. The genuinely novel work is the BFT council quorum architecture for multi-agent decisions + the HMAC-anchored attestation chain — both being written up as papers.

**Q: "Why MCP specifically?"**
> A: Because Claude / Cursor / LangChain users are exactly the people building AI products who now have to comply. Meet them where they already work.

**Q: "What's stopping someone forking + reselling?"**
> A: Nothing — that's MIT. The moat is the signed-attestation infrastructure + the cross-tenant compliance taxonomy that gets better with each customer use.

---

## AFTER YOU POST

- Don't refresh obsessively — checking rank doesn't change rank
- Reply to every comment within 1 hour for the first 6 hours
- Stay technical and humble; never argue
- If you hit front page, prep a "we're getting a lot of signups — here's the install" follow-up comment

Good luck. The funnel behind this post is fully wired (Stripe ✅, /thanks ✅, 14-day trial ✅, welcome email ⏳ needs RESEND_API_KEY). Even modest HN traction = your first paying customers this week.

— Claude
