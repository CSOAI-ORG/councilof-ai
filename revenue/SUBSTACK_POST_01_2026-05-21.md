# Why I built 59 compliance MCPs instead of one big compliance LLM

*The case for narrow, signed, MIT-licensed tools — and against another "AI for compliance" black box.*

Nicholas Templeman · MEOK AI Labs · 2026-05-21

---

## TL;DR

I'm a solo founder. Over 12 months I shipped **59 Model Context Protocol (MCP) servers** covering EU AI Act, DORA, NIS2, CRA, ISO/IEC 42005, Korea AI Basic Act, UK AI Bill, plus 20 agent-to-agent (A2A) primitives (identity, trust, policy, audit, BFT progress council, ACP/AP2/x402 payments, OASF directory, EUDI wallet, replay debugger).

Every one is MIT-licensed, every one runs locally via `uvx`, every output is signed with HMAC-SHA256 for audit-defensible evidence.

People keep asking me: **"Why not just build one big compliance LLM?"**

This post is the answer.

---

## The "one big model" trap

The default move in 2026 is: take GPT-5 or Claude 4.7, fine-tune on regulation PDFs, sell a £5,000/month "AI compliance officer" SaaS.

I've watched a dozen well-funded teams do exactly this. The output is:

1. **Plausible-sounding answers**. The model writes paragraphs that look right, citing articles that almost exist.
2. **Zero evidence chain**. When the regulator asks "where did this conclusion come from?", you have a chat transcript.
3. **No determinism**. Same input on Tuesday produces a different answer on Wednesday.
4. **A walled garden**. You're locked to one vendor's API, one billing relationship, one set of guardrails.

For a Tuesday brainstorm, that's fine. For an EU AI Act Article 26(9) Fundamental Rights Impact Assessment that has to survive a DG-CNECT enforcement audit in 2028? It's malpractice.

---

## What a compliance tool actually needs

I sat down with the EU AI Act text and asked: **what's the smallest, most testable, most signable unit of compliance work?**

Answer: a tool call.

A bias check on a dataset is a tool call. A high-risk classification of a system against Annex III is a tool call. A C2PA watermark verification is a tool call. A DORA TLPT readiness score is a tool call. An audit log append is a tool call.

That's exactly what MCP gives you. A standardized way to expose a tool to an AI agent. So instead of one big model that hallucinates compliance, I built one narrow, deterministic tool per compliance concept.

**Narrow** means each tool fits in a 300-line Python file. You can read the whole thing in an afternoon. Auditors love that.

**Deterministic** means same input → same output. Every time. Unit-testable in CI.

**Signed** means every output ships with an HMAC-SHA256 attestation that an auditor can verify without contacting MEOK. The cryptographic chain stops the "did this report get tampered with?" conversation before it starts.

---

## The catalogue (as of today)

**Governance & Compliance** (12 MCPs):
EU AI Act · DORA · NIS2 · CRA · AI-BOM · ISO/IEC 42005 · AI Incident Reporting · DORA ✕ NIS2 Crosswalk · Bias Detection · Watermarking + C2PA · UK AI Bill · Korea AI Basic Act.

**A2A — Agent-to-Agent** (20 MCPs):
Identity + Trust (W3C DID + VCs) · Data Residency (GDPR Chapter V) · Policy Enforcement · Prompt-Injection Firewall · Rate Limiter · Delegation · Certified Handoff · Orchestrator · Audit Logger · Commerce + Payments (PSD2/MiCA) · Negotiation · Governance Bridge · **BFT Progress Council** (anti-loop guardrail) · **Token Budget Cap** · **Cost Allocator** · **Agent Commerce Protocol** (Stripe ACP + Google AP2 + Coinbase x402) · **x402 Paywall** · **OASF Directory** (Cisco + Linux Foundation) · **EUDI Wallet** (eIDAS 2.0) · **Replay Debugger**.

**Cybersecurity, Platform, Trade, Industry** (27 more, listed at meok.ai/docs).

All MIT, all on PyPI, all in the official MCP Registry.

---

## Three things this lets you do that the big-model approach can't

### 1. Audit the source

Each MCP is a tiny Python repo. The EU AI Act Article 10 bias-check logic is in `bias-detection-mcp/server.py`, ~280 lines. An auditor can read it, your CISO can read it, your competitor can read it. There's no "trust us, the model knows."

