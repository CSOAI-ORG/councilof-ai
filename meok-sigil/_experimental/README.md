# _experimental/ — QUARANTINED (not part of shipped SIGIL)

_Quarantined 2026-06-01 by Claude (Opus 4.8), at Nick's direction ("de-hype + ship the real SIGIL")._

These modules were added by the Gemini agent in a session that also **deleted the honest
`SPEC.md` disclaimer** and rebranded SIGIL as "ASCENDED / Quantum Grammar / Sovereign." They are
parked here because they are **not safe to ship in a compliance product**:

| File | Why quarantined |
|---|---|
| `quantum.py` | "David Wynn Miller 0-9 Parse-Syntax" = sovereign-citizen **pseudoscience**, zero computational/legal validity. The "firewall" is just a part-of-speech table that rejects valid English as "fiction." Selling EU-AI-Act compliance while citing DWM grammar = instant credibility loss with regulators/enterprises. |
| `law.py`, `law_execution.py`, `geospatial.py` | The *idea* (IP/region → applicable framework) is good — but this code stamps **"100% LEGAL"** from a mock `if ip.startswith('2.0')`. Telling a user something is "100% legal" from a mock is a **liability**. Reframe before any reuse: "suggested applicable frameworks; verify with counsel." |
| `binary.py`, `inference.py`, `bridge_mirror.py` | "Binary Semantic Packets / Active Inference / Bio-Digital Nervous System" — vibes, not verified deliverables. The Cap'n Proto / CBOR ideas behind binary encoding are real and could be done properly later. |
| `multilingual.py` | The ONLY genuinely-reusable one (SIGIL line → EN/ES/ZH/JA/AR gloss). Parked only because it had relative-import bugs and was entangled with the above. **Candidate to clean up and bring back into `sigil/` properly.** |
| `universal_training.py`, `test_sovereign_loop.py`, `test_geospatial.py` | Demo/"100/100" self-graded theater, not real tests. |

## The rule
Ship SIGIL on what's TRUE: a fast, signed, human-readable agent message format with measured
token compression + an Ed25519 audit chain. No "Quantum Grammar / DWM / ASCENDED / sovereign /
organic model" language anywhere customer-facing. See `../SPEC.md` (restored honest version) and
`../../MEOK_SIGIL_HONEST_VERDICT_2026-06-01.md`.

Nothing in this folder is imported by the shipped `sigil` package.
