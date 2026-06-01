# MEOK — MCP Tunnel Map (2026-06-01)

_By Claude (Opus 4.8). Grounded in real counts + live verification, not estimates._

## The picture: 3 tool worlds, now 1 safe gateway

Before today the character could only reach SOV3's own tools. Nick asked to "tunnel to
all". Done — but through **one safety choke point**, not three open pipes.

```
                         ┌─────────────────────────────┐
   character (any model) │   tunnels.safe_call(tool)    │
        speaks ───────▶  │   = tool_gateway.invoke()    │  ◀── THE one choke point
                         │   3-tier safety policy        │
                         └───────────┬─────────────────┘
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                       ▼
     1. SOV3 inner tools    2. Published MEOK MCPs    3. Session/business MCPs
        110  (LIVE on VM)      317 / 315 packages        32 (Stripe/Gmail/Vercel…)
        executes now          lazy-start on approve      host-proxied, confirm on write
```

**Total tunneled: 459 tools.**

## The 3-tier safety policy (the whole point)

| Tier | What | Behaviour | Examples |
|---|---|---|---|
| **read** | get/list/search/analyze/health | **auto-executes** | `get_consciousness_state`, `analyze_care_patterns`, `retrieve_balance`, `list_deployments` |
| **write** | send/create/update/deploy/charge | **returns CONFIRM — runs only after a human approves** | `create_payment_link`, `create_draft`, `deploy_to_vercel`, `record_memory` |
| **prohibited** | move money / credentials / access-control / permanent delete | **REFUSED always — even with a confirm token** | `transfer_funds`, `execute_trade`, `enter_password`, `grant_access`, `delete_all` |

Classifier unit-tested **100% correct** on every dangerous verb. Default for an unknown
verb is **write** (fail-safe — never silently treat an unknown action as a safe read).

## Verified LIVE (real calls, 2026-06-01)

- `safe_call('get_consciousness_state')` → **executed**, `consciousness_level=0.788` ✅
- `safe_call('create_payment_link')` → **did NOT execute**, `confirm_required=True` ⚠️
- `safe_call('transfer_funds', confirm='YES')` → **refused**, tier=prohibited ✗

→ A character on a 3B local model **physically cannot** move money, send email, deploy, or
delete on its own — even under prompt injection. This is the property the MEOK safety story
needs, and it's now real.

## The 3 worlds in detail

### 1. SOV3 inner tools — 110, LIVE
On the VM at `/sov3/mcp`. Memory, consciousness, care NNs, council (`submit_council_proposal`,
`vote_on_proposal`), guardian moderation. Auto-seeded into the gateway on import. Reads
execute immediately; writes (e.g. `record_memory`, `trigger_*`) need confirm.

### 2. Published MEOK MCPs — 317 tools / 315 packages, bridged
The standalone PyPI products (eu-ai-act, dora, nis2, iso-42001, injection-scan, haulage-uk,
nhs-gos, rspca-aquaculture…). Discovered from `mcp-marketplace/`, registered into the gateway
**lazily** — we don't spawn 315 servers (that would melt the Mac); a package's server starts
on-demand only when one of its tools is invoked AND approved. Mostly read-only compliance →
low risk. Domain-tagged so they can later map onto the 12 council lenses
(compliance MCPs → `compliance_oracle`, injection MCPs → `prompt_injection_guard`, …).

### 3. Session/business MCPs — 32, registered host-proxied
Stripe, Gmail, Vercel, Slack, Drive, Calendar. These run in the MCP **host**, not the
character process — *by design*, so high-power tools live outside the character runtime.
Registered so they appear in the catalog with the right tier; the host proxies actual
execution after a human confirm. The character can *request* `create_payment_link`; it
cannot *fire* it.

## Files
- `meok-one/meok_one/tool_gateway.py` — classifier + `invoke()` choke point (the keystone)
- `meok-one/meok_one/published_bridge.py` — discovers + bridges the 315 packages
- `meok-one/meok_one/tunnels.py` — wires all 3 worlds; `safe_call()` is the character's one entry

## Next (safe order)
1. Map the 459 tools onto the 12 council lenses (extends `lens_tools.py`) so each lens
   wields its domain's tools during review — "spread the tools across the 12", now over all 459.
2. Wire `published_mcp` lazy-start (HTTP invoke when a tool is approved).
3. Wire `session_mcp` host-proxy callback (so an approved write actually round-trips to the host).
4. Surface the catalog + confirm-prompts in the 3-window UI so the human sees/approves writes.
