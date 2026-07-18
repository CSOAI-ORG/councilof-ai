# Hatch = a portable, signed MCP agent (the next level)

**The idea (Nick):** a hatched MEOK character becomes its own agent that runs anywhere — its own VM, on-device, or embedded in any top AI company's platform — and connects everywhere via MCP. And the "MCP cards" we've built become that agent's identity. Take both to the next level.

**Verdict: YES — and it's almost entirely OPEN STANDARDS we already run on. Don't build a protocol; fuse three.**

## The fusion (built, live 2026-07-01)
| Layer | Standard (open) | What we shipped |
|---|---|---|
| **Discovery / identity** | **A2A Agent Card** (`/.well-known/agent-card.json`) | `/api/agentcard` — signed A2A card, parameterized by the hatch (`?name`,`?archetype`) |
| **Usage / tools** | **MCP** (JSON-RPC 2.0, streamable-HTTP) | `/api/mcp` — real MCP server: initialize · tools/list · tools/call |
| **Trust / sovereignty** | **MEOK Layer-0** (Ed25519 + fingerprint) | every card signed; verify at `/api/verify` — "verify, don't trust" |

One hatched character → **one signed identity** that is **discoverable (A2A)** + **usable (MCP)** + **verifiable (Layer-0)**. Any host — Claude, another company's platform, a browser OS — reads the agent card and connects via MCP. That's the "new AI-OS SaaS window into any platform."

## The one honest correction: NOT a GCP VM per hatch
A dedicated VM per hatched character **does not scale** (idle cost per character). The lean, correct model — same mind/body split we already documented:
- **Default = serverless** (the `/api/agentcard` + `/api/mcp` functions; scale to zero; ~free). Every hatch gets this for nothing.
- **On-device** = a local MCP stdio server (offline, private).
- **Dedicated GCP VM** = the **premium / always-on** body only when a customer needs it.
Same signed identity, any body. The character's *mind* is the signed card + tools; the *body* is where it runs.

## Cesium nuance
"Become a Cesium 3D MCP" → precisely: the character's MCP advertises a **`world` skill** (fly/scan); **Cesium is one renderer (body)** of that skill. The agent isn't Cesium; it *drives* any 3D host that speaks the world skill.

## What's real now vs next
- **Real & live:** signed A2A card (verified for 'Aria'), well-known path (200), MCP handshake + tools/list + tools/call (govern/sign/verify/talk) — E2E 95/95.
- **Next (to make each hatch truly its own agent):** per-character memory + persona in the MCP server (today it proxies shared tools); an on-device MCP stdio package; a "Connect me to Claude" one-click from the OS hatch; optional dedicated-VM provisioning for premium.

## Open-source to lean on (no reinvention)
MCP SDK (TS/Python, MIT) · A2A spec + samples (Apache-2.0) · our existing Layer-0 A2A substrate (20 governance MCPs). We already hold the rare piece nobody standardises: the **signed, offline-verifiable identity** on top.

**Bottom line:** the hatch and the cards are now the *same thing* — a signed, portable agent. Live at `os.meok.ai/api/agentcard` + `os.meok.ai/api/mcp`.
