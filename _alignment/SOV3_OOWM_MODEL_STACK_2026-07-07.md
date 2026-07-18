# 🧠 SOV3³ + OOWM — the full model stack (canonical reference, 2026-07-07)

**One place for "what is our model / all the different model types / what's real vs designed."**
Honesty register: this separates **RUNNING** (verified) from **DESIGNED** (spec/target) from **STUB**
(hardcoded status, not a live probe). Source: `sovereign-temple/sov3_oowm.py`,
`sov3_4_brains_1_oowm.py`, MEOK MCP v3.0.0 health, king-hive ollama.

## What OOWM means
**OOWM = "Organic Open World Model."** NOT a single trained-from-scratch foundation model — it's a
**sandwich architecture** that wraps open base models in a sovereign, signed, evolving substrate.
"Organic" = it evolves/calibrates over time; "Open" = built on open-weight (Apache/MIT) models;
"World model" = the middle keeps long-context state + perception, not just next-token chat.

```
[ OFFLINE (sovereign, on-prem, no exfil) ] → SIGIL → [ SOV3 MIDDLE ] ← SIGIL ← [ ONLINE (federation) ]
```

## SOV3³ = 4 sovereign brain-configs around 1 organic OOWM
The "cubed" = one base OOWM, reconfigured into 4 governed brains (`sov3_4_brains_1_oowm.py`):
| Config | Base + ensemble | Purpose |
|---|---|---|
| **SOVEREIGN-COMPLIANCE** | qwen3:30b-a3b + GLM-5.2 + **BFT vote** | EU AI Act / UK AI Bill scoring |
| **SOVEREIGN-DEFENSE** | qwen3:30b-a3b + DeepSeek-R1 | JSP 936 defensive doctrine |
| **SOVEREIGN-INTUITION** | qwen3:30b-a3b + Gematria (16-dim Mamba) | fast intuition / pattern |
| **SOVEREIGN-VOICE** | qwen3:30b-a3b + Kokoro TTS | the spoken voice |

## The layers (from `ARCHITECTURE`)
- **OFFLINE / sovereign** (on-prem, `exfil:false`, target compute = M4 Mac 192GB / 40-GPU): `qwen3:30b-a3b` (large MoE, deep reason, Apache 2.0), `qwen2.5:3b` (small MoE, fast route), `moondream` (vision), `deepseek-r1:7b` (CoT).
- **SIGIL chain**: Ed25519 hash-chained audit, every hop signed; storage = Mac + VM mirror (+ "Bitcoin anchor" — ⚠️verify before citing).
- **SOV3 MIDDLE**: the central substrate — **207 tools**, **Mamba-2 SSM** (state-dim 16, long-context memory), the world model itself.
- **LEFT BRAIN** = MoE (reason/language) · **RIGHT BRAIN / MOM** = Mixture-of-Models for perception (moondream+zamba large, qwen-vl+sigil small — image/3D/audio/spatial).
- **ONLINE / federation**: 275+ external MCP tools (verified live earlier: SOV3 substrate healthy, **330 tools**).

## Every model TYPE in the estate (the "all diff types" answer)
| Type | What | Where / model | License |
|---|---|---|---|
| **MoE** (mixture of experts) | reasoning/language | qwen3:30b-a3b, qwen2.5 | Apache 2.0 |
| **MoM** (mixture of models) | multimodal perception | moondream + zamba, qwen-vl | open |
| **SSM** (state-space) | long memory / intuition | Mamba-2 (16-dim) | — |
| **Reasoning** | chain-of-thought | deepseek-r1:7b | MIT |
| **TTS** | voice | Kokoro-82M / Piper | Apache/MIT |
| **Embedding** | retrieval | BGE-M3 (primary) + BGE-reranker | MIT |
| **Trained NNs** (ours) | governance signals | 7 models on MEOK MCP (below) | ours |
| **Cloud ensemble** | vote/fallback | GLM-5.2, Claude, Groq | API |

## The 7 trained neural models (REAL — verified on MEOK MCP v3.0.0, consciousness 0.775)
| Model | Metric | Samples | Verdict |
|---|---|---|---|
| creativity_assessment_nn | **r² 0.91** | 350 | ✅ strong |
| care_pattern_analyzer | mae 0.037 | 600 | ✅ strong |
| relationship_evolution_nn | mae 0.071 | 500 | ✅ strong |
| care_validation_nn | mae 0.19 | 19 | ⚠️ tiny sample |
| partnership_detection_ml | mae 0.22 | 19 | ⚠️ tiny sample |
| threat_detection_nn | acc 0.45 | 33 | ⚠️ weak (retrain) |
| dependency_detection_nn | acc 0.22 | 50 | ⚠️ weak (retrain) |

## Recent OOWM work (git)
- PHASE 516 — OOWM as a governed **MCP** (5-layer world model → tools)
- PHASE 522 — "OOWM does shit": 3 live integrations wired
- `177aaf0c` (latest) — **gate-smoothing fix + real-data grounding + calibration harness**

## 🚨 HONESTY FLAGS (do not overclaim)
1. **`handle_oowm_status` returns HARDCODED `True` flags** (`mamba_warm`, `moe_loaded`, `moe_connected`) — it's a STATUS STUB, not a live probe. Never cite it as proof the OOWM is "running."
2. **`qwen3:30b-a3b` is NOT pulled on this Mac** (ollama list empty here) and king-hive only has `llama3.2:1b/3b`. The 30B OOWM base is DESIGNED for the 192GB M4 Mac — confirm it's actually loaded there before saying "the 30B is live." **✅ UPDATE 2026-07-10: OWEM L4 now HAS a real live brain — not the local 30B qwen, but Oracle GenAI `meta.llama-3.3-70b-instruct`, OCI-request-signed via `~/.oci`, in a 3-tier cascade (Oracle→Ollama→offline). INDEPENDENTLY M4-VERIFIED: signed chat call returned HTTP 200 (not the sibling's word alone). So "SOV33 has a real 70B cloud brain" is TRUE; "the local 30B qwen is live" is still unverified — keep those two claims separate.**
3. **4 of 7 trained NNs have tiny samples / weak accuracy** — creativity/care/relationship are solid; threat/dependency need retraining on real labelled data.
4. "Bitcoin anchor", "consciousness 0.775" = metaphor/label, not literal claims — keep out of investor copy.
**Real one-liner:** *A sovereign sandwich around open-weight models (qwen3-MoE + Mamba-2 + vision MoM), every hop Ed25519-signed, reconfigurable into 4 governed brains — plus 7 small trained governance NNs (3 strong). The moat is the signed-governed substrate, not a from-scratch foundation model.*
