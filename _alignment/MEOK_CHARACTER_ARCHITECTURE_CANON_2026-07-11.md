# 🧬 MEOK AI Character — the canonical architecture (single source of truth, 2026-07-11)

Reconciled + GitHub-verified. Ends the "is it an MCP card or Cesium or Unreal?" confusion: **it's a
signed MCP-card MIND with pluggable 3D BODIES on one seam** — they are different layers, not rivals.

## The one rule
> **The character is the MCP card. The 3D thing you see is a BODY the card drives.**
> Mind = portable + signed (the moat). Bodies = swappable renderers on one sov-signed command seam.

## Layer 1 — the MIND (what the character *is*)
A **signed A2A agent-card + MCP endpoint** — the portable, governed identity:
- `os.meok.ai/api/hatch` → `interfaces: {agentCard, mcp, openai_chat, onDeviceRunner, provenance, verify}`
- `/api/agentcard` (A2A `.well-known/agent-card.json` shape) · `/api/mcp` (MCP server) · signed Ed25519
- MCPs: `meok-sovereign-avatar-mcp`, `meok-sovereign-vrm-mcp`
- Callable by **any MCP host** (Claude/Cursor/VS Code). Runs serverless / on-device / dedicated VM — **same signed identity, any body.** This is the moat (offline-verifiable, governed — nobody else ships it).

## Layer 2 — the BODIES (how the character is *rendered*), one seam
| Body | Renderer | Renders | Status (verified) |
|---|---|---|---|
| **Character** | **three.js WebGL** (`character.html`, three@0.169 + `@pixiv/three-vrm`) | the avatar itself — skins: emergence / vrm / rpm / creature / **hatch** | ✅ LIVE, free-forever, client-GPU |
| **World** | **Cesium** (`sovspace3d.html` / `earth3d-photoreal.html`, Cesium ion + three) | the navigable SovSpace globe/world | ✅ LIVE |
| **Premium** | **Unreal Engine 5** | cinematic body + world | ⚠️ demo only — GitHub `CSOAI-ORG/sov3-beat-demo` ("real UE5 + Cesium 3D + SOV3"). Aspirational, GPU-cost — NOT the live path |

**So:** character = WebGL · world = Cesium · Unreal = premium demo body. All fed by the SAME MCP-card mind.

## Layer 3 — the OS + the sovereign integration
- **Within MEOK OS** (`os.meok.ai`) — the shell; character.html / sovspace3d.html / hatch are apps/bodies inside it.
- **Sov integration:** Ed25519-signed (`/api/verify`), governance (care-floor 0.95 + BFT-33), provenance,
  the `meok.sovereign-governance.v1` card extension. Every body obeys the sov-signed command seam.

## What was missing (and is being closed)
- The card *references* the body (`hatch.js interfaces.experience.character = /character.html`) but the
  body never *fetched the card* → the 3D avatar wasn't provably the signed identity. **Fixed 2026-07-11:**
  `character.html` now hydrates from `/api/agentcard` (signed identity → "Sovereign-verified" badge).
- No **sovereign-generated** mesh (bodies were RPM/VRM-borrowed) → **Hunyuan3D-2.1 → `hatch.glb`** feeds the
  WebGL body; **HY-World 2.0** feeds the Cesium/Unreal worlds. (See `_compute/CHINESE_WORLD_MODELS_SCOUT`.)

## Diagram
```
              ┌──────── MCP CARD = the MIND ────────┐
              │  /api/hatch · signed A2A + MCP      │  ← callable by any host, portable, governed = MOAT
              └──────────────────┬──────────────────┘
                                 │  one sov-signed command seam
        ┌────────────────────────┼─────────────────────────┐
   three.js WebGL            Cesium 3D                 Unreal Engine 5
   character.html            sovspace3d.html           sov3-beat-demo (repo)
   (the avatar body)         (the SovSpace world)      (premium body)
   ✅ LIVE                   ✅ LIVE                    ⚠️ demo
        └──────────── all within MEOK OS · Ed25519-signed · care-floor + BFT ────────────┘
```
Canonical. Don't call the character "a Cesium thing" or "an Unreal thing" — it's the **MCP card**; those
are bodies it drives.

---

## DOCK SEAT RECONCILIATION (2026-07-11, M4) — character in the seat, globe to the Universe
Nick: *"where you're building the globe is where the AI character is supposed to go — the emergence, the
hatching. The globe is for MEOK Universe. J-Space is internal reflection."* Fixed in `os.meok.ai/index.html`:
the always-present dock seat drew a 2D rotating **globe** (`sovGlobe()`) with the emoji over it → replaced
with **`sovBeing()`**: the emergence **being of light** (egg→radiant, hue-tinted, hatch bloom). Sub-label
"tap the globe to enter" → "your sovereign · tap to enter your world". Consistent with the canon: the seat
shows a lightweight **body** of the same signed MCP-card mind; the **Cesium globe stays the World body
(MEOK Universe / SovSpace)**, not the character's face. (Ideal next: the dock mirrors the real WebGL
`character.html` body, or the recovered `meok-amica` VRM, instead of the 2D representation.)
