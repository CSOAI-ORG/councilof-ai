# UK Trade-Vertical SaaS Portfolio Dossier
**Generated:** 2026-05-20 · brutal honesty over optimism

## TL;DR — Kill 2 of 4

| Site | Verdict | Action |
|---|---|---|
| **haulage.app** | KEEP | Reframe as content + compliance hub + MCP funnel (not booking platform). £79/mo = MCP attestation bundle. |
| **muckaway.ai** | KEEP | Best B2C bet — least crowded, real differentiator (photo-EWC), high ticket (£200-400). |
| **grabhire.ai** | FOLD INTO muckaway.ai | Same operators, same compliance, same booking flow. Redirect to muckaway.ai/grab. |
| **planthire.ai** | PARK as MCP signup only | Don't compete with inspHire (15-year head start). Keep domain, sell `planthire-ai-mcp` £29/mo only. |

## 🚨 BRAND-IDENTITY EMERGENCY

The 3 React PWA sites (muckaway/grabhire/planthire) have **`<meta name="author" content="LoopFactory AI Ltd">`** + "RLMAI Ecosystem" branding embedded in structured data. A trust-bar widget was bolted on later but the underlying brand identity is **LoopFactory**, not MEOK.

**Decision needed today:**
- (A) Absorb fully under MEOK → rebuild brand assets, update meta, kill LoopFactory references
- (B) Keep LoopFactory as a holding-co brand if there's a legitimate reason (tax, prior agreement)

Without this decision, marketing message is incoherent.

## Market Sizing (UK only)

| Vertical | TAM | Realistic ARPU | Reachable SAM Y1 |
|---|---|---|---|
| Haulage | 73,500 O-Licence operators, £180m/yr software spend | £75/mo blended | 1,500-2,200 firms shopping |
| Muckaway | 4,300 waste-carrier firms, £1.4bn market | £60/mo SaaS | 420 viable |
| Grab hire | 1,400-1,700 operators (subset of muckaway) | £90-200/mo (take rate) | 60 customers @ £50/mo = £3k MRR |
| Plant hire | 2,900 firms + 78,000 sole traders | £99/mo (high CAC) | 200 switch-window |

**Aggregate 3-yr horizon optimistic:** ~£600k ARR. **Honest "ship and grind":** £150-200k.

## Competitor Reality

| Vertical | Incumbents | MEOK Gap |
|---|---|---|
| Haulage | Tachomaster, FleetCheck, Tachosys (10-15 yr entrenched) | **None on raw compliance.** Real angle: MCP-as-product for hauliers' AI tools (£29-79/mo dev tool, not fleet platform) |
| Muckaway | AMCS (£600-2k/mo enterprise), Skip Hire Network, Smartwaste | Combined "EWC code generator + Section 34 transfer note + booking" @ £49/mo for sub-5-truck operators |
| Grab hire | Skip-Hire-UK, Find-A-Skip (paid leads £15-40) | Transparency — instant quote tool. UX has been tried + abandoned (local-knowledge AI gap) |
| Plant hire | inspHire, MCS Rental, Plant-Hire-UK, PlantWorx | Honestly small gap. Most competitive of the four. |

## Product Differentiation — Honest

**Mostly positioning, not product. One real exception: MCP back-end.**

1. Conversational booking — table stakes by Q3 2026
2. **MCP-server back-end** — genuinely different, no incumbent ships this. But buyer doesn't care unless they use Claude/ChatGPT for back-office
3. Waste classification from photos (muckaway.ai claims) — verify if it actually works
4. Cross-vertical compliance graph — real gap but "shallow on 4 things" usually loses to "deep on 1"

**The MCP angle is the only durable differentiator.**

## 30-Day Action Plans (per kept vertical)

### haulage.app
1. Outbound 100 fleets in London + M25 via LinkedIn DMs (6 hr, expect 2-3 demos, 1 conv)
2. Build actual compliance dashboard behind £79 button (8-12 hr dev)
3. Microsoft for Startups / NatWest Accelerator application (4 hr)
4. 3 LinkedIn long-form posts on tachograph fines / DVS Phase 3 2026 (£0)
5. Cold-CALL 20 owner-driver hauliers re: FORS prep (5 hr — phone, not email)

### muckaway.ai
1. Verify + ship the photo-EWC feature (depends on LoopFactory code being real)
2. Plug into Skip-Hire-Network as referral partner for transfer notes (2 hr)
3. Free Section 34 transfer note generator → email capture → upsell (4 hr)
4. Local SEO: programmatic pages for 30 London boroughs "skip hire <postcode>" (6 hr)
5. B2C Google Ads £200 test on "muck away near me" (£200, 1-2 conversions)

## Pricing — recommended

**Tiered SaaS with optional booking fee:**
- Free: 5 quotes/month, 1 user, no compliance docs
- **£49/mo Starter:** 50 quotes, basic compliance pack, 1 vertical only
- **£149/mo Pro:** unlimited quotes, all verticals, white-label, MCP access
- Optional **5% booking fee** for jobs booked through platform (opt-in)

Marketplace (% only) is wrong — operators bypass and book direct. SaaS is right because compliance/MCP value is software-shaped.

## MCP Cross-Sell — the actual strategic asset

The funnel:

```
haulage.app (free user)
  → free compliance check
  → hits paywall on 6th query
  → "Powered by haulage-uk-compliance-mcp — install in your AI tools £29/mo"
  → upsells to MCP subscription
  → upsells to MEOK Compliance Trinity bundle £79/mo
```

**Concrete mechanics needed:**
1. Every vertical site: "Use this in Claude/Cursor" CTA → PyPI MCP
2. Attestation upsell: £49 booking SaaS customer → £29 signed compliance attestation
3. One Stripe customer record across both products (acct_1TLlEKQvIueK5Xpb)
4. B2B handoff: contractor books grab → operator gets prompted "automate via muckaway-ai-mcp"

**Honest read:** marketplace sites are loss-leaders / lead-funnels for MCP subscriptions, NOT standalone businesses. Reframe internally that way and the strategy gets cleaner.

## What "kill" means operationally

- Don't delete Vercel projects (£0 cost)
- Stop investing dev time
- Redirect canonical traffic
- Sunset email/support obligations
- Keep MCP servers shipping under MEOK

## Final read

You have:
- 4 domains
- 2 different brand identities (MEOK + LoopFactory) baked in
- No Stripe products configured for any
- No paying customers
- Working MCP IP that's the actual differentiator (invisible in current UIs)

**Next 30 days:**
1. Decide LoopFactory status TODAY
2. Pick 2 of 4 (muckaway + haulage)
3. Wire Stripe £49/£149 on both kept verticals
4. Cold outbound: 100 LinkedIn DMs + 20 phone calls
5. First paying customer is a phone call, not a form fill

**The MCP cross-sell is your strongest card and it's nearly invisible. Fix that first.**
