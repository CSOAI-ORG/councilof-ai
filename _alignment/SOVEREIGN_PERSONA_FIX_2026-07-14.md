# 🐉 Sovereign chat persona — the "stupid chats" fix (2026-07-14)

## The problem Nick hit
Local/dock chat gave dumb, repetitive, boilerplate answers and — worst — **role confusion**:
told "I'm Nicholas your sovereign," the model replied "I'm Nicholas Templeman your founder"
(mirroring the user's identity instead of serving them).

## Root cause (honest)
1. **No real system prompt / persona** — the model fell back to generic "digital assistant" filler.
2. **Base model is small** (0.6B `qwen3-precise` was in use) — too weak to hold an identity unaided.

## The fix (done, verified)
- Wrote a canonical Sovereign SYSTEM prompt (identity rules + who-you-are + style) — see `Sovereign.Modelfile`.
- Packaged a local Ollama model: **`ollama run sovereign`** (base = `qwen3:1.7b`, bigger holds persona far better).
- Verified out-of-the-box: 4/5 test turns now correct + on-identity (was 0/5). Role confusion fixed on the
  key turn ("You are Nicholas, my sovereign").

## Honest remaining gap
- `qwen3:1.7b` STILL slips ~1-in-5 (once claimed "I am Nicholas"). That's the small-model ceiling.
- Full cure = bigger base (e.g. pull `qwen2.5:3b`/`7b` into Ollama) OR fine-tune the identity in (needs training).

## To also fix the DEPLOYED dock (os.meok.ai)
The web chat runs through serverless `/api/chat`, not local Ollama. Drop the SAME system prompt (below,
also in `Sovereign.Modelfile`) into that endpoint's system message. Deploy is owner-gated (Vercel).

## Architecture reminder
persona (this system prompt) + facts (RAG / governed-RAG POC) + trust (Ed25519 signing) = the real Sovereign.
The system prompt fixes WHO it is; RAG fixes WHAT it knows; signing proves it. All three now exist.
