# Product Hunt Launch Plan

## Product name

**MEOK AI Labs**

## Tagline (max 60 chars)

`38 MCPs for EU AI Act / DORA / NIS2 with signed attestations`

## Description (≤260 chars)

`MEOK ships 38 MCP servers for EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001 + cyber/industry compliance. 410 verbatim regulation articles, HMAC-signed attestations your auditor verifies independently. Free tier: 10 calls/day. One install: npx meok-setup.`

## Launch day

Best PH launch days: **Tuesday or Wednesday**. Avoid Monday (oversaturated) + Friday-Sunday (low engagement).

Recommended: **Tuesday at 00:01 PST** (08:01 UTC) — gives 23+ hours of voting before the day ends in user timezone.

## Categories

- Productivity > Developer Tools
- AI > AI Agents
- Productivity > Workflow Automation

## Gallery images (need 5+)

1. **Hero image** — meok.ai homepage screenshot with "38 governance MCPs" headline
2. **CLI demo** — terminal screenshot of `npx meok-setup --pack governance`
3. **Search results** — FTS5 search showing biometric query across EU AI Act + GDPR articles
4. **Attestation cert** — example signed cert with verify URL highlighted
5. **Council storefront** — councilof.ai pricing page
6. **Industry coverage matrix** — visual of 38 MCPs by category

## Launch text

```
Hi Product Hunt 👋

I'm Nick — solo founder of MEOK AI Labs in London. After watching too many compliance teams juggle PDF binders for EU AI Act prep, I shipped a different approach:

🛡️ **38 MCP servers** covering every major AI governance regime — EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001, FDA SaMD, MDR, Basel III, MiFID II, MiCA, COPPA, MITRE ATT&CK/ATLAS, SLSA, Sigstore, and more.

📚 **410 verbatim articles** from EUR-Lex Cellar API in SQLite FTS5. No LLM hallucinations on citations — every quote is auditor-defensible.

🔐 **HMAC-signed attestations** — every Pro audit produces a certificate your auditor can verify at a public URL without ever contacting MEOK.

⚡ **One CLI install** — `npx meok-setup --pack governance` writes Claude Desktop / Cursor / Windsurf configs for the whole pack in seconds.

🆓 **Free tier**: 10 calls/day per MCP, no API key needed
💼 **Pro**: £79/mo, unlimited + signed attestations
🏢 **Enterprise**: £1,499/mo, white-label + on-premise

Built solo over 3 weeks. Daily EUR-Lex sync runs in GitHub Actions. All MCPs are MIT-licensed and the whole stack is auditable.

What I'd love help with:
- Compliance teams: try a Pro tier free for 30 days, tell me what's missing
- AI agent builders: which governance MCPs should I prioritize next?
- Auditors: does the verify URL approach actually clear your "fabricated artifact" objection?

Pricing + signup → meok.ai
Catalogue → councilof.ai
Direct → hello@meok.ai

Thanks for taking a look!
— Nick
```

## Maker comment (first comment by Nick)

```
A few things I want to flag for context:

1. Why MCP specifically? Because the AI agent drafting your Annex IV doc needs runtime access to the compliance toolset. REST works for dashboards but agents need MCP. I built both — there's a hosted endpoint at meok-attestation-api too.

2. The verbatim text architecture is the moat. Most "AI compliance" tools summarize regulation text with an LLM at query time. That's where citations break. I run EUR-Lex's canonical SPARQL endpoint daily, parse Akoma Ntoso XHTML, and store in FTS5. The LLM never sees the regulation — only the user does.

3. Pricing reflects a deliberate choice: compliance teams already spend £40k+ per audit cycle. £79/mo for unlimited tooling that automates 30-40% of that work is a clear yes. We don't want to compete with "free tier infinite" tools — we want to be the tool you happily pay for because it removes a real pain.

4. Roadmap publicly: FedRAMP, ISO 27701, CIS Controls, Slack ChatOps integration, white-label Trust Centers, Notified Body partnership.

5. Solo founder + bootstrapped. I'll be reading every comment today. AMA.
```

## Hunter requests

Reach out to:
- Sahil Lavingia (Gumroad)
- Andrew Wilkinson (Tiny / Tiny Capital)
- Anyone in compliance/RegTech space with PH presence

DM ahead of launch day to give them context — most hunters won't hunt unsolicited products from non-mutuals.

## Pre-launch checklist

T-7 days:
- [ ] Confirm hunter (or self-hunt)
- [ ] All gallery images uploaded
- [ ] meok.ai homepage tested cross-device
- [ ] Stripe live + tested
- [ ] Coupon code created: `PRODUCTHUNT20` for 20% off first 3 months

T-3 days:
- [ ] Email existing subscribers + customers: "I'm launching on PH Tuesday, would mean a lot if you upvoted"
- [ ] Set up tracking link to know which traffic came from PH
- [ ] Schedule Tweetstorm to fire at 08:01 UTC

T-1 day:
- [ ] Final check on all CTAs
- [ ] DM 10-20 friends asking for first-hour upvote (PH algorithm weights first hour heavily)

Launch day:
- [ ] 00:01 PST: maker comment lands
- [ ] Tweetstorm fires
- [ ] Personal LinkedIn post
- [ ] Reply to every PH comment within 30 min
- [ ] Cross-post to r/SideProject, r/SaaS, r/EntrepreneurRideAlong, IndieHackers
- [ ] If trending, post update at 6h and 12h marks

## Success metrics

- Top 5 of the day = good
- Top 3 = great + featured in PH newsletter (10-20k impressions)
- #1 = excellent + featured in weekly digest + Maker badge

Realistic goal: top 10. Stretch: top 5.
