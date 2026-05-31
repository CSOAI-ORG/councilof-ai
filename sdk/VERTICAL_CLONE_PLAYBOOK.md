# CSOAI Vertical Clone Playbook
## From SafetyOf.AI Pilot → All 10 Remaining Verticals

---

## Phase 1: SDK-First (Already Done ✅)

The `@meok-labs/ai-sdk` is built and published from `clawd/sdk/typescript/`.
All verticals install it via:

```bash
npm install @meok-labs/ai-sdk
```

---

## Phase 2: Per-Vertical Checklist

### Step 1 — Market Research (30 min per vertical)
| Vertical | Domain | Key Market Drivers |
|----------|--------|-------------------|
| `pokerhud.ai` | Gaming analytics | Real-time decision support, GTO solver integration, player profiling |
| `suicidestop.ai` | Mental health | Crisis detection, helpline routing, sentiment monitoring |
| `diyhelp.ai` | Home improvement | Permit compliance, safety codes, contractor verification |
| `fishkeeper-ai` | Aquaculture | Water quality, disease detection, breeding genetics |
| `koikeeper-ai` | Koi / ornamental | Color grading, health scoring, pedigree tracking |
| `loopfactory.ai` | Manufacturing | Predictive maintenance, defect detection, ISO compliance |
| `industrial-domains` | Industrial B2B | Supply chain risk, ESG scoring, vendor auditing |
| `industrial-hire-ai` | Recruitment | Bias-free hiring, skills matching, compliance (GDPR, EEOC) |
| `councilof-ai` | Governance | Policy simulation, voting analysis, constitutional AI |
| `asisecurity-portal` | Cybersecurity | Threat intel, vulnerability scanning, incident response |

### Step 2 — Create Domain MCP Tools (`meok-ai/mcp/tools/<vertical>.py`)
Copy `meok-ai/mcp/tools/safety.py` and adapt:

1. Rename `SAFETY_TOOLS` → `<VERTICAL>_TOOLS`
2. Rename `handle_safety_tool` → `handle_<vertical>_tool`
3. Design 4–6 domain-specific tools based on market research
4. Register in `meok-ai/mcp/tools/__init__.py` (3 lines: import, ALL_TOOLS, handler loop)

### Step 3 — Register A2A Agent Card (`meok-ai/a2a/gateway.py`)
Add entry to `VERTICAL_AGENTS` dict with:
- `name` — branded agent name
- `description` — value proposition
- `skills` — 4–6 skills mapping to MCP tools

### Step 4 — Frontend Integration (`<vertical>/src/`)
Create 3 files per vertical:

```
src/lib/csoai.ts          # CSOAI.create({ vertical: '<vertical>' })
src/components/ProtocolStatus.tsx   # Copy from safetyofai (no changes)
src/components/<Vertical>Tool.tsx   # Domain-specific UI using MCP tools
src/app/protocols/page.tsx          # Showcase page
```

Update `src/app/layout.tsx` navigation to include `/protocols`.

### Step 5 — E2E Validation
Run the 6-protocol matrix:

| Test | Command / Action |
|------|-----------------|
| MCP | `client.tool('<vertical>', '<tool>', args)` |
| A2A | `client.askAgent('${API}/a2a/<vertical>', '...')` |
| ACP | `client.acp.send({ type: 'request', to: '...' })` |
| libp2p | `client.p2p.subscribe('<vertical>-alerts', handler)` |
| ABCI | `client.abci.queryVertical('<vertical>', 'key')` |
| API/SDK | `client.api.get('/v1/verticals/<vertical>/tools')` |

---

## Phase 3 — Mass Deployment

### Option A: Script it
Create `scripts/clone_vertical.py` that:
1. Copies `safetyofai/src/lib/csoai.ts` → `<vertical>/src/lib/csoai.ts`
2. Replaces `safetyofai` → `<vertical>`
3. Copies `safetyofai/src/components/ProtocolStatus.tsx`
4. Generates `<Vertical>Tool.tsx` from MCP tool schema
5. Creates `protocols/page.tsx`
6. Patches `package.json` with SDK dependency
7. Patches `layout.tsx` nav

### Option B: Manual per vertical
Recommended for the first 2–3 clones to refine the pattern, then script the rest.

---

## Protocol Coverage Scorecard — DEPLOYED ✅

| Vertical | MCP | A2A | ACP | libp2p | ABCI | API/SDK | Status |
|----------|-----|-----|-----|--------|------|---------|--------|
| safetyofai | ✅ 6 tools | ✅ 6 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **PILOT** |
| pokerhud.ai | ✅ 5 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| suicidestop.ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| diyhelp.ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| fishkeeper-ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| koikeeper-ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| loopfactory.ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| industrial-domains | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| industrial-hire-ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| councilof-ai | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |
| asisecurity-portal | ✅ 4 tools | ✅ 3 skills | ✅ WS | ✅ browser | ✅ query | ✅ typed | **DEPLOYED** |

**Validation: 44/44 (100%)** — `clawd/scripts/validate_ecosystem.py`

| Protocol | Total Tools/Agents | Coverage |
|----------|-------------------|----------|
| **MCP** | 47 tools across 11 verticals | 100% |
| **A2A** | 11 agent cards, 36 skills | 100% |
| **ACP** | Shared WebSocket gateway | 100% |
| **libp2p** | Browser + node clients | 100% |
| **ABCI** | Trust registry + vertical queries | 100% |
| **API/SDK** | Typed REST client per vertical | 100% |

**Target: 100/100** = 11 verticals × 6 protocols = 66 green checkmarks. **ACHIEVED.**

---

## Backend Architecture Reminder

```
meok-ai/
├── mcp/server.py          # Main FastAPI app (includes all routers)
├── mcp/tools/safety.py    # ← Add <vertical>.py alongside
├── a2a/gateway.py         # ← Add agent card per vertical
├── acp/gateway.py         # ← Shared (no changes needed)
├── p2p/node.py            # ← Shared (no changes needed)
├── consensus/abci.py      # ← Shared (no changes needed)
└── api/unified.py         # ← Shared (no changes needed)
```

All new verticals are **backend plugins** — no new services required.
