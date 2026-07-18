# MEOK Claw + OpenMEOK — Architecture & Build Plan
**Generated:** 2026-05-20 · ship-by-Sunday-June-1 plan

## TL;DR

- **Ship `meok.ai/os` v1 by Sunday June 1.** 12-day build. Don't fork OpenClaw/StepFun. Don't migrate stacks.
- **One single differentiator NO competitor has:** live BFT council disagreement visible per response (3-2 dissent shown, not hidden). LobeChat/Open WebUI/LibreChat all show one answer; MEOK shows the disagreement.
- **OpenMEOK on GitHub** = umbrella monorepo `meok-ai-labs/openmeok`, Apache 2.0 (servers) + MIT (apps), 2-license split with rationale below.
- **Realistic Month-6 MRR**: £3,400-£4,500 (£40-55k ARR). £10k MRR requires Show HN to land + Pro tier to convert.

## Architecture: meok.ai/os 3-pane shell

```
src/app/os/
  page.tsx                  # NEW shell <OSShell><Left/><Center/><Right/></OSShell>
  layout.tsx                # keeps top nav
  _components/
    LeftRail.tsx            # model + character + sovereign toggle + session list
    CenterPane.tsx          # conversation + ToolCallCard streaming
    RightRail.tsx           # MCP picker + CareMeter + CouncilTrace
    PaywallGate.tsx
  _store/osStore.ts         # Zustand (not Jotai)
  _hooks/useAgentStream.ts  # SSE chat with tool-call demux
```

### State shape (Zustand)

```ts
type OSState = {
  provider: ProviderId          // 10 LLMs from llm_gateway.py
  character: ArchetypeId        // Aria/Sage/Luna/Gabriel/Marcus/Shanti
  sovereignMode: "cloud" | "local" | "vast"
  sessionId, messages, toolCalls
  enabledMCPs: Set<string>      // subset of 39
  careScore: CareDims           // 6-dim Noddings + sovereignty + dignity
  councilTrace: CouncilVote[] | null
  attestation: AttestationReceipt | null
  tier: "free" | "personal" | "starter" | "pro" | "defence"
}
// Persist {provider, character, sovereignMode, enabledMCPs} only.
```

### MCP wiring (already half-built)
- **Layer 1:** `/api/mcp/dispatch` proxy → `mcp-bridge` fan-out, cache schemas in Edge Config + results in Runtime Cache
- **Layer 2:** AI SDK v6 demux (`tool-call-start/delta/result`) → `useAgentStream` writes to `toolCalls` → `<ToolCallCard>` renders mid-stream
- Care-score header already emitted at `/api/chat/route.ts:772` — just surface in UI

### Stripe paywall (3 gates, not a wall)
1. **Message ceiling** — Free 10/day per character
2. **Panel gate** — `<PaywallGate require="pro">` wraps `<CouncilTrace/>` and Compliance MCPs
3. **Attestation gate** — Per-response "Sign this (£0.10)" on free, free on starter+

## OpenMEOK GitHub Strategy

### License split: Apache 2.0 (servers) + MIT (apps)
**Apache 2.0** for `/python/mcp-*` — patent grant matters; enterprises need patent peace on compliance frameworks
**MIT** for `/web/`, `/packages/sdk/`, `/packages/cli/`, agent shell — JS dev expectation, matches LobeChat/Open WebUI for star velocity
**NOT AGPL** — kills enterprise adoption + SaaS forkability

### Repo structure
```
openmeok/
  packages/                 # JS/TS, MIT
    sdk/                    # @openmeok/sdk
    cli/                    # @openmeok/cli
    ui-kit/                 # shared shadcn
    care-membrane/          # @openmeok/care
    council-client/         # @openmeok/council
  python/                   # Apache-2.0
    meok-eu-ai-act/         # flagship
    meok-dora-nis2-crosswalk/
    ... (39 total)
    _shared/mcp_attestation.py
  server/
    mcp-bridge/             # current /Users/nicholas/clawd/mcp-bridge
    attestation-api/        # current meok-attestation-api
    council-gateway/
  web/os/                   # the meok.ai/os shell
  desktop/                  # PHASE 2 Tauri
  docs/                     # Nextra
  RFCS/                     # 0001-care-membrane-spec-v1.md
```

