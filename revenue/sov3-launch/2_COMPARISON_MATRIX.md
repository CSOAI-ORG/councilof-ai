# SOV3 Competitive Comparison — Verifiable Edition
**Prepared for:** Nick Templeman, SOV3 · **Rule:** every cell is checkable, or it doesn't ship.

> **How to use this safely.** Two kinds of claims appear below: (1) **SOV3 capabilities** — your job is to make sure each is actually demoable on launch day, because a buyer will ask. (2) **Competitor cells** — these state only what is **publicly observable** (e.g., "pricing not published on site") with a `verify:` note. Before publishing, open each competitor's live site and confirm the cell, pasting the URL into the footnotes. **Do not** add cells asserting fraud, manipulation, or hidden motives — those were cut for a reason. A comparison that's merely *true and verifiable* is more lethal than one that's aggressive and refutable.

---

## A. The matrix

| Capability | SOV3 | Typical AI-governance incumbent | How a buyer verifies it themselves |
|---|---|---|---|
| **Runtime policy enforcement** (block a non-compliant deployment, not just flag it) | ✅ Core | Rare — most are assess-and-report | Ask the vendor: *"Can you stop a non-compliant AI system from deploying in real time? Show me."* |
| **Transparent public pricing** | ✅ From $99/mo, listed | Usually "Contact sales" | Open their pricing page. Is there a number? |
| **Mid-market entry point (<$10k/yr)** | ✅ | Typically enterprise-first | Ask for an annual quote for a 50-person company |
| **AI-safety practitioner certification** | ✅ Watchdog | Not offered by general governance platforms | Search the vendor site for "certification" |
| **MCP tool governance / security** | ✅ | Emerging, no standard yet | Ask: *"How do you govern MCP servers our agents call?"* |
| **Immutable audit trail** | ✅ | Varies | Ask whether audit logs are tamper-evident |
| **EU AI Act conformity workflow** (Art. 9/11/14 artifacts) | ✅ | Varies — many assess, fewer produce filing-ready docs | Ask for a sample Annex IV technical-documentation export |
| **Self-host / air-gap option** | [confirm before claiming] | Often SaaS-only | Ask if it can run in your VPC |

> Fill SOV3 column only with what you can demo July 4. An unprovable ✅ is worse than an honest "roadmap."

## B. The buyer tool that does the damage *for* you

Ship this as a standalone one-pager — **"10 questions to ask any AI governance vendor."** It names no one. It lets the prospect discover the gap themselves, which is more persuasive and carries zero defamation risk:

1. Can you **stop** a non-compliant AI deployment at runtime, or only report it after?
2. What's your price for a 50-person company? (Can I see it without a sales call?)
3. Can you produce filing-ready EU AI Act Annex IV technical documentation?
4. How do you govern the MCP servers and agent tools we already run?
5. Is your audit trail tamper-evident?
6. How long is implementation — weeks or quarters?
7. Who in our org qualifies as "human oversight" under Art. 14, and do you certify them?
8. Can it run in our own cloud / air-gapped?
9. What happens to our policies and data if we leave?
10. Show me a deployment you *blocked* last month.

The competitor who can't answer #1 and #10 loses the deal — and you never said a word about them.

## C. Sourcing rules (so this survives contact with a journalist)

- **EU AI Act Aug 2, 2026 deadline & penalties** → [artificialintelligenceact.eu/implementation-timeline](https://artificialintelligenceact.eu/implementation-timeline/). Note amendments are in active discussion — phrase as "statutory deadline."
- **MCP scale** → ~10k+ public servers (Anthropic Dec 2025 ecosystem update); ~15.9k repos with `mcp-server` topic on GitHub (May 2026); ~97M monthly SDK downloads. Cite a range, link the source, don't pick the most dramatic number.
- **Competitor pricing/features** → cite the competitor's **own live page**, dated, screenshot archived. If it's not on their public site, the cell says *"not publicly disclosed,"* not a guessed figure.

## D. Explicitly excluded (do not re-add)

- Specific competitor funding figures framed as "fabricated"
- OneTrust "review manipulation," "death spiral," layoff counts as a fraud signal
- Any "Company X has CVE Y therefore they're incompetent" cell — it's the standard that kills you the day a SOV3 package gets a CVE
- Stock prices, insider-selling ratios, split timing — none of it belongs in product marketing

These aren't softness. They're the difference between a comparison you can publish under your own name and one that becomes Exhibit A.
