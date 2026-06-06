> ⚠️ **RESEARCH VERDICT 2026-06-06 (supersedes the plan below — 3 cited research passes):**
> **Do NOT ship "OpenSIGIL" as a standalone product, and do NOT use the name.**
> - **Crowded/solved:** the signed, hash-chained, replayable agent-audit ledger already ships from ≥4 parties (nono, Checkpoint/Vouched→DIF, illuminis/InferTrust, Kiteworks) + an arXiv standard (Sello), and **A2A v1.0 (Apr 2026) shipped native Ed25519 "Signed Agent Cards."** Observability (LangSmith/Langfuse/OTel GenAI) already commoditised the human-readable transcript. The only unoccupied sliver is the "gloss-to-English line" — a UX feature, not a moat.
> - **Demand emerging, not strong:** EU AI Act Art 12 says "logs," not "signed," is HIGH-RISK-only, and slipped to **Dec 2027/Aug 2028** (Digital Omnibus). Every tamper-evident project is pre-revenue/design-partner = solution-looking-for-problem. £19/£99 lands between two stools (compliance buys $30k+ GRC; engineers use free Langfuse).
> - **Name is taken/undefendable:** "SIGIL" already used by 3+ AI-agent projects (sigilsec.ai, sigil-protocol.org, grafana/sigil-sdk, sigil-lang) + Romero's Doom SIGIL; "Open*" is legally weak + near OpenAI's TM litigation zone; "OpenMoE" is the ICML-2024 project + wrong category (MoE=model arch). **Coin a fanciful ownable name instead. Don't build identity on opensigil.ai/.dev.**
>
> **KEEP:** SIGIL as SOV3's *internal* signed-audit engine (real moat value). **PIVOT the product to → the wedge:** a narrow, framework-agnostic **open governance/compliance membrane** that wraps the winning frameworks (CrewAI/LangGraph/OpenAI-SDK), enforces EU-AI-Act/safety-tier policy per tool call, and emits signed attestations → funnels into the existing CSOAI/MEOK paid compliance products. Tamper-evidence = silent trust layer, NOT the headline. Target UK/EU **financial services** (the one segment with live 2026 teeth, FCA/SMCR). Full research in chat 2026-06-06.

---

# OpenSIGIL — the signed, auditable language for AI agents to communicate
*2026-06-06. Productizing SIGIL (now live in SOV3) as a standalone free+paid product. Domain: opensigil.ai (check avail) — you own openmoe.ai as fallback. ⚠️ SEE VERDICT ABOVE — this plan is superseded; kept for reference.*

## The one-liner
**OpenSIGIL is the provenance + audit layer for agent-to-agent communication** — a compact, deterministic, *human-readable* language that every exchange can be **signed and hash-chained**, so a multi-agent system produces a replayable, tamper-evident transcript an auditor (or a regulator) can actually read.

## The honest positioning (this is what makes it defensible)
**Do NOT pitch it as "another agent protocol."** MCP, A2A (Google), ACP, AGNTCY are the *transports* — how agents call tools / hand off / discover each other. OpenSIGIL is **not** competing with those; it's the **thin signed-audit layer that rides on top of any of them**: whatever transport agents use, they emit an OpenSIGIL line for each decision → you get a signed, glossable, hash-chained ledger of *what the agents actually decided and why*. Positioning it as a transport = it loses to MCP/A2A. Positioning it as "the flight-recorder / notary for agent comms" = it's complementary and has no direct competitor. **This is the win.**

## Why now (2026)
- Multi-agent is everywhere (swarms, councils, dual-brain) → nobody can answer "what did your agents decide, and can you prove it wasn't tampered?"
- **EU AI Act Art 12 (logging) + Art 14 (human oversight)** + ISO 42001 want exactly this: auditable, reviewable records of automated decisions. OpenSIGIL *is* that artifact for agent systems.
- It plugs straight into the CSOAI/attestation moat — "verifiable agent communication" is a sentence enterprises pay for.

## Free vs Paid (the funnel)
**FREE — open the language, win adoption (MIT):**
- The **spec** (the grammar: opcodes P/V/M/Q/C/H/S/A, lossless encode↔decode, gloss→English).
- The **`opensigil` library** (pip/npm): `encode` / `parse` / `gloss` / `digest` + **HMAC self-signing** + a local hash-chained ledger + `verify`. Everything an indie needs to add signed agent logs for free.
- A **public verifier** at opensigil.ai/verify (paste a transcript → chain-intact? signatures valid?) — free, capped.

**PAID — the trust/compliance service (the revenue):**
- **Hosted signing** with **Ed25519 + RFC-3161 timestamps** (external-grade, third-party-verifiable — the upgrade from HMAC). "Anyone can verify your agents' transcript without your secret."
- **Audit dashboard** — searchable, glossed, signed transcript of an org's agent fleet; export an **EU AI Act Art 12/14 evidence pack**.
- **Conformance badge** — "OpenSIGIL-attested agent system."
- Tiers (proposed): **Free** (HMAC + local ledger + 100 verifies/mo) · **Pro £19/mo** (Ed25519 + timestamps + hosted ledger + dashboard) · **Team £99/mo** (multi-agent fleets, evidence export, SSO) · **Enterprise** (on-prem, custom retention).

## What already exists (so this is packaging, not from-scratch)
- `sigil.py` — the protocol (encode/parse/gloss/digest), lossless, demoed.
- `multi_agent/sigil_bus.py` — signing (HMAC, Ed25519 seam ready), hash-chained ledger, tamper-detection, `audit_chain()` integrity, MCP tools (`sigil_emit`, `sigil_transcript`). **Live in SOV3, Mac+VM.**
- The CSOAI attestation API + verifier (reuse for the paid signing/verify service).
→ The product is: **extract the lib (free) + stand up the verify/sign service (paid) + a landing page.** Days, not months.

## Build plan
1. **Landing page** at opensigil.ai (this session) — hero, the live signed-transcript demo, free/paid, "the flight-recorder for agent comms," waitlist/CTA.
2. **`opensigil` open-source lib** — extract sigil.py + the HMAC/ledger from sigil_bus into a clean MIT package (Python first, then JS). Publish via the gate harness (owner-gated).
3. **/verify** (free) + **/sign** (paid, Ed25519+RFC-3161) endpoints — reuse meok-attestation-api.
4. **Spec page** (the grammar, versioned) — the "standard" anchor (ties to CSOAI as the body that stewards it).
5. **Launch**: Show HN "OpenSIGIL — signed, human-readable transcripts for multi-agent systems," + the EU AI Act angle to compliance buyers.

## Honest risks / caveats
- **Protocol adoption is hard** (network effects). Mitigant: the value is the *paid verification/audit service*, which works even with low protocol adoption (you can sign/verify any agent log, not just SIGIL-native ones). Don't bet the business on everyone adopting the language.
- **Don't oversell HMAC** as external-grade. Free tier = internal tamper-evidence; paid = Ed25519/RFC-3161 = the real third-party-verifiable claim.
- **Name**: opensigil.ai is the right brand (SIGIL = the language). openmoe.ai (owned) doesn't fit "agent language" — repurpose it elsewhere or 301 it to opensigil.ai. Confirm opensigil.ai is available first.
- **CSOAI tie-in**: position CSOAI as the steward/standards-body for OpenSIGIL → reinforces both.