### Differentiation table

| | LibreChat | LobeChat | Open WebUI | **OpenMEOK** |
|---|---|---|---|---|
| Chat with N LLMs | ✓ | ✓ | ✓ (Ollama-first) | ✓ |
| MCP system | OpenAPI plugins | MCP-ish | function pipelines | **39 prod-grade compliance MCPs** |
| Care/safety scoring | ✗ | ✗ | ✗ | **6-dim Noddings + 2 MEOK extensions** |
| Multi-model vote | ✗ | ✗ | ✗ | **BFT council, dissent visible** |
| Signed audit log | ✗ | ✗ | ✗ | **HMAC-attested receipts** |
| EU AI Act / DORA / NIS2 | ✗ | ✗ | ✗ | **purpose-built** |

**One sentence:** LibreChat/LobeChat/Open WebUI are UIs. **OpenMEOK is UI + governance + audit + regulatory product.**

## 12-Day Build Plan (Sunday June 1 ship)

| Day | Work |
|---|---|
| Wed 20 May (today) | Strategy lock; RFC-0001 stub; **delete /os/birth-ceremony, /dream, /fly-eye, /wake, /control-room, /sovereign-display, /computer-use, /tasks, /consciousness, /sovereign**; merge any-llm + sovereign-os + characters into _components/ |
| Thu 21 May | Build OSShell 3-pane CSS grid; mount empty rails; implement osStore.ts with persistence; wire Clerk tier |
| Fri 22 May | LeftRail complete: ModelSelector (10 providers) + CharacterPicker (6) + SovereignToggle |
| Sat 23 May | CenterPane + useAgentStream; reuse /api/chat; add <ToolCallCard> for AI SDK v6 frames |
| Sun 24 May | RightRail scaffolding: MCPSidebar lists 39, /api/mcp/dispatch wired; smoke-test one MCP end-to-end |
| Mon 25 May | CareMeter (6-dim recharts); reads X-MEOK-CareScore header (already emitted server-side) |
| Tue 26 May | CouncilTrace from new /api/council/audit (wraps llm_gateway.call_many); behind PaywallGate |
| Wed 27 May | Stripe tier wiring: £9 Personal / £49 Starter / £149 Pro; PaywallGate; message-count enforcement |
| Thu 28 May | Marketing copy + screenshots; hero shot = BFT council disagreement; write Show HN draft |
| Fri 29 May | Playwright e2e tests; CI matrix node 22 × turbopack |
| Sat 30 May | Perf pass: bundle audit, code-split rails, lazy-load MCP catalogue; preview deploy + 3 reviewers |
| Sun 31 May | Buffer + final polish; capture HN screenshot 2:1 |
| **Mon 1 Jun 08:00 PT** | **Show HN: "OpenMEOK — multi-LLM agent with BFT council audit + EU AI Act MCPs (MIT/Apache)"** |

## Performance targets
- TTFB 200ms (Edge Function)
- JS bundle ≤180KB gz initial
- LCP ≤1.8s on 4G simulated
- First message round-trip ≤800ms via Step 3.5 Flash
- Right rail lazy-loaded after first interaction
- MCP catalogue static at build time

## Viral Mechanism

### Why an OSS dev stars OpenMEOK (3 reasons, none "because it's good")

1. **Free EU AI Act compliance for their own project.** Solo dev panicking about Annex III. `pip install meok-eu-ai-act && python -m meok_eu_ai_act classify ./my_app` → risk classification + draft Annex IV in 30s. Stars + tells tech-lead + installed at work.
2. **Drop-in BFT council for their existing app.** `@openmeok/council` = 5KB npm. One function `councilVote(prompt, providers)`. Devs add as 1-line safety upgrade.
3. **Care-membrane as portable safety eval.** RFC-0001 specifies benchmarkable API. Academics fork to add probes; safety researchers cite. How Detoxify / PromptBench grew.

