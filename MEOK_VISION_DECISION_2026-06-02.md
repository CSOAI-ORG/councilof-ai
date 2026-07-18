# MEOK screen-vision — decision + live result (2026-06-02)

_The "benchmark Gemma 4 vs step3.7" ask, answered honestly. No fabricated accuracy numbers — a
real, run-on-the-VM result + a spec decision for the on-device slot._

## What I could and couldn't measure
- **step3.7 Flash**: needs its API key (we don't have it) + it's a 198B cloud MoE → **cannot run a
  head-to-head on our box.** I will not invent accuracy/latency figures for it.
- **Gemma 4 E2B/E4B**: **not in Ollama yet** (`gemma4` → "model not found") → can't run it today.
- So I benchmarked the **available sovereign options** for real, on the live VM (CPU-only e2-standard-4).

## Live result (VM, CPU, via /api/perceive → local Ollama)
| Model | size | result | time |
|---|---|---|---|
| **moondream** | 1.8B | ✅ `saw:True` — *"urn with yellow and blue light inside"* (correctly read our glass-egg icon) → SIGIL F → **remembered in SOV3** | **~3s** |
| gemma3:4b | 4B | ⏳ timed out / too slow on CPU (>90s) → graceful fallback | >90s |

## Decision
- **On-device / CPU / edge default = `moondream`** (fast, sovereign, no key) — set as the code +
  service default. The full loop is **live**: screen frame → moondream → SIGIL `F`/`D` → SOV3 memory → audit chain.
- **GPU device** (the real overlay home, user's machine) → `gemma3:4b` or **Gemma 4 E4B** when it
  lands in Ollama (richer UI/OCR/bbox). `MEOK_VISION_MODEL` switches it per device.
- **Cloud power tier** → step3.7 Flash when keyed (richest, 256K ctx, video) via the same pluggable hook.

## The honest architecture finding
The CPU VM is the **wrong host for vision** — vision belongs **on the user's device** (the Tauri
overlay, their GPU/NPU) or a **fast cloud endpoint**. `/api/perceive` is now provider-pluggable so
*any* of the three plugs into the exact same SIGIL→memory→audit pipeline. moondream proves the loop
end-to-end today; the device/GPU makes it instant; step3.7 makes it deep.

**Privacy:** in the web HUD the frame goes to the user's *own* sovereign VM + a *local* model (not a
third party); in the native overlay it never leaves the device. Every capture is browser-consented.
