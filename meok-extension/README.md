# MEOK Sovereign — browser extension (overlay everywhere)

Your sovereign AI rides on top of **every website**. A floating 🐉 orb (bottom-right) opens a mini-dock that talks to your live governed brain (`os.meok.ai/api/chat`) and surfaces the right tools from your 377-tool fleet (`/api/tools`) — without leaving the page or switching anything. This is the "no switching browsers, it's all there" v1.

## Load it (unpacked, ~30 seconds)
1. Chrome/Edge/Brave → `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. **Load unpacked** → select this `meok-extension/` folder
4. Visit any website → the 🐉 orb appears bottom-right → click → ask anything

## What it does
- Floating Sovereign on `<all_urls>` (content script)
- Chat → council brain (queen-king), context-aware of the current `hostname`
- "🧰 Tools for this" → deep-links into SOV Space, filtered
- Talks **only** to your own `os.meok.ai` endpoint — your data stays yours

## Honest status
- Built + parses; loadable unpacked. **Not auto-tested in a live browser here** (I can't drive Chrome's extension loader) — load it and tell me if anything's off.
- No toolbar icon PNGs yet (uses the default puzzle icon) — cosmetic only.
- Desktop overlay over *native* apps (not just web) = the **Tauri** build, which needs a Rust toolchain + signing → that's the next step beyond this web-extension v1.
- Publishing to the Chrome Web Store = your account action (a `$5` dev registration + review).
