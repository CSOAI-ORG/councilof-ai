# MEOK Brief #2: 38 MCPs, 410 articles, one CLI
**To send via Buttondown · Subject: Issue #2 — The governance MCP suite that auditors verify**

---

Hi {{first_name}},

Quick update — the MEOK governance suite just crossed a threshold:

**38 MCP servers** covering every major AI governance regime in EU + UK + US:
- **Horizontal**: EU AI Act (v1.4 with 410 verbatim articles), DORA, NIS2, CRA, CSRD, GDPR, ISO 42001, NIST AI RMF, OWASP Agentic
- **Industry-specific**: MiCA (crypto), MDR/IVDR (medical devices), FDA AI/ML SaMD (US medtech), COPPA/FERPA (kids data), Basel III + SR 11-7 (banking AI), MiFID II Article 17 (algo trading), AML/6AMLD, FSA food safety
- **Cybersecurity**: CISA KEV, SBOM (CycloneDX + SPDX), MITRE ATT&CK, MITRE ATLAS (adversarial AI), SLSA, Sigstore
- **Agent-to-agent**: 7 A2A MCPs (policy enforcement, audit logger, rate limiter, handoff certified, prompt injection firewall, data residency, identity trust)
- **UK trade verticals**: haulage, skip hire, BIM (ISO 19650), NRSWA, CHAS, crane hire, concrete pumping

**One install** for any pack:
```
npx meok-setup --pack governance
npx meok-setup --pack a2a
npx meok-setup --pack cybersec
npx meok-setup --pack all
```

---

## The Article 50 cliff hasn't moved

Quick reminder for anyone tracking the EU AI Act timeline after the March 2026 Omnibus vote:

- **Article 4 (literacy)**: ✅ in force since Feb 2025
- **Article 50 (transparency, watermarking)**: ⏰ **2 Nov 2026** — 173 days from today. **NOT delayed by Omnibus.**
- **Annex III (high-risk)**: delayed to 2 Dec 2027
- **Annex I (high-risk)**: delayed to 2 Aug 2028

If you ship AI-generated content (text, image, video, audio) into the EU market, Article 50 is the nearest cliff. C2PA 2.1 + invisible watermarking is the multilayer answer.

We just shipped C2PA 2.1 manifest generation in `watermarking-authenticity-mcp` v1.1+.

→ `pip install watermarking-authenticity-mcp`

---

## What an HMAC-signed attestation actually means

I keep getting asked "what's special about your attestations vs just running an audit and emailing the result?"

The difference: **public verification without contacting MEOK.**

Every Pro tier audit produces a cert with:
- HMAC-SHA256 signature derived from a server-side key the customer never sees
- Cert ID like `MEOK-DORA-A1B2C3D4`
- Public verify URL: `https://meok-attestation-api.vercel.app/verify`

Your auditor pastes the cert. The endpoint says **valid: true/false**. No phone call to MEOK. No "trust us." Just math.

This is why we built the whole stack — compliance trust delivered through cryptography, not through reputation alone.

---

## What we built this week

- 23 new MCPs (industry verticals + cybersecurity + 7 UK trade)
- 410 EU regulation articles (EU AI Act, DORA, NIS2, CRA, CSRD, GDPR) in SQLite FTS5
- `npx meok-setup` CLI — zero-friction install for the whole pack
- Daily EUR-Lex Cellar API sync via GitHub Actions
- C2PA 2.1 manifest support in watermarking MCP

---

## What's next (May → June)

1. Cloudflare Worker hosted MCP endpoint at `mcp.councilof.ai` — no local install needed
2. Slack ChatOps integration — `@meok run audit` in your support channel
3. White-label Trust Centers (Enterprise tier)
4. Notified Body partnership program — 5 NB conversations active

---

## One ask

If you've been considering MEOK Pro (£79/mo) for your compliance workflow, this is a good week — we just removed the biggest blocker (verbatim regulation text) and the next 30 days will compound on that foundation.

→ Subscribe: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

Reply with **what's missing** for your compliance need. Every reply gets read; most ideas ship within 14 days.

— Nicholas
Founder, MEOK AI Labs
hello@meok.ai
https://meok.ai

---

**P.S.** If you're attending an EU AI Act / DORA / NIS2 event in the next 8 weeks, reply and I'll send a 1-pager you can hand out.

*Unsubscribe at any time. We email weekly maximum.*
