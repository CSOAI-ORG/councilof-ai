# "A brand-new Layer-0 agent protocol with the AI inside the container?" — research + honest verdict

_2026-07-01. Deep-research run wf_802555db-071 (verification rate-limited → claims below are EXTRACTED-but-UNVERIFIED leads with sources; treat as strong, re-verify when limits clear) + my own cited searches. Honesty register: this **corrects** my earlier "genuine white space" framing._

## VERDICT: don't build a new protocol. The portable-signed-agent-package niche is ALREADY being standardized. Own the one edge nobody else has: **sovereign, offline-verifiable, governed identity.**

### What's already real (so a solo founder must NOT reinvent)
- **AGNTCY** (Linux Foundation; Cisco-open-sourced Mar 2025) — packages an agent (OASF record) as a **standard OCI artifact** (content-addressed, SHA-256), **Sigstore-signed** (cosign/Notary), uses **W3C DID + Verifiable Credentials** for identity, treats **MCP servers as first-class identity subjects**, and is explicitly a **convergence layer over A2A + MCP**. Active draft `draft-mp-agntcy-ads-00`, **2026-01-12**. → *This is exactly "portable signed agent package," backed by the Linux Foundation.* `[unverified-lead; agntcy.org, linuxfoundation.org]`
- **MCP sampling + tool-calling** (SEP-1577, Nov 2025): a server CAN run its own agentic reasoning loop borrowing the host's model (no server API key). BUT — **Claude Code doesn't support sampling**, and sampling is **deprecating 2026-07-28 (SEP-2577)** → MRTR pattern. So "AI reasoning inside the server via the host model" is possible but a **moving, risky** target. `[unverified-lead; modelcontextprotocol.io, gh anthropics/claude-code#1785]`
- **Letta Agent File (.af)** — open format serializing a stateful agent (persona + memory + tools + LLM settings + history). Portable agent *state* is solved + open. `[verified via my search; github.com/letta-ai/agent-file]`
- **Signed agent identity is a live race**: **Sigstore-a2a** (keyless/OIDC card signing), A2A issues *"Sign agent cards for the love of god!"*, an **AIP** arXiv protocol, W3C DID/VC. `[verified via my search; github.com/sigstore/sigstore-a2a]`
- **IBM ACP / BeeAI** — halting independent dev, converging with A2A. `[unverified-lead; arxiv]`

### Can the MODEL live "inside the container"? Honest: no (lean path), except on-device.
Model weights are too big for serverless/edge. Real options: **BYO host model** (MCP sampling/MRTR, but deprecating), **on-device** (llamafile/Ollama/WASM — the only literal "model-in-a-file"), or **hosted API**. So the portable thing is the **AGENT (mind: persona+memory+policy+identity+tools)**; the **MODEL is pluggable**. "AI inside the container" = *mind inside, model any body.*

## The uncontested edge (this is the play)
Everyone above signs **keyless via a CA/OIDC trust root** (Sigstore/Fulcio) or proposes **DID/VC** — all need an **online** authority. **Nobody ships a sovereign, self-owned, OFFLINE-verifiable Ed25519 identity with EMBEDDED governance (care-floor + immutable hard-stops).** That's our moat — the same one as the signed System Card.

**So the move:** don't launch "MEOK Protocol." Launch **the Sovereign Governance Profile** — a signed, offline-verifiable, governed profile that **rides** AGNTCY(OASF/OCI) + A2A + MCP + Letta .af, and adds the sovereignty+governance layer they lack. Ride the Linux Foundation standard; own the sovereign-governed edge. Contribute our governance profile upstream (AGNTCY/A2A) rather than fork.

## Built (lean proof, live)
- `/api/sap` — **Sovereign Agent Package** = one Ed25519-signed artifact fusing A2A card + MCP endpoint + Letta-.af state + governance (careFloor/hardStops/frameworks); `?format=af` exports Letta-importable state. Positioned as a *profile*, interop list includes AGNTCY/OASF + DID/VC (roadmap). Verify at `/api/verify`. E2E 98/98.
- Prior: `/api/agentcard` (signed A2A), `/api/mcp` (live MCP server).

## Next (honest, high-value)
1. Emit an **AGNTCY OASF-compatible record** + explore contributing a **"sovereign/offline governance" extension** to AGNTCY & A2A (be in the standard, not outside it).
2. **On-device** MCP stdio package + optional **llamafile** bundle (the only real "model in the container").
3. Track MCP **MRTR** (post-sampling) so the server-reasoning path stays current.
