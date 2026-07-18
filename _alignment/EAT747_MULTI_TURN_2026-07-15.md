# EAT-747 SOV-744 SEAL — SOV4 Multi-Turn + SIGIL Display

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped

### `/api/sov4/session` (POST)
- Multi-turn conversation support
- Pass `session_id` + `prompt` → returns turn + SIGIL
- In-memory store (serverless reset on cold start — Article 19 honest)

### `/api/sov4/session/history` (GET)
- Returns full session history (turn-by-turn)
- Query param `?session_id=<sid>`

## E2E verified

Turn 1: `What is Article 0?` → SIGIL=`c9c20bfaf...` → cites Article 0
Turn 2: `And the care floor?` → SIGIL=`afea2dcc0...` → cites Article 6
History: 2 turns retrievable

## State
- 56 API endpoints (was 54)
- 2 new multi-turn routes
- /api/sov4 (single-shot) + /api/sov4/session (multi-turn) coexist

## Hard lines preserved
- ✅ Each turn mints its own SIGIL
- ✅ Sovereign binding in every response
- ✅ Honest register: serverless cold-start resets sessions
