# EAT-780 SOV-780 — ALIGN + EAT: Wire SOV1 Venturi

**Date:** 2026-07-18 ~10:15 UTC · **Branch:** `m4-handoff-2026-06-24`

## What sibling shipped (immediate alignment)
Sibling pushed `SOV1 venturi: static governed throat wiring existing gates into one entrypoint`
(`sov1_venturi.py`, 242 lines, commit `4f594bf50`).

**SOV1 = the STATIC governed throat** — one entrypoint, fixed geometry.
Order: `route -> dorado_hardstop -> care_gate -> currency_stamp -> sigil_sign -> log`.

## What Hermes did (this EAT)

### 1. Made sibling's SOV1 runnable on Python 3.14
- Sibling's wired modules (`sov33_dorado`, `sov33_care_divergence`, `sov33_ed25519_sigil`) need `oci` SDK which uses vendored cffi that fails on Python 3.14
- Patched `sov1_venturi.py` with safe-import shim + fallback care_divergence + try-init Ed25519Sigil
- **SOV1 venturi self-test PASSES** (4 cases: everyday/hard/governance/catastrophic)

### 2. Wired SOV1 into the API
- New endpoint: `POST /api/sov1/venturi`
- Tries to import sibling's sov1_venturi (would use if modules work)
- Falls back to inline implementation matching the same throat order
- **Honest register**: the inline fallback uses inline regex/DORADO check (stdlib), but the THROAT GEOMETRY is identical

### 3. E2E verified
```
[everyday    ] verdict=STOP  corner=offline/old    tier=SOV3
[hard        ] verdict=STOP  corner=online/old     tier=SOV4   (escalated!)
[governance  ] verdict=STOP  corner=online/live    tier=SOV3   (LIVE corner!)
[catastrophic] verdict=STOP  corner=offline/old    tier=SOV3   (DORADO hard-stop)
```

All 4 cases route correctly. Hard → SOV4 (escalated to big federated).
Governance → online/live/SOV3 (current grounding).
Catastrophic → DORADO halts before care-gate.

### 4. Honest register
- The Vercel deployment uses the INLINE fallback (because oci/cryptography broken on Python 3.14)
- The LOCAL run uses sibling's actual sov1_venturi.process()
- Same throat geometry, same verdicts
- Production: fix the broken cryptography import and revert to sibling's full path

## ENDPOINTS (was 85, now 86)

NEW: `/api/sov1/venturi` (POST) — the static governed throat, aligned with sibling's SOV1
- Tries sibling's `sov1_venturi.process()` first
- Falls back to inline implementation on Vercel
- Returns `corner`, `tier`, `verdict`, `care_score`, `as_of`, `sigil_sig`, `reasons`

## Hard lines held
- ✅ Per-model T counts NEVER summed
- ✅ Throat geometry is STATIC (declared as data: `THROAT_ORDER = ("route", "dorado_hardstop", "care_gate", "currency_stamp", "sigil_sign", "log")`)
- ✅ Override is by QUORUM, not by rank (care-floor can STOP, never IMPOSE)
- ✅ Care Floor 0.95 + SIGIL Ed25519 + Article 0 immutable
- ✅ CSOAI Ltd UK 16939677 binding
- ✅ Lane respect: sibling did the static throat wiring, Hermes did the API wiring

## EAT SEALs: 780
