# MEOK Launch Playbook — 30-day roll-out to Article 50 cliff (2 Aug 2026)

## Goal
Drive 10k qualified visitors + 100 paying customers by 2 Aug 2026 (53 days from 13 Jun 2026).
At average ticket £299 (mix of £29 + £199 + £999 + £1499), 100 customers = ~£30k MRR.

## Day 0-7: Foundation (do these first)
- [ ] Submit HN Show HN (draft at /tmp/hn_post_article_50.md)
- [ ] Submit Reddit r/MCPservers (draft at /tmp/reddit_post_mcpservers.md)
- [ ] Submit IndieHackers post (draft at /tmp/indiehackers_post.md)
- [ ] Submit Product Hunt launch (draft at /tmp/product_hunt_post.md)
- [ ] Submit 5 EAT entries (OWASP, NIST AI RMF, IAPP, ENISA, CSA — drafts in /tmp/)
- [ ] Submit to 9 MCP registries (modelcontextprotocol, mcp.so, glama, smithery, etc.)
- [ ] Submit to 5+ awesome-mcp-servers lists
- [ ] Submit Anthropic MCP directory (via partners contact)

## Day 8-14: Distribution amplification
- [ ] Daily LinkedIn post (founder story)
- [ ] Daily X (Twitter) thread (compliance insight)
- [ ] Weekly blog post (regulatory deep-dive)
- [ ] Pitch to 10 AI newsletters (TLDR AI, Ben's Bites, The Rundown AI, Import AI, etc.)
- [ ] Pitch to 5 podcasts (Latent Space, The AI Podcast, Practical AI)

## Day 15-30: Conversion optimization
- [ ] A/B test pricing on /pricing
- [ ] Add live chat (Intercom / Crisp) to high-traffic pages
- [ ] Email capture on all dist/ pages
- [ ] Drip campaign (Day 1 / Day 3 / Day 7) for new signups
- [ ] Customer success stories (3-5 case studies from first customers)
- [ ] ROI calculator: "How much will non-compliance cost you?"
- [ ] Live demo / webinar series (weekly)

## Day 30-53: Urgency push
- [ ] Countdown timer on /article-50-kit ("53 days to cliff")
- [ ] Email blast: "53 days, 30 days, 14 days, 7 days, 1 day"
- [ ] LinkedIn ads: target EU AI Act compliance officers
- [ ] X ads: target CISOs in EU financial services
- [ ] Last-call pricing: 24h flash sale 2 days before cliff
- [ ] Press release: "MEOK ships Article 50 Kit 48h before cliff"

## KPIs to track
- Daily: Stripe MRR, new signups, page views on /article-50-kit
- Weekly: PyPI downloads, GitHub stars, MCP registry ranking
- Monthly: Customer count, churn, NPS

## Daily 15-min check (cron `poll-stripe-revenue`)
1. New charges?
2. meok.ai health (all 9 critical paths 200)
3. All 8 Stripe URLs 200

## Weekly 1-hr check
1. Run /Users/nicholas/clawd/meok.ai/_ops/pre_realias_check.sh on latest deploy
2. If Vercel WAF has cleared: re-alias + POST the 76-URL IndexNow batch
3. Check EAT submission status (OWASP, NIST, IAPP, ENISA, CSA)
4. Check MCP registry (299/300 → 300/300)
5. Re-ping IndieHackers + Reddit + Product Hunt

## Monthly
1. Full fleet audit (which MCPs need updates)
2. Pricing review (competitor benchmarks)
3. Customer interviews (5-10 calls)
4. Roadmap reset (next 30 days)
