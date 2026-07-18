# LinkedIn Week 1 — MEOK AI Labs Thought Leadership Cadence

Target: 5 posts, Tue–Sat mornings (9am UK).  
Rule (per 2026 LinkedIn playbook): **no link in post body — link in first comment, 60% reach penalty otherwise.**  
Voice: direct, specific numbers, one punchy hook, short paragraphs, proof in a closing line.

---

## Post 1 — Tuesday 9am UK
**Topic:** EU AI Act deadline urgency (the hook post)

```
103 days.

That's how long until EU AI Act enforcement starts.

2 November 2026 — penalties up to €35 million or 7% of global turnover.

Most AI teams I talk to think "compliance" is a Q2-2026 problem.

It's not.

Article 11 alone requires 14 separate technical documentation fields. Article 10 needs bias testing across every protected characteristic. Article 43 conformity assessments take 12-16 weeks.

If you're shipping AI to EU users and you haven't started your risk classification, you're already behind.

I spent 6 months building 212 MCP servers to automate all of this for AI agents. The free risk-classification tool runs in under 3 seconds.

Link in first comment.
```

**Comment:** `pip install eu-ai-act-compliance-mcp — free risk classifier. Or book the 48-hour written assessment: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 2 — Wednesday 9am UK
**Topic:** DORA teardown (Article 18 incident classification, the technical depth post)

```
DORA Article 18 is the reason most EU banks are panicking right now.

It says you have 4 hours to notify your competent authority about a "major ICT incident."

72 hours for an intermediate report.
1 month for the final.

But what counts as "major"?

Commission Delegated Regulation (EU) 2024/1772 spells it out:
— 100,000+ customers affected
— 24+ hours duration (or 2h+ if critical function)
— €100k+ economic impact
— Data confidentiality breach
— Cross-border impact

Miss ANY of those thresholds in your detection logic, and you've breached before the breach even happened.

I built a classifier that takes an incident description and returns the 4h/72h/1-month clock with deadline timestamps. Open source. Free tier 10/day.

Built for Claude, Cursor, Cline — agents that actually act on this.

Link in first comment.
```

**Comment:** `pip install dora-compliance-mcp. Or the 48h DORA gap assessment: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 3 — Thursday 9am UK
**Topic:** Why MCP matters for compliance (the category-creation post)

```
Compliance tools always end up needing to touch your private data.

That's a problem.

Your AI system descriptions, training datasets, incident logs — these are the most sensitive artefacts in your business. Sending them to a third-party compliance SaaS creates a bigger compliance problem than the one it solves.

MCP (Model Context Protocol) fixes this.

Instead of uploading your data to a vendor, you install the MCP server locally. Your Claude / ChatGPT / Cursor agent calls the tools. Your data never leaves your machine.

I've shipped 215 MCP servers for governance and compliance:
— EU AI Act
— DORA
— NIS2
— CRA
— GDPR
— HIPAA
— SOC 2
— ISO 42001
— NIST AI RMF
— CSRD

Each one handles a specific regulation. Each one runs locally. Each one is free to try.

The MCP ecosystem has ~15,000 servers. 215 of those are mine. That's a deliberate bet: governance is the wedge.

Link in first comment.
```

**Comment:** `All 215 on PyPI under MEOK AI Labs. Start with pip install eu-ai-act-compliance-mcp — free tier, 10 calls/day.`

---

## Post 4 — Friday 9am UK
**Topic:** NIS2 management-body personal liability (the CEO-on-the-hook post)

```
Your CEO is personally on the hook for NIS2.

Read that again.

NIS2 Article 20 says the management body of an essential or important entity must approve the cybersecurity risk-management measures, oversee their implementation, and can be held "liable for infringements of this Directive."

Some Member States have transposed this as personal fines, temporary prohibition from exercising managerial functions, or both.

~160,000 entities in scope across 18 sectors. Transposition deadline was 17 October 2024. Most states are late — but once the national law lands, the clock starts.

The checklist your CEO now owns:
— Risk analysis + policies (Art 21(2)(a))
— Incident handling (Art 21(2)(b))
— Business continuity (Art 21(2)(c))
— Supply chain security (Art 21(2)(d))
— Vulnerability disclosure (Art 21(2)(e))
— Cyber-hygiene training (Art 21(2)(g))
— Encryption (Art 21(2)(h))
— MFA (Art 21(2)(j))
— 24h early warning → 72h incident notification → 1 month final report (Art 23)

I built an MCP that maps your current controls to the 10 Article 21 measures and flags the gaps.

Link in first comment.
```

**Comment:** `pip install nis2-compliance-mcp. Free tier 10/day. For a 48h NIS2 management-body readiness audit: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 5 — Saturday 9am UK
**Topic:** Open call for consulting partnerships (the money-flowing post)

```
I'm looking for 3 GRC consultancies to pilot a partnership.

You have:
— Clients racing the 2 November 2026 EU AI Act deadline
— Existing compliance engagements that need automation
— A team of 3-20 consultants drowning in article-by-article audits

I have:
— 215 MCP servers that automate the audits
— A signed-attestation system your clients can hand their auditors
— £5,000 flat-rate assessments you can white-label at your own pricing
— Revenue share on every Pro subscription (£199/mo) your clients keep

No exclusivity. No minimum commitment. Your brand on the deliverable.

This is the Vanta-via-Big-4 model, for MCP-era compliance.

Reply here or DM.

(I've built the tools. I need partners with the client lists.)
```

---

## Metrics to watch (Week 1)

- Impressions per post (target: 5k+)
- Comments with "install" or a quote (target: 10+)
- DMs from consultancies (target: 2-5)
- New PyPI installs of flagship MCPs (target: 100+ across all 5)
- Newsletter signups (target: 20)

## Week 2 themes (preview)

- CRA teardown (13 Annex I requirements vs. reality)
- CSRD double materiality — 80% of companies get this wrong
- AI-BOM: what Annex IV actually requires vs what vendors ship
- "I built 215 MCPs in a year. Here's what the market actually pays for."
- Partnership recap / first consultancy signed
