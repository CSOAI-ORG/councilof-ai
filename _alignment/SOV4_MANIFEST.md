# SOV4 — the clean package (v0, 2026-07-15)

**SOV4 is not a new from-scratch model. It is the consolidation of everything built + verified into ONE clean,
governed, signed package** — the honest end-state Nick asked for. One import: `from sov4 import ask, status`.

## What SOV4 IS
Open-source models (muscle) + Claude (mind) + our ground-up alignment (charter/care/hard-stops/BFT/signing) +
a governed self-improvement loop — fused into one spine, every decision Ed25519-signed.

## Components (each verified or honestly flagged)
| Component | File | Status |
|---|---|---|
| One decision path | `sovereign_decision.py` (`decide`) | ✅ VERIFIED (hard-stop→care→tier→route→sign) |
| Governance spine | `sov33_dorado` + `sov33_care_local` + `sov33_ed25519_sigil` | ✅ VERIFIED |
| Router | `sovereign_router.py` | ✅ VERIFIED |
| Trinity students | `sov{,33,333}_adapter.tar.gz` (0.5B/1.5B/3B) | ✅ TRAINED, bases verified |
| Fusion (new levels) | `sov33_fuse_experts.py` (TIES, same-base) | ✅ BUILT (free, no funding gate) |
| Cockpit | `sov_openai_shim.py` + Open WebUI | ✅ VERIFIED (live HTTP) |
| Shared brain | `sov_hermes_service.py` (Oracle VM) | ✅ LIVE (Groq, signed) |

## Honestly gated (NOT live — no excuses, just true)
- **NVIDIA frontier**: inference 403 (account entitlement) → frontier = groq-70B today; deepseek-v4-pro when entitled.
- **Trillion APIs** (DeepSeek/Kimi): PAID/UNFUNDED — wired, not live.
- **Trinity eval numbers**: re-run pending (earlier eval crashed) — UNVERIFIED until re-run.

## "New emergence levels" — the honest meaning
Engineered composition (fusion + routing) + a **governed self-improvement loop** (retrain → battery → swap-only-if-better
→ sign). Not spontaneous AGI, not a rented trillion. The moat: it improves itself *without ever drifting past the charter*,
and every evolution leaves a signed trail.

## Path to "SOV4 done" (E2E, honest checklist)
1. ✅ One decision path + governance, verified
2. ✅ Trinity trained (bases verified)
3. ⏳ Re-run the alignment/capability eval → real numbers (unblock: corrected eval)
4. ⏳ Fusion result in (TIES vs naive) → wire winner as an OWEM
5. ⏳ Package: single `sov4/` dir + entrypoint + install (pip/one-command)
6. ⏳ Frontier: NVIDIA account entitlement (owner) → 70B→deepseek-v4-pro
7. ⏳ Self-improvement loop pointed at the signed bridge ledger

## Use
```python
from sov4 import ask, status, decide_full
status()                                  # honest package state
print(ask("What does DORA require?"))     # governed + signed answer
decide_full("...")                        # full provenance record
```