### Fork → Adopt → Contribute loop
Fork for custom compliance pack → Adopt because re-implementing care/council costs 3 months → Contribute upstream because their MCP needs to ride attestation chain to be trusted.

**Soft moat:** Apache 2.0 code, but trust anchor is centralised at `verify.meok.ai`.

### Star targets
- Month 1: 500 (Show HN front-page + r/LocalLLaMA top-3 + Anthropic Discord)
- Month 3: 2,500 (EU AI Act deadline cycle + Product Hunt #1)
- Month 6: 8,000 (Nov 2026 watermarking cliff + AI Twitter council-audit demo)
- Reference: LobeChat 8K@m6/50K@m24; Open WebUI 10K@m6/90K@m30

### First-100-users channels
- **Hacker News** Mon 1 Jun 08:00 PT — title leads with 3-LLM disagreement screenshot
- **r/LocalLLaMA** Tue 2 Jun — "Ollama-first agent shell, 5 local models in parallel with dissent visible"
- **Cursor MCP marketplace** — submit `@openmeok/cli` + 6 flagships
- **Anthropic Discord #showcase** — "Claude Opus = deep-reasoning lane in 5-LLM council"
- **AI Engineer Summit July** — lightning talk
- **Direct outbound** to 26-target OEM list

## Revenue Projection — Honest

| Tier | Price | Realistic users at month 6 | MRR |
|---|---|---|---|
| Free | £0 | 4,000 self-host | £0 (signal only) |
| Personal | £9/mo | 60 | £540 |
| Starter | £49/mo | 35 | £1,715 |
| Pro | £149/mo | 8 | £1,192 |
| Defence | £999/mo | 0-1 | £0-999 |

**Month-6 MRR: £3,400-£4,500. Annualised £40-55k ARR.** £10k MRR by Month 9 only if Show HN goes top-3 + Pro tier converts.

## Risk Audit — 3 Scenarios

### A. Anthropic ships Cowork (already happening)
**Defensibility:**
- Multi-LLM not single-vendor — EU buyers can't bet on US foreign vendor
- Compliance MCPs Anthropic won't ship (they're horizontal infra)
- Care/council/attestation portable to any model
- Local-first (Ollama burst) vs Cowork cloud

**Verdict:** Not obsoleted; complementary. Ship Cowork-integration MCP as paid.

### B. StepFun open-sources StepClaw
**Defensibility:**
- UK/EU regulatory positioning — Chinese provenance non-starter for UK MoD, EU CRA, NHS, FS
- Maternal Covenant + Noddings — culturally awkward for them to copy
- Existing PyPI/Stripe/attestation infra — they start zero on Western side

**Verdict:** Threatens hobbyist segment, not compliance. Compliance has the cash.

### C. LobeChat adds compliance plugins
**Defensibility:**
- MIT/Apache means they CAN — and we want them to (downloads route to us, receipts to verify.meok.ai)
- Council + attestation NOT pluginnable (architectural integration only happens if host built around it)
- Brand specialisation: LobeChat = consumer chat skins; OpenMEOK = governance + audit

**Verdict:** Risk to free-tier mindshare, not paid-tier compliance buyers. Embrace: ship LobeChat plugin ourselves.

### Composite worst case (all 3 simultaneously inside 9 months)
Remaining market: **regulated UK/EU enterprises buying audited multi-LLM compliance** = still £100m+ by 2027 and nobody else is purpose-built.

**Strategy converges toward compliance-as-product. Lean into regulatory-trust; let competitors fight UX.**

## Subroutes to delete from /os/

```
birth-ceremony, computer-use, consciousness, control-room, dream,
fly-eye, sovereign, sovereign-display, wake → DELETE
tasks → MOVE to /workspace/tasks
any-llm, characters, sovereign-os → MERGE into _components/
settings → KEEP at /os/settings
```