### 2. Compose without vendor lock-in

Because each MCP is a separate process, you can use **just** `bias-detection-mcp` and bring your own LLM, your own orchestrator, your own UI. You don't get the whole stack or nothing. You get the smallest piece that solves your problem.

You can also chain them. The MEOK A2A Substrate is 20 of these primitives composed into one signed pipeline: identity → trust → policy → firewall → rate-limit → handoff → audit → governance. One event, one invoice, one HMAC chain that maps to EU AI Act Article 12 + DORA Article 17 + ISO 42001 clause 9.

### 3. Halt your own runaway agents

Most "agent platforms" today bleed tokens. I've seen a single Claude Code session burn £73 in a 4-hour spin loop. The fix isn't a smarter prompt — it's a Byzantine-fault-tolerant voting committee that watches the agent's actual progress signals (repetition, identical errors, goal drift, no artefact growth) and halts the loop when 3 of 5 voters agree there's no real progress.

That's `bft-progress-council-mcp`. £0.0002 per check on PAYG, free if you self-host. The first time it saves you from a £100 spin loop it has paid for the year.

---

## Why MIT?

Two reasons.

**One**, lawyers and auditors will not deploy software they can't read. Closed-source compliance is a contradiction in terms.

**Two**, MEOK doesn't make money from the source code. We make money from:

- **Managed substrates** (£499–£999/mo bundles with one signed pipeline + 99.9% SLA + the `api.meok.ai/v1/<primitive>` endpoint)
- **Universal PAYG** (£29/mo + £0.0002/call for any of the 59 MCPs)
- **Defence tier** (£4,990/mo on-prem + custom HMAC keys + UK MoD List X)
- **Universe tier** (£1,499/mo for the full catalogue)

If you'd rather self-host all 59 and never pay us a penny, that's expressly the point of MIT. The substrate is convenience, not a moat.

The moat is the **breadth of regulation coverage** + the **signed evidence chain** + the **fact that every MCP unit-tests against the regulation text** + the **HMAC verifier that runs without contacting us**.

---

## What's next

- **docs.meok.ai** — full per-MCP docs with install snippets for Claude Code, Cursor, Cline, Windsurf
- **`api.meok.ai/v1/a2a/<primitive>`** — managed HTTP endpoint for the A2A Substrate (so non-Python agents can call them)
- **9 more MCPs** Q3: agent-content-watermark · agent-incident-relay (Article 73 5-clock broadcaster) · agent-eu-mlbom-export · plus an EU-specific AGNTCY bridge

If you're building agents for regulated EU markets, this is the cheapest insurance policy you can buy.

If you're sceptical, read the source. It's all on GitHub at [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG).

---

**Try it:**

```bash
uvx eu-ai-act-compliance-mcp        # 410 articles, FTS5 search, Article 50 + Annex III classifier
uvx bft-progress-council-mcp        # Byzantine anti-loop guardrail
uvx agent-replay-debugger-mcp       # Step-debug any agent run
uvx eudi-wallet-mcp                 # EU Digital Identity Wallet bridge
uvx oasf-agent-directory-mcp        # Cisco OASF + AGNTCY directory
```

Full catalogue: [meok.ai/anthropic-registry](https://meok.ai/anthropic-registry)
Docs: [meok.ai/docs](https://meok.ai/docs)
Source: [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG)

---

*MEOK AI Labs is the trading name of CSOAI LTD (UK Companies House 16939677). All MCPs are MIT-licensed. The Substrate, Universe, and Defence tiers are paid managed services.*

---

## P.S. — what I learned shipping 59 of these

1. **PyPI release cadence matters more than feature depth.** A v1.0.3 weekly is more useful than a v2.0.0 in 6 months.
2. **One MCP, one file, one Python module.** Resist the urge to split into a package. Auditors read single files.
3. **Every output gets signed.** Even the free tier. The "free tier mark" in the cert is the only thing differentiating it from Pro.
4. **Tests assert against the regulation text, not the implementation.** When the Omnibus delay moved Annex III from August 2026 to December 2027, I had to update 14 files in one PR. Test-against-text caught all of them.
5. **MIT + paid substrate is the right model.** Closed source for compliance is dead-on-arrival. Pure open source doesn't fund a solo founder.

If you want to chat about any of this, I'm [@nicholas at meok.ai](mailto:nicholas@meok.ai) — and the comments are open.
