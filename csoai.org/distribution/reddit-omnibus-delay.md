**Title:** EU AI Act Annex III deadline DELAYED 16 months to 2 Dec 2027 — but Article 50 transparency still bites in 36 days. We're the only vendor with the delay in our tooling.

**Body:**

The 7 May 2026 EU Digital Omnibus Act political agreement delayed the EU AI Act high-risk provisions by 16 months. But the market is still saying "37 days to cliff" — that's wrong for Annex III.

The actual deadlines (from EUR-Lex CELEX:32024R1689):
- **Article 50 transparency + watermarking**: 2 Aug 2026 (36 days) — **NOT delayed**
- Annex III high-risk: 2 Dec 2027 (523 days) — DELAYED 16 months
- Annex I product-safety: 2 Aug 2028 (767 days) — DELAYED 12 months

Every other compliance vendor (Verifywise, OneTrust, TrustArc, Big 4 consultancies) is still saying "37 days to cliff" and trying to create panic. **We're the only ones that have the Omnibus delay built into the tooling.**

Our MCPs return the truth:
```json
"deadline": "2 December 2027 (delayed from Aug 2026 by EU Digital Omnibus Act)"
```

**What this means:**
1. **36-day window** (NOW → 2 Aug 2026): Article 50 watermarking for AI-generated content. Penalties: EUR 15M or 3% global turnover.
2. **523-day runway** (16 months): Build the high-risk compliance system properly. No panic needed.
3. **Permanent competitive moat**: Every other vendor is still selling panic.

We built an open-source `eu-ai-act-compliance-mcp` that returns the right deadlines, plus a `article50_passport_issue` tool for the 36-day window. Both HMAC-SHA256 (free) and Ed25519 (auditor-grade) signed.

Source: github.com/CSOAI-ORG/eu-ai-act-compliance-mcp (Apache-2.0)
Verify: csoai.org/content/omnibus-delay/

**TL;DR:** The cliff moved. Every competitor is wrong. We're right. We are the only compliance vendor that knows.