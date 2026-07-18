# Show HN: OpenMEOK — multi-LLM agent OS with visible BFT council disagreement + 38 EU AI Act / DORA / NIS2 MCPs (MIT/Apache)

**Submission date:** Tuesday June 3 2026 · 14:00 UTC (07:00 PT / 10:00 ET / 15:00 BST)
**Karma prerequisite:** Nick's HN account needs commenting karma — 5–10 high-quality comments over the week leading up.
**Post-as URL:** https://meok.ai/os

---

## Title (≤80 chars for HN, optimised for click-through)

> Show HN: 47 MCPs + the only A2A substrate that bridges MCP, A2A, Stripe ACP, AP2 + x402

Backup titles to A/B if first doesn't catch:

1. `Show HN: OpenMEOK — what if your AI showed you the 3 LLMs voting + their dissent?`
2. `Show HN: I built 38 EU AI Act / DORA / NIS2 MCPs + an agent OS that shows their dissent`
3. `Show HN: Multi-LLM OS where Claude + GPT + Gemini argue in front of you, audit-signed`

## URL field

```
https://meok.ai/os
```

(Falls back to https://meok.ai/catalogue if /os shell not deployed by submission day — see backup.)

## Text body (paste verbatim)

I'm Nicholas — solo founder, building from a Lincolnshire farm in the UK.

Every existing AI shell (LibreChat, Open WebUI, LobeChat) shows you one answer from one model. **OpenMEOK shows you 5 LLMs voting on every response, with the dissent visible per response, and the whole exchange HMAC-signed for audit evidence.**

Why this matters: EU regulators are about to start enforcing AI Act Article 14 (human oversight), Article 12 (audit log keeping), DORA Article 17 (ICT-related incident reporting), and NIS2 Article 23 — and "the LLM said so" is not a defensible audit trail. You need to show how a decision was reached, by whom, with what dissent. We make that the default UI, not a buried log.

What it actually is:

- **`meok.ai/os`** — a 3-pane shell over a multi-LLM gateway (Claude, GPT-4o, Gemini 2.5, Llama 3.3, Mistral Large, DeepSeek, Qwen, Step 3.6, Kimi K2.5 + Ollama-local). Pick your model, or run BFT council mode and see the votes.
- **38 MIT-licensed compliance MCPs** covering EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, NIST AI RMF, UK AI Bill, MiCA, MDR/IVDR, FDA SaMD, Basel III, MiFID II, AML/KYC, MITRE ATT&CK + ATLAS, SBOM (CycloneDX 1.6 + SPDX 3.0), SLSA, Sigstore Cosign, watermarking + C2PA, bias detection (Article 10), and 5 A2A patterns (handoff certification, rate limiter, audit logger, data residency, policy enforcement).
- **Care membrane** — 6-dim Noddings-care scoring on every response, surfaced to the user.
- **Attestation chain** — every signed compliance artefact is HMAC-chained and verifiable at https://verify.meok.ai.

How is this different from the others?

| | LibreChat | LobeChat | Open WebUI | OpenMEOK |
|---|---|---|---|---|
| Chat with N LLMs | ✓ | ✓ | ✓ | ✓ |
| MCP plugins | OpenAPI plugins | MCP-ish | function pipelines | **38 prod-grade compliance MCPs** |
| Multi-model vote | ✗ | ✗ | ✗ | **BFT council, dissent visible** |
| Signed audit log | ✗ | ✗ | ✗ | **HMAC-attested receipts** |
| EU AI Act / DORA / NIS2 | ✗ | ✗ | ✗ | **purpose-built** |


- **6 live agent-interop protocols bridged.** MCP (native — all 47 MCPs). A2A (native — 12 A2A primitives). IBM ACP (covered via A2A merge Sept 2025). Stripe ACP / AP2 / x402 (Q3 bridge or partial today). Linux Foundation governance on A2A means EU regulated buyers can deploy without vendor-lock-in objections.

License: Apache 2.0 for the Python compliance MCPs (patent grant matters for enterprises), MIT for the JS shell + SDK + CLI. **Not AGPL** — kills enterprise adoption.

Free forever for self-hosting. Cheap paid tier (£29/mo per MCP, £79/mo for full Pro bundle, £1,499/mo for SLA/multi-BU) adds HMAC-signed attestations for auditor-grade evidence.

The whole stack started because the UK MoD asked me about "explainable AI for procurement" 8 months ago and I realised every compliance vendor was shipping PDFs and Word templates. PDFs don't fit inside agent workflows. MCPs do.

Hard numbers:

- **373 GitHub repos** under CSOAI-ORG · **247 PyPI packages live** · **294 npm packages**
- **Zero VC funding · Zero co-founders · Built solo in 4 months**
- **Today's MRR: £0** (yes, day-of-launch)
- **Karma-honest:** I'm here to find out if this is useful, not to claim revenue I don't have.

If you build agents and you've been ignoring compliance because the existing tooling sucks — try `uvx eu-ai-act-compliance-mcp` and let me know.

GitHub: https://github.com/CSOAI-ORG
Anthropic Registry: https://registry.modelcontextprotocol.io (search "CSOAI-ORG")
PyPI: https://pypi.org/user/MEOK_AI_Labs/
Docs: https://meok.ai/docs

Built solo in Lincolnshire, UK. CSOAI LTD (Companies House 16939677). Apache 2.0 / MIT.

Comments + roasts welcome. Especially: what would have to be true for you to drop your current agent shell for this?

---

## Pre-launch checklist

### 7 days out (May 27)
- [ ] Build /os shell on www.meok.ai (Plan: Day-by-day from MEOK_CLAW_ARCHITECTURE_2026-05-20.md)
- [ ] BFT council disagreement demo working end-to-end via /api/council/audit
- [ ] Care-meter visible per response
- [ ] Stripe tier wiring with £29 / £79 / £1,499 tiers
- [ ] Screenshot recording: 3-LLM disagreement on a contentious prompt
- [ ] Comment 5-10 quality comments on HN to bring karma above show-HN threshold

### 24 hours out (June 2)
- [ ] Final smoke test of /os from a clean browser
- [ ] Verify all 38 MCPs install via `uvx <name>-mcp`
- [ ] Test `/api/council/audit` with 3 models returning split vote
- [ ] Pre-stage hero screenshot 2:1 ratio for HN OG image
- [ ] Tweet draft ready ("Show HN posted: <link>") for cross-channel push at 14:30 UTC

### Day-of (June 3, 14:00 UTC)
- [ ] Submit at exactly 14:00 UTC (07:00 PT — peak HN window)
- [ ] DO NOT vote on own post
- [ ] DO NOT ask friends to upvote (will be deranked)
- [ ] Reply to first 5 comments within 60 minutes — fast first-day engagement matters
- [ ] Cross-post to r/LocalLLaMA Tue 4 Jun (separate day, different angle: "Ollama-first agent shell, 5 local models in parallel with dissent visible")
- [ ] Cross-post to Anthropic Discord #showcase ("Claude Opus as deep-reasoning lane in 5-LLM council")
- [ ] Email AI Engineer Summit organisers re: lightning-talk slot

### Targets
- Front page within 90 min (need ~30 upvotes in first hour)
- Top 10 by hour 4 (need ~100 upvotes)
- Bring 200–400 first-day signups
- Convert 1–3 paid Starter (£29/mo) within 72 hours

### Backup if /os shell isn't ready by 1 Jun
Switch URL to https://meok.ai/catalogue with revised title:

> Show HN: 38 MIT compliance MCPs for EU AI Act / DORA / NIS2 — auditor-signed, free to self-host

Text body adapts: lead with the MCPs, keep council mention as "next layer shipping June 14".

### Failure mode to prepare for
HN commentariat HATES:
- Marketing-speak ("revolutionary", "game-changing")
- Hidden paywalls / required signup before tasting the product
- Vague claims with no numbers
- Founder-no-show in the comments

This draft addresses all four: plain language, free `uvx` install (no signup), specific number table, founder commits to live commenting.

### What WILL get pushback (prep responses)

1. **"YOU keep using MCP — most users don't have any MCP client yet"** → "Anthropic's Sonnet usage hit 71% in the past 8 weeks per Anthropic. MCP is the protocol the field is converging on. We're early to the right place, not late to the wrong one."
2. **"How do I trust your attestation?"** → Public verify URL at verify.meok.ai, signed HMAC chain, all signing code MIT-licensed, BYO key supported in Pro.
3. **"BFT council is just a fancy ensemble"** → True, but the unique bit is making the disagreement visible to the user per response, not hiding it behind a "confidence score". Show me a competitor doing that.
4. **"Why solo?"** → Solo UK founder, CSOAI LTD (CH 16939677), building from a farm. Meant to be a counter-example to the "must hire team" compliance vendor playbook. Zero VC, zero co-founders.
5. **"Why not AGPL?"** → Apache 2.0 + MIT specifically because enterprises (UK MoD, EU regulators) can't deploy AGPL. The trust anchor at verify.meok.ai is the moat, not the source code.

---

## Why June 3 specifically

- Tuesday is highest-traffic HN day
- 14:00 UTC = 07:00 PT = 10:00 ET = 15:00 BST — overlap window for US East + West Coasts + UK + EU
- Avoids US Memorial Day (May 25-26) low-traffic dip
- 7 days before the MASTER_PLAN Aug 20 hard-decision cliff — leaves enough runway for revenue signal
- Anthropic Sonnet 4 + GPT-5 launches both behind us (no major model news cycle to compete with)

---

## Distribution outbound (post-launch, hour 0-4)

| Channel | When | Message |
|---|---|---|
| Twitter @meok_ai | 14:30 UTC | "Show HN posted: <link>. 5 LLMs vote, dissent visible. 38 compliance MCPs. Built solo, MIT/Apache. Roasts welcome." |
| LinkedIn (Nick personal) | 14:30 UTC | Longer version — emphasis on UK regulatory context |
| Anthropic Discord #showcase | 15:00 UTC | "Just shipped — Claude as deep-reasoning lane in 5-LLM council." |
| r/LocalLLaMA | TUE 4 JUN 14:00 UTC (separate day) | Title: "Ollama-first agent shell, 5 local models in parallel with dissent visible" |
| 26-target OEM list (Risto Uuk / EU AI Office / etc.) | THU 5 JUN | Personal warm intros referencing the launch |
