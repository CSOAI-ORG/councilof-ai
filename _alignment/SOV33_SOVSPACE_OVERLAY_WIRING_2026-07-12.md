# SOV33 SovSpace Overlay — wiring spec (which existing file → which panel)
_2026-07-12. Builds on MEOK_OS_OVERLAY_VISION.md + SOVSPACE_JSPACE_HERMES_ALIGNMENT + SOV33_END_USER_LAYER_SPEC.
Nothing new invented — this maps the 4-window UX Nick described onto files that already exist. Honest RUNNING/DESIGN split._

## The layout Nick described (4 regions)
```
┌─────────────────────────────────────────────┬───────────────────────┐
│  MAIN WINDOW (desktop)                        │  CHARACTER PANEL (RH) │
│  • MCP cards (tappable tools)                 │  • AI character (VRM/orb)
│  • Cesium globe / UE5 scene (render surfaces) │  • as it works, shows:
│  • whatever the user already has open         │    LEFT-brain J-space  │
│  • MEOK-OS = the menu / launcher              │    RIGHT-brain J-space │
│                                               │  • SIGIL action log    │
└─────────────────────────────────────────────┴───────────────────────┘
```

## Panel-by-panel wiring (file → role → status)

### RH CHARACTER PANEL — "the AI's view of itself as it works"
- **Character avatar/orb** → fork an open shell (Amica/Utsuwa VRM + Tauri overlay; §consolidation). SOV33 is the
  BACKEND it calls. Status: shell DESIGN (fork), backend RUNNING.
- **6-stage lifecycle badge** (🥚→🐣→…) → `character_emergence.compute_emergence_state` via `sov33_companion_layer.py`.
  Status: RUNNING (verified: benign turn care 0.97 stage "🐣 Hatching").
- **Left/right-brain J-space visualization** → the J-SPACE→SOVSPACE mapping (SOVSPACE_JSPACE_HERMES_ALIGNMENT).
  LEFT = analytic/narrow-audited channel; RIGHT = wide-simulation channel (the honest substrate behind the
  "10/90 brain" metaphor — NOT literal neuroscience). Status: mapping DESIGN; render DESIGN.
- **SIGIL action log** (the trust panel) → every governed action already emits a sha256 hop via `sigil_emit`.
  Surfacing that stream live = "watch it work, every step attested". Status: log RUNNING; panel DESIGN.
  THIS is the enterprise-grade differentiator: the audit trail made visible.

### MAIN WINDOW — the character summons + controls tools here
- **MCP cards** → the live :3101 method surface (313 methods) rendered as tappable cards. Card UX DESIGN;
  method surface RUNNING. Character invokes them GOVERNED (care-floor → SIGIL) via `sov33.ask`.
- **Cesium / UE5** → `sov33_sovspace_bridge.py::SovSpaceBridge` is ALREADY the master contract: it holds the
  AUTHORITATIVE world-state; Cesium/UE5 are render surfaces. `command()` passes DORADO→care→guardian→SIGIL
  BEFORE anything renders/actuates. Status: bridge RUNNING (governed frame emitted); render surfaces DESIGN.
  Cesium free path (OSM+NASA GIBS) is live on os.meok.ai per END_USER spec.
- **"Work with whatever the user has open"** → SPLIT: acting through MCP-connected tools = RUNNING primitive;
  driving arbitrary desktop apps = needs a user-consented computer-use agent (NOT SOV33's, NOT claimed).
- **MEOK-OS as menu** → the launcher shell (meok-os-deploy assets exist). Status: DESIGN.

## SovSpace bridged INTO the character (Nick's "show its internals as it works")
SovSpace is the character's INTERNAL world-model (established: internal, not an external metaverse). So the RH
panel rendering SovSpace = the character visualizing its OWN reasoning/world-state. The seam already exists:
`SovSpaceBridge` emits a governed world-state frame → the RH panel renders that frame (globe or J-space view).
Same governed frame drives both the internal panel AND any external Cesium/UE5 surface — one authoritative state,
many surfaces. That is why it can "show its internals AND control the engines" with one contract.

## The build order (all assembly, no new model)
1. Fork the shell (Amica/Utsuwa) → point at `sov33.ask` through care-floor. [character panel alive+governed]
2. Wire the SIGIL log stream → RH trust panel. [the differentiator, cheapest high-value piece]
3. Render `SovSpaceBridge` frame → RH J-space view + main-window Cesium. [one frame, two surfaces]
4. MCP cards from the :3101 surface → main window, governed invocation. [tools the character summons]
5. MEOK-OS launcher shell wraps it. [the menu]

## Honest status line
The overlay is ASSEMBLY of existing seams (companion layer RUNNING, sovspace bridge RUNNING, SIGIL log RUNNING,
MCP surface RUNNING) behind a forked shell (DESIGN) with render surfaces (DESIGN). No new model, no new capability.
The one thing NOT in scope until a consented OS-agent exists: driving arbitrary non-MCP desktop apps.
