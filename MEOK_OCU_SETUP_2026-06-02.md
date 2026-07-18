# MEOK co-pilot — Approve→Run hands (Open Computer Use) · 2026-06-02

_The co-pilot can now actually **do** the move you approve. meok-one stays the gated brain
(see → decide → gate → audit); the **hands run on your device** and only when you click
Approve. Authored by Claude (Opus 4.8)._

## The loop (now end-to-end)
```
👁 /hud captures your screen (you choose what to share)
 → 🧠 /api/copilot/act proposes ONE next move
 → 🛡️ Tool Gateway gates it:  read = ✓safe · write = ✋your OK · prohibited = ⛔refused
 → 📜 SIGIL-audited
 → ✅ you click "Approve → Run"  → 🖐️ local hands-bridge executes it on YOUR desktop
```
meok-one **never touches your mouse**. The button POSTs the *already-gated* action to a small
bridge running on your machine. Prohibited actions (money / credentials / delete) never get a
button — they're refused upstream **and** re-refused by the bridge.

## One-time setup (your Mac)
1. **Install the deterministic hands** (type / keys / scroll / click-at-coords):
   ```bash
   pip install pyautogui
   ```
2. **Grant macOS permissions** (System Settings → Privacy & Security):
   - **Accessibility** → enable your terminal / Python (lets it move keyboard+mouse)
   - **Screen Recording** → enable your browser (lets /hud capture the screen)
3. **Run the hands-bridge** (ships in the repo):
   ```bash
   python3 tools/hands_bridge.py     # listens on 127.0.0.1:7777, localhost only
   ```
4. **Use it:** open `/hud`, type `/do <goal>` (e.g. `/do scroll down to the reply box`),
   pick what to share → the gated card appears → click **Approve → Run**.

That's it. No extra config — the HUD defaults to `http://127.0.0.1:7777/act`.

## Vision-grounded clicks ("click the Reply button")
The bundled bridge does the **deterministic** verbs itself: `type, key, hotkey, scroll,
click_at x,y`. Clicking a *named* on-screen target needs a vision agent — that's where
**Open Computer Use** comes in (it sees the screen and resolves "the Reply button" to a click).
To use it, point the bridge's vision path at your OCU install, or set a different endpoint:
```js
localStorage.setItem("meok_ocu_url","http://127.0.0.1:PORT/act")   // run in the /hud tab console
```
Until then, named-target clicks return a clear "needs OCU" note instead of guessing.

## Why this is safe (unchanged guarantees)
- **read** (observe/scroll) runs on approval; **write** (type/click) needs your explicit click;
  **prohibited** (move money, buy, enter credentials, delete account, bypass CAPTCHA) is
  **refused** — by meok-one's gate *and* by the bridge's local allowlist.
- The bridge binds **127.0.0.1 only** — never the network. It does nothing on its own; every
  action is an explicit, gated, human-approved request from your own browser tab.
- Every proposed action is a signed line in the **SIGIL** audit chain — you can see exactly
  what it intended, before and after.

## Files
- `meok-one/meok_one/web/hud.html` — the Approve→Run card + `runOCU()` wire (live).
- `meok-one/tools/hands_bridge.py` — the local hands (stdlib HTTP + pyautogui; re-gated).
- This doc — setup + the OCU vision path.
