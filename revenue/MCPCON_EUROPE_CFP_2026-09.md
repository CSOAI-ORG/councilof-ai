# MCPCon Europe 2026 CFP — pitch + slide outline

**Conference:** MCPCon Europe · 17–18 September 2026 · Amsterdam
**Host:** Agentic AI Foundation (Linux Foundation)
**Pitch deadline:** rolling, recommended by 15 June 2026 for first-round review

---

## Speaker profile

**Name:** Nicholas Templeman
**Title:** Founder, MEOK AI Labs (CSOAI LTD · UK Companies House 16939677)
**Bio (60 words):**
> Nicholas is the solo founder of MEOK AI Labs, a UK MIT-licensed publisher of 67+ MCP servers in the official Anthropic Registry. MEOK ships the compliance + agent-to-agent infrastructure regulated EU markets need — EU AI Act, DORA, NIS2, CRA, ISO 42001, A2A primitives, Coinbase x402, Cisco AGNTCY bridge, EUDI Wallet bridge. All MIT, all signed.

**Twitter / X:** [@nick_templeman or your handle]
**GitHub:** github.com/CSOAI-ORG
**Website:** meok.ai

---

## Talk title (try all three, pick what fits programme committee)

1. **"Shipping 67 MCPs solo: what broke, what worked, what every MCP author needs to know"**
2. **"From `uvx` to audit-defensible compliance — how to wire 6 MCPs into 1 signed regulatory event"**
3. **"The signed, narrow, MIT alternative to one-big-compliance-LLM: the case for 67 small MCPs"**

---

## 250-word abstract

> The default move for AI compliance in 2026 is: fine-tune a frontier model on regulation PDFs, sell a $5K/month "AI compliance officer" SaaS. The output is plausible-sounding answers, no evidence chain, and no determinism — malpractice for an EU AI Act Article 26(9) FRIA that has to survive a DG-CNECT audit in 2028.
>
> Over the past 12 months I shipped 67 MIT-licensed MCP servers to the official Anthropic Registry as a solo founder. Each MCP is one narrow, deterministic compliance unit — EU AI Act bias check, DORA TLPT readiness, NIS2 Article 21 risk-management measures, ISO 42005 impact assessment, watermarking, incident relay across 5 regulatory regimes, agent-to-agent identity/policy/audit primitives. Every output is HMAC-signed for auditor verification.
>
> This talk covers the technical decisions that scaled this from one to 67: the FastMCP scaffold I ship in 5 minutes, the test pattern that catches Omnibus-delay regression (the EU moved 14 deadlines mid-year), the Substrate bundling model that turns 67 things into one £499–£999/month signed pipeline, and the bridging primitives (`agent-mcp-router-mcp` + `meok-mcp-cardgen-mcp` + `agent-incident-relay-mcp`) that turn an MCP catalogue into composable infrastructure.
>
> Attendees will leave with: a Python scaffold to ship their first MCP, a test pattern that asserts against regulation text (not implementation), a discovery-card stack (SEP-1649/1960/2127) and the data model behind cross-MCP signed evidence chains.

---

## 5-slot slide outline (45-minute talk)

**Slot 1 — Opening (5 min)**
- One slide: the £73 spin-loop screenshot (Claude Code agent burning tokens on EU AI Act lookup)
- The provocation: "Why I haven't built a compliance LLM"
- Show registry: 67 MCPs, 14 categories, all MIT

**Slot 2 — The narrow-tool argument (10 min)**
- The "one model that does everything" trap — 4 failure modes
- The 5 things a compliance tool actually needs (narrow, deterministic, signable, testable, composable)
- Live demo: `uvx eu-ai-act-compliance-mcp` → ask Claude Code "is my AI hiring system Annex III?" → signed response

**Slot 3 — The 6-MCP chain (15 min)** ⭐ MAIN BODY
- Walk through the `/mcp-stack` page chain:
  1. BFT Progress Council (anti-loop) →
  2. Token Budget (hard spend cap) →
  3. Article 50 Watermark (visible + invisible + perceptual) →
  4. EU AIGC Icon (Code of Practice 2nd draft) →
  5. Audit Logger (hash-chained) →
  6. Governance Bridge (folds into 1 signed event)
- Show real signed evidence event with public verify URL
- Show the auditor experience: `curl verify_url` returns the cert

**Slot 4 — Engineering patterns (8 min)**
- The test-against-regulation-text pattern (catches the Omnibus delay regression)
- The Substrate bundling model — why `api.meok.ai/v1/<primitive>` matters
- The router pattern — solving the Claude Code tool-count ceiling
- The `.well-known/mcp` discovery card (SEP-1649 + 1960 + 2127)
- The MIT + paid managed SLA business model

**Slot 5 — Q&A + open invitations (7 min)**
- Open PR invitations into MEOK repos for jurisdiction packs
- Job board for "compliance MCP author" — pay PRs in Stripe credit
- The 6 MCPs I'd love co-maintainers for (jurisdiction-specific: NL/DE/FR/IT/ES/PL NIS2 registers)
- Q&A

---

## Demo plan (live during slot 3)

