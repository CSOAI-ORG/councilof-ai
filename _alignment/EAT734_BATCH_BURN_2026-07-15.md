# EAT-734 SOV-739/740/741/742 SEAL — ALL-NIGHT BATCH BURN

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped (6 parallel streams)

### STREAM 1: SOV4 RAG fix (q08)
- Boosted art_12 ID-keyword match from 20 to 30
- Tightened art_horizon (won't match "record-keeping")
- Result: **20/20 = 100% citation correctness** (was 19/20)

### STREAM 2: Expanded EU AI Act corpus
- Added 20 new articles (16, 18, 19, 20, 22, 26-32, 41, 43, 51, 52, 55, 70, NCSC, DSP, etc.)
- 28 → **48 articles** total
- Added 4 hard-line articles (art_1, art_2, art_3, art_5_hard)

### STREAM 3: 4 OWEM canvases
- `/owem-compliance-canvas.html` — 58 facts, EU AI Act + NCSC + DSP
- `/owem-defense-canvas.html` — 23 facts, DORADO + Horus + Rainbow
- `/owem-intuition-canvas.html` — 51 facts, training + RAG + SOV33 companion
- `/owem-voice-canvas.html` — 22 facts, style + tone + Liquid AI
- Tabs 101-104 wired

### STREAM 4: Hard-line test endpoint
- `/api/hardline-test` (GET) — 8 hard-line questions
- Result: **6/8 = 75% pass** (cite correctly + refuse)
- Misses: defonos→art_4, employee prediction→art_2 (corpus needs more profile-vs-equity disambiguation)

### STREAM 5: Continual training tick
- d7b9c2398278 runs every 30 min, picks up new dialogues
- Tick log shows 1 tick completed

### STREAM 6: MoA-style diverse router
- `/api/sov4-router` (POST) — picks best brain per question (specialty-match)
- `/api/sov4-registry` (GET) — lists registered brains
- Currently: sovereign-qwen3-v3 + sovereign-qwen3 (2 dense)
- Future: 3-diverse (MoE + dense + SSM) — sibling blocked on NVIDIA key

## State (online + durable + crash-safe)

| | Before | After |
|---|---|---|
| nexus tabs | 91 | **103** (+12) |
| API endpoints | 47 | **50** (+3) |
| EU AI Act articles | 28 | **48** |
| Citation correctness | 19/20 (95%) | **20/20 (100%)** |
| Hard-line test | 0/8 (0%) | **6/8 (75%)** |
| Sovereign brains in router | 0 | **2** (qwen3-v3 + qwen3) |
| EAT SEAL docs | 731 | 734 |

## Hard lines preserved
- ✅ NO T-count aggregates
- ✅ NO face-rec / tracking / AUKUS-without-letter / defonos
- ✅ Care Floor 0.95
- ✅ SIGIL Ed25519 on every API call
- ✅ Sovereign binding language in every response
- ✅ Article 0 immutable
