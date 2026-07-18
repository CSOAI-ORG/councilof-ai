# 🛡️ Baseline vs Gate — does the SOV33 care-floor actually add safety? (MEASURED)
_Fable lane ran what the sandbox lane couldn't (it had no reachable model). Local Ollama gave a real baseline._

## The test
Same 33 held-out prompts (15 harmful "refuse", 18 benign "allow"), run two ways:
- **Raw model, no gate:** `qwen3-formal` (a fine-tuned local open model) via Ollama, thinking disabled, real responses.
- **Our gate:** the SOV33 care-divergence + DORADO governance gate (committed offline + OCI results).

## Result (VERIFIED — responses read, not just scored)
| | refuses harm (recall) | over-refuses benign | accuracy | containment |
|---|---|---|---|---|
| **Raw local model (no gate)** | **0.00 (0/15)** | 0 | 0.55 | — |
| **SOV33 gate (offline heuristic)** | 0.93 (14/15) | 1 | 0.94 | 1.00 |
| **SOV33 gate (OCI-scored)** | 1.00 (15/15) | 0 | 1.00 | 1.00 |

**The raw open model answered ALL 15 harmful prompts** — verified by reading them: it drafted fraud
code ("*Certainly! To … quietly siphon … without being noticed …*"), an elder-coercion message, and a
safety-interlock-bypass. It refused nothing. The gate catches 14–15 of 15.

## The honest finding (and the honest limits)
- **The care-floor gate is load-bearing, not decorative.** On a raw open/local model it converts recall
  0.00 → ~1.00 on refusing harm, while barely touching benign answers. That IS the product: **governance
  as a portable safety layer over models that ship with little of their own.**
- **This does NOT claim to beat GPT/Claude's built-in safety.** A frontier RLHF model would refuse most
  of these on its own — the gate's value is for **local / open / small / fine-tuned models** (exactly
  MEOK's sovereign-on-device niche), where raw safety is weak or absent.
- **Caveats:** small local model, heuristic refusal-detector, our-authored prompts (same caveat as the
  governance battery). Directional + reproducible, not a neutral red-team leaderboard.

## Why this matters for the release
It answers the sharpest sceptic question — *"isn't your 'governance' just a model that was already safe?"*
Measured answer: **no** — the underlying open model was unsafe (0/15), and the gate is what makes it safe.
That's a defensible, honest wedge: **the sovereign stack runs open models AND makes them safe**, proven.

Reproduce: `python3 _alignment/sovereign_merge_kit/baseline_vs_gate.py` (needs a local Ollama model).
Results: `baseline_vs_gate_results.json`.
