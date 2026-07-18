# SOV4 — 72H CONNECTION MAP (what's WIRED into the entrypoint vs ORPHANED) 2026-07-17

Reachable from entrypoint: 67 / 303 on disk. 236 orphaned (mostly dead scaffolding + backups).

## Governance-critical spine pieces — wiring status

### DRUM (time)
- ORPHAN ❌  sov33_drum_clock
- ORPHAN ❌  sov33_dream_scheduler

### ARUM (layers)
- ORPHAN ❌  sov33_arum

### JRUM (memory)
- ORPHAN ❌  sov33_evolve_forest
- ORPHAN ❌  sov33_jrum
- WIRED ✅  sov33_memory_bridge

### KRUM (trust)
- ORPHAN ❌  sov33_ed25519_sigil
- ORPHAN ❌  sov33_independent_verifier

### governance gates
- WIRED ✅  sov33_care_local
- WIRED ✅  sov33_dorado
- ORPHAN ❌  sov33_dorado_owem
- ORPHAN ❌  sov33_consent_gate
- ORPHAN ❌  sov33_compliance_checker
- WIRED ✅  sov33_horus

### BRUM (engine)
- WIRED ✅  sov33_brum
- WIRED ✅  sov33_hybrid_router
- ORPHAN ❌  sov33_brain_fleet
- ORPHAN ❌  sovereign_router

### awareness/learning
- ORPHAN ❌  sov33_self_awareness
- ORPHAN ❌  sov33_learning_ledger

**Spine wiring: 6 wired, 14 orphaned.** The fix is ONE spine-integration layer in ask(), not 236 edits.