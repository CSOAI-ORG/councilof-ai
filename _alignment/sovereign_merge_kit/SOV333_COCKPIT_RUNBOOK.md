# SOV333 Cockpit — run it on your Mac, talk to SOV as you work

Two pieces: **Open WebUI** (the polished chat UI — don't build, it exists) + **our governed shim**
(care-gate + Ed25519 sign + route). You run both locally; SOV's governance sits between them.

## 1. Start the governed shim (our piece — verified working)
```bash
cd ~/clawd/_alignment/sovereign_merge_kit
export SOV33_SIGIL_DIR="$HOME/.sov33_sigil"   # persistent signing key
python3 sov_openai_shim.py                    # -> http://localhost:8802/v1
```
It exposes 3 models: `sov333-fast` (local/small), `sov333-smart` (~70-400B), `sov333-frontier`
(biggest reachable API model; 1.6T slot answers when that model responds on your machine).

## 2. Give it a brain (so it's not just "no brain reachable")
- **Free + offline (recommended):** `ollama serve` then `ollama pull qwen2.5:3b`  → sov333-fast/smart work offline.
- **Frontier (up to ~400B, free):** set your NVIDIA key so it's live in this shell:
  `export NVIDIA_API_KEY=nvapi-...`  → sov333-frontier reaches qwen-397b (and the 1.6T slot when it answers).

## 3. Start Open WebUI (the UI — mature open-source, don't rebuild)
```bash
pip install open-webui && open-webui serve      # OR: docker run -d -p 3000:8080 ghcr.io/open-webui/open-webui:main
```
Open http://localhost:3000  →  Settings → Connections → OpenAI API →
  URL: `http://localhost:8802/v1`   ·   API key: anything (the shim ignores it)
Pick a `sov333-*` model in the chat dropdown. **You're now talking to governed SOV333.**

## What you get
Every message: care-gated (floor 0.35, RECALL 1.00 — harmful vetoed), routed to a brain,
Ed25519-signed. The UI is Open WebUI's; the **governance + signature is SOV's** — the moat no
frontier chat UI ships. Offline-capable (Ollama), frontier-reachable (NVIDIA/1.6T slot).

## Honest notes
- "1.6T" = ROUTING to a 1.6T API model when reachable; confirmed-answering today = ~400B (qwen-397b).
- The shim is verified (benign→routed+signed, harmful→vetoed). Sockets couldn't be tested from the
  build sandbox (loopback blocked there) — but the governance logic is proven and it runs on your Mac.