```bash
# 1. Install the router
uvx agent-mcp-router-mcp

# 2. Walk through the 6-MCP chain via tool calls
- bft_progress_council.register_run(goal="generate AI video for EU customer")
- agent_token_budget.set_cap(session_id, gbp_cap=2.50)
- agent_content_watermark.generate_watermark(content_hash, model_id, provider_did, "video")
- meok_eu_aigc_icon.emit_video_keyframe_signal(video_hash, model_id)
- agent_audit_logger.append(session_id, action, watermark_id, icon_id)
- a2a_governance_bridge.fold(session_id) → signed_evidence_event

# 3. curl the public verify URL — show auditor experience
curl https://meok-attestation-api.vercel.app/verify/EVENT_ID
```

---

## Why this fits MCPCon Europe specifically

- **Live in production** — 67 MCPs are real, not a slide-ware deck
- **EU-relevant** — every regulation covered is EU-or-EU-adjacent
- **Solo / indie story** — counterpoint to Anthropic/Cisco/Stripe enterprise narratives
- **Composable infrastructure** — the AAIF charter is exactly "open multi-agent system infrastructure"
- **Already shipped to LF projects** — `oasf-agent-directory-mcp` already bridges to AGNTCY

---

## Submission email — copy/paste compose link

<https://mail.google.com/mail/?view=cm&fs=1&to=cfp@aaif.foundation&su=MCPCon%20Europe%202026%20CFP%20-%20Nicholas%20Templeman%20-%20Shipping%2067%20MCPs%20solo&body=Hi%20MCPCon%20programme%20committee%2C%0A%0AI%27d%20like%20to%20submit%20a%20talk%20to%20MCPCon%20Europe%20%2817-18%20September%202026%2C%20Amsterdam%29%3A%0A%0ATitle%3A%20Shipping%2067%20MCPs%20solo%3A%20what%20broke%2C%20what%20worked%2C%20what%20every%20MCP%20author%20needs%20to%20know%0A%0AAbstract%3A%20The%20default%20move%20for%20AI%20compliance%20in%202026%20is%20to%20fine-tune%20a%20frontier%20model%20on%20regulation%20PDFs%20and%20sell%20it%20as%20a%20%245K%2Fmonth%20SaaS.%20The%20output%20has%20no%20evidence%20chain%2C%20no%20determinism%20-%20malpractice%20for%20any%20EU%20AI%20Act%20FRIA%20that%20has%20to%20survive%20a%20DG-CNECT%20audit.%0A%0AOver%2012%20months%20I%20shipped%2067%20MIT-licensed%20MCP%20servers%20to%20the%20official%20Anthropic%20Registry%20solo%20-%20EU%20AI%20Act%2C%20DORA%2C%20NIS2%2C%20CRA%2C%20ISO%2042001%20%2B%2042005%2C%20Korea%20AI%20Basic%20Act%2C%20UK%20AI%20Bill%2C%2020%20A2A%20primitives%2C%20Cisco%20OASF%20bridge%2C%20EUDI%20Wallet%20bridge%2C%20Coinbase%20x402.%20Every%20output%20HMAC-signed%20for%20auditor%20verification.%0A%0AThe%20talk%20covers%3A%20the%20FastMCP%20scaffold%20I%20ship%20in%205%20minutes%2C%20the%20test%20pattern%20that%20catches%20Omnibus-delay%20regression%2C%20the%20Substrate%20bundling%20model%20%28%C2%A3499-%C2%A3999%2Fmo%29%2C%20the%20bridging%20MCPs%20%28router%20%2B%20cardgen%20%2B%20incident-relay%29%20that%20turn%20a%20catalogue%20into%20composable%20infrastructure.%0A%0ALive%20demo%3A%20walk%20a%206-MCP%20chain%20that%20produces%20ONE%20signed%20evidence%20event%20across%20EU%20AI%20Act%20Articles%2012%20%2B%2050%2C%20DORA%20Article%2017%2C%20ISO%2042001%20clause%209.%0A%0AFormat%3A%2045%20min%20%2B%20Q%26A.%20Comfortable%20with%20any%20stage%20size.%0A%0ABio%3A%20Nicholas%20Templeman%2C%20solo%20founder%20MEOK%20AI%20Labs%20%28CSOAI%20LTD%2C%20UK%29.%20github.com%2FCSOAI-ORG%20%C2%B7%20meok.ai%2Fanthropic-registry%20%C2%B7%20nicholas%40meok.ai%0A%0AHappy%20to%20provide%20a%20full%20deck%20outline%20or%20a%20pre-recorded%20demo%20on%20request.%0A%0ABest%2C%0ANicholas%20Templeman>

---

## Backup talks (if main one is rejected)

1. **"How to ship a signed, MIT compliance MCP in under 200 lines of Python"** (workshop format)
2. **"The Omnibus regression: how I caught the EU moving 14 deadlines mid-year with one pytest pattern"** (10-min lightning)
3. **"x402 + MCP: paywall any FastMCP tool in 1 decorator"** (10-min sponsor track, paired with Coinbase x402 Foundation)

---

*By MEOK AI Labs · CSOAI LTD · UK Companies House 16939677*
