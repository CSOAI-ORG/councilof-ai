# The open-source "crown jewels" to stack under SAP + the runner (fact-checked licenses)

_2026-07-01. Components to build the sovereign, offline, portable mini-OS agent on — all permissively licensed (MIT / Apache-2.0 / BSD), commercial-safe. Cited from live searches; re-verify any before shipping in a paid product._

## Offline brain (the model on the device)
| Piece | License | Why | Note |
|---|---|---|---|
| **llama.cpp** | **MIT** | the C/C++ inference engine under everything (~118k★) | powers Ollama/LM Studio/llamafile |
| **Ollama** | **MIT** | easiest local runtime; `ollama pull` | the runner talks to `localhost:11434` |
| **node-llama-cpp** (withcatai) | MIT (llama.cpp) | embed a model *inside* a Node process; JSON-schema-enforced output | for a zero-daemon embedded runner |
| **llamafile** (Mozilla) | **Apache-2.0** | single-file model+runtime — the literal "model in a container" | true portable inference |

## Small models good enough on-device (commercial licenses)
- **Qwen2.5 0.5B/1.5B/3B** — **Apache-2.0** — best license + tool-routing at size.
- **Llama 3.2 1B/3B** — good agentic small; check Llama license user caps.
- **Phi-4-mini 3.8B** — best small reasoner (~3GB Q4).
- **SmolLM3-3B** — beats Llama-3.2-3B/Qwen2.5-3B on 12 benches.
- **Qwen3.5-0.8B** — **Apache-2.0**, multimodal (vision) at 0.8B.
- Rule: for agents pick **function-calling + structured-output + instruction-following**, not benchmark score. 1–3.8B is the on-device sweet spot.

## Voice / body
- **Kokoro-82M** — **Apache-2.0**, 327MB, CPU, 54 voices — best default local TTS (the right-brain voice).
- **Cesium** (**Apache-2.0**) + **MapLibre** (**BSD**) — the 3D world body the SAP `boot` references.

## Identity / packaging (ride, don't reinvent — see MEOK_NEW_PROTOCOL_RESEARCH)
- **MCP** (protocol) · **A2A Agent Card** (Apache-2.0) · **Letta Agent File .af** (Apache-2.0, portable state).
- **AGNTCY / OASF** (Linux Foundation) — OCI-packaged, Sigstore-signed agents; **interop target**, not competitor.
- **sigstore-a2a** — keyless card signing (their model needs a CA/OIDC; **ours is sovereign offline Ed25519** — the differentiator).

## What we shipped on top (the uncontested layer)
- **`/api/sap`** — signed Sovereign Agent Package: A2A card + MCP endpoint + Letta-.af state + **dual-brain (offline/online, L/R)** + **bootable 3D-OS body** + **governance (care-floor/hard-stops)**, Ed25519-signed.
- **`runner/meok-sap-runner.mjs`** (MIT) — loads a SAP, **verifies it offline**, serves it as a **local MCP server**, routes brain **offline-first (Ollama/llamafile) → online fallback**. Tested 6/6 (offline verify + MCP handshake + tool calls + brain routing).

## The honest one-liner
Everyone open-sources the *engine* (llama.cpp), the *runtime* (Ollama), the *packaging* (AGNTCY/OASF, .af), and *keyless* signing (Sigstore). **Nobody ships the sovereign, offline-verifiable, governance-embedded profile that binds them.** That's the stack to own — build ON the crown jewels, don't rebuild them.

## Next stones
1. Embed **node-llama-cpp** for a zero-daemon runner (no Ollama needed).
2. Bundle **Kokoro** for local voice; wire the right-brain.
3. Emit an **AGNTCY OASF record** from `/api/sap`; propose a sovereign-governance extension upstream.
