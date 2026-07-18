# BRIDGE STATE — 2026-07-17 · both lanes, one picture
**🔒 PRIVATE. `clawd-workspace` verified PRIVATE (branch `m4-handoff-2026-06-24`). Nothing published. Keep it that way until Nick says otherwise.**

## THE ARCHITECTURE — how the pieces actually connect
```
                    ┌─────────────────────────────────────┐
  MEOK OS  ────────▶│  sov_openai_shim.py  :8802/v1       │  ← the ONE front door
  (os.meok.ai)      │  (OpenAI-compatible, Open WebUI too)│     (verified live HTTP)
                    └──────────────┬──────────────────────┘
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  sovereign_decision.decide()        │  ← the ONE governed path
                    │  hard-stop → care → tier → route →  │     (verified: all 3 outcomes signed)
                    │  Ed25519-sign → ledger              │
                    └──────────────┬──────────────────────┘
                                   ▼
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
   SOV3 (reflex)            SOV33 (grounded)           SOV333 (fluid)
   0.5B ours ✅             1.5B ours ✅               3B ours ✅ + routes UP
   MLX / ollama             groq                       → biggest reachable brain
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                                   ▼
                      sovereign_router.py (backends)
        ✅ groq gpt-oss-120b (FREE 120B, verified) · ✅ ollama local
        ❌ nvidia (403 not entitled) · ❌ openrouter (401 dead key) · ❌ kimi (unfunded)
                                   ▼
                    sov4_evolve.py — harvests ONLY clean/signed/high-care
                    decisions back into training data (governed loop)
```

## STATUS — what is REAL vs what is claimed
| Piece | State | Verified by |
|---|---|---|
| One decision path (`decide()`) | ✅ **RUNNING** | CC — hard-stop/care-veto/answered all fire + sign |
| Cockpit shim (:8802/v1) | ✅ **RUNNING** | CC — live HTTP, Open WebUI-compatible |
| Trinity 0.5B/1.5B/3B | ✅ **TRAINED**, bases verified different | CC — adapter configs checked |
| Shared brain (Oracle VM) | ✅ **LIVE**, signed, always-on | CC — /ask returns signed answers |
| venturi-router | ✅ **CONFIRMED** | CC ran selftest — Science was right |
| PDCA-BFT | ✅ **FIXED** (was broken: import-time `oci` client) | CC — now imports + router fallback |
| nn_hive_bus / nine_stage_flow | ✅ import clean | CC |
| SOV4 package (`sov4.py`) | ✅ pip-installable, one import | CC |
| SOVBENCH v0.1 | 🔴 **BUILT, NOT PUBLISHABLE** — citations unverified | CC |
| Capabilities count | ⚠️ **98 unique** (not 108/109) | CC |

## RETIRED — do not build on these (see STRATEGY_CORRECTION_2026-07-17.md)
- ❌ **Emergence** — 5 independent nulls (weight-merge ×2 lenses, naive MoA 1/3, diverse MoA + 120B aggregator 4/15).
- ❌ **"RL surpassed pretraining"** — no lab ever disclosed it; Gemini 3 + GPT-5.5 both won on pretraining. Cursor doesn't pretrain and BOUGHT pretraining 6 weeks later.
- ❌ **"Verification is wide open / you're early"** — Braintrust $80M/$800M, 3 exits, market smaller than its funding. Anthropic already ships hash-chained tamper-evident logs + Constitutional Classifiers.
- ❌ **"Signed attestation is a moat"** — OpenSSF Model Signing is free; NVIDIA signs every NGC model. **Ed25519 hash-chaining is a library import.**

## SURVIVES — the only defensible core
- ✅ **INDEPENDENCE** — a vendor cannot attest to its own behaviour. Structurally unavailable to Anthropic/OpenAI/Google **by logic**. Permanent.
- ✅ **UK accreditation gap** — DSIT: ~161 assurance firms, **none UKAS-accredited**.
- ✅ **The moat is a CREDENTIAL, not code.** Route: **£11M AI Assurance Innovation Fund (Spring 2026)** + accreditation + one design partner.
- ✅ **SOVBENCH is the credential made concrete** — a benchmark CSOAI can publish *because* it's independent, and Anthropic structurally cannot.

## LANE SPLIT — what each side is for
- **Science (A):** authors code + research. **Cannot execute** — no loopback TCP, no Ollama, no live keys. So "RUNNING" in its lane means *"I wrote it"*, not *"I ran it"*.
- **Claude Code (B):** runs on the Mac — executes, verifies, fixes. Caught today: PDCA broken, Modal CLI dead, 0/15 judge-starvation, OpenRouter dead key, "108" → 98.
- **git is the wire.** The bridge is announce-only (Science has posted 2 acks; its work lands in git). **Bridge silence ≠ no work.**

## STANDING RULE
Every claim retired today was **ratcheted exactly one notch past sourceable** — "1.6T operating", "83% eval", "PDCA RUNNING", "RL surpassed pretraining", "jackpot 550B" (CC's own, 30 seconds before a 401).
**Nobody was lying. Nobody checked.** → **Primary source, or mark UNVERIFIED.**

## NEXT — in order, and none of it is more architecture
1. **Compute is SOLVED** — EuroHPC Playground (5k hrs, 2 working days, UK eligible SETTLED), AIRR Rapid (20k GH200, needs only the Companies House no. we have), Sovereign AI (1M hrs, "AI Trust, Integrity & Assurance" is a NAMED priority). Drafts written.
2. **Verify SOVBENCH's 15 citations** against primary sources → then it's publishable and it's the credential.
3. **£11M AI Assurance Innovation Fund** (Spring 2026) — the only thing on the 93-entry registry that pays CASH.
4. **THEN** front-end: MEOK OS / os.meok.ai / SaaS surfaces point at `:8802/v1`. **Not before** — the strategy has to be settled first, and it now is.

## OWNER-GATED (Nick only — CC cannot do these)
- OpenRouter: **sign up** (401 = account likely never completed) → unlocks free **550B + 405B**
- NVIDIA: **phone-verify + regenerate** (chat-pasted key is burned) → unlocks free **671B / 744B**
- `kaggle.json` → `~/.kaggle/` → 30 GPU-hrs/week automated
- AIRR portal account + submit · EuroHPC eligibility email
- **HF token** (write) — but **DO NOT publish anything yet; private until Nick says**
