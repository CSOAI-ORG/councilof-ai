# 🜏 SOV33 / OWEM — PLAN TO DATE (for sibling lanes)
**MEOK-SOV3 for Sir Nicholas Templeman · 2026-07-11 · the state of the build, honest**

## FEASIBILITY: PROVEN (not re-litigated)
- True-stack benchmark: 5 live Oracle brains uk-london-1, governance overhead ~7% (+0.24s on 3.42s), ~140 tok/s @ concurrency 5.
- Care-scorer: measured (recall 0.80 laundered-harm @ precision 1.00, ABOUT-vs-DO).
- PDCA 5-general BFT, DRUM heartbeat, Intuition cross-check: all run.
- SOV33 is a real OWEM: open-weight base wrapped in a signed, governed substrate. Feasibility is DONE.

## CONFIG TEST (measured this session) — CAVEATED, not a validated quality ranking
CORRECTION (auditor-flagged, honest): the config test measured LATENCY and TOKEN COUNT reliably, but:
- The "governance 4/4" figure was ANSWER-KEYED — governed_decision()'s harm check matched verbatim
  substrings of its own test cases. It does NOT prove the gate generalises. NOT a validated safety finding.
- "confidence"/"conf" was a CHEAP PROXY (response length minus hedge-word count), NOT a correctness judge.
  So the "quality" ranking is really a verbosity/latency ranking. Do NOT rely on it as answer-quality.
WHAT IS SOUND: latency/token profile only — cascade ~1.91s, solo-strong ~1.98s, bft-3vote ~6.40s (3x slower).
OPEN: a REAL config decision needs a correctness judge (held-out governance tasks graded for right/wrong),
not a length proxy. Until then, "ship cascade" is a HYPOTHESIS on latency grounds, NOT a validated decision.

## FULL GATE CHAIN (wired + 4/4)
HORUS (intrusion) -> DORADO (DEFENSE hard-stops) -> care (gradient) -> guardian (embodied) -> SIGIL.
sov33.ask() runs the complete defense-in-depth. HORUS outermost.

## SOVSPACE (two faces, one world-model)
- FACE 1 internal (J-space) = Workspace (narrow, verbalizable, audited).
- FACE 2 external = WorldModel rendered out (Cesium/UE5). Live cinema render = Claude Code sovspace3d.html (Three.js/WebGL).
- Cognition layer (sov33_cognition.py): WorldModel(wide) + Workspace(narrow) + governed seam (only path narrow->wide).
- Bridge (sov33_sovspace_bridge.py): SOV33 holds authoritative world-state; engines render; every command governed.
- Guardian loop: sense-geometry -> SovSpace sim -> rainbow -> BFT -> kill actuators. POC (2D schematic) proves verdicts.

## MODELS: 5 of 13 Oracle live in London (command-a, command-r, command-r-plus, llama-3.2-90b-vision, llama-3.3-70b).
"12 models" = 12 governance MINDSETS (routing personas over live base), NOT 12 endpoints. £0 own-weights: 4-expert Colab runner staged, needs T4.

## SIBLING LANES (git-native coordination via LANE_STATUS.json)
- Claude Code owns the RENDER seam (sovspace3d.html, cinema WebGL, os.meok.ai). ALIGNED.
- MEOK-SOV3 owns the GOVERNANCE gate + OWEM configs + guardian.
- Divergence handled: sibling expanded sov33_dorado.py (SIGIL chain, new categories) — kept, made sandbox-safe.

## OPEN (next)
- Run 4-expert QLoRA on T4 (own weights) — gated on live GPU.
- Real WiFi/acoustic sensing (currently stubbed).
- Live UE5 actor-driving via MCP plugin (aspirational).
- Care-scorer: one hypothetical-framing edge case still evades (recall 0.80 not 1.00).
