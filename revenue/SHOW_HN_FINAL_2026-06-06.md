# Show HN — finalized, ready to post (you fire it; posting in your name is yours)

**Where:** https://news.ycombinator.com/submit
**Title (≤80 chars):**
`Show HN: Open-source MCP servers that put EU AI Act/ISO 42001/NIST in your agent`

**URL:** https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp
*(or leave URL blank and paste the text below as the post — "text" Show HNs do fine)*

---

**Post text:**

I kept hitting the same wall building AI features for UK/EU SMEs: the compliance tooling is all $20k–$150k/yr enterprise GRC dashboards (Vanta, OneTrust, Credo AI), sales-gated, and none of it is callable by an AI agent. So I built the opposite — compliance as **open-source MCP servers** your coding agent (Claude, Cursor, etc.) can actually call.

What's there now:
- ~270 MCP servers on PyPI. The substantive ones cover **EU AI Act, ISO 42001, NIST AI RMF, GDPR, SOC 2, DORA, NIS2, CRA** — each is a real implementation (e.g. the EU AI Act one has the Article-50/Annex tables + 14 tools, not a stub), MIT-licensed.
- Try one in 30 seconds: `pip install eu-ai-act-compliance-mcp` then point your MCP client at it, or run the zero-dep verifier: `pip install meok-attestation-verify` and pipe it a signed attestation → VALID/INVALID.
- Pricing is transparent and pay-as-you-go: free tier, then **£0.05/call** (no subscription, no sales call). Top up at councilof.ai/payg.

Honest caveats, because this is compliance and you should be skeptical:
- The framework crosswalks are AI-generated and peer-reviewed by me, with real clause IDs — but they're decision-support, **not legal advice**, and I flag where a human counsel sign-off is needed before you rely on them in an audit.
- Attestations use HMAC-SHA256 for internal tamper-evidence; for external/audit defensibility the right layer is C2PA + X.509 + RFC-3161 timestamps, which I'm moving to. I'd rather say that than oversell the crypto.
- The EU AI Act dates that actually matter: Article 50 transparency applies **2 Aug 2026** (new systems); pre-existing generative systems get a watermarking grace to **2 Dec 2026** (Digital Omnibus).

I'm a solo founder (this also runs my family's optical + care-home businesses' compliance). Genuinely after feedback from people building agent tooling: is MCP the right surface for this, or do you want it as a plain CLI/library? What's missing? What would make you actually wire compliance into your pipeline vs ignore it until an audit?

Repo: https://github.com/CSOAI-ORG · catalogue + verifier: councilof.ai

---

## Posting tips (so it lands)
- Post **Tue–Thu, ~8–10am ET** (HN peak). Not weekends.
- First comment from you (immediately): drop the one-liner install + the verifier demo, and the "what would make you use it" question — gives people an easy entry.
- Reply to EVERY comment in the first 2 hours, fast + non-defensive. HN rewards the founder who engages.
- Do NOT vote-ring or ask for upvotes (HN auto-flags it). Let it ride.
- If it stalls, the honest-caveats + the "1/100th the cost of Vanta, and open" angle are your re-engagement hooks in comments.
