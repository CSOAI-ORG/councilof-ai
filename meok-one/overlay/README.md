# MEOK Overlay — desktop HUD (Tauri v2)

Floats **`/hud`** (your AI + chat + co-pilot + predictive forecast) **always-on-top, frameless,
and transparent** over any app — the WoW-addon feel, but for your real desktop. The native shell
is tiny; all the product is the HUD it already serves.

```
overlay/
  src-tauri/         the Rust shell
    Cargo.toml       tauri v2 deps
    tauri.conf.json  window: transparent · frameless · always-on-top · skip-taskbar
    src/main.rs      minimal entry (window comes from config)
    icons/icon.png   starter icon (from the MEOK marble)
  ui/index.html      drag bar (👻 ghost · 📌 pin · ⟳ reload · ✕ close) + iframe → the HUD
```

## Run (your Mac — needs Rust)
```bash
# one-time
curl https://sh.rustup.rs -sSf | sh          # if you don't have Rust
cargo install tauri-cli --version "^2" --locked

# dev (hot overlay)
cd meok-one/overlay/src-tauri
cargo tauri dev

# build a .app / .dmg
cargo tauri build
```
On macOS the overlay also needs **Screen Recording** permission for `/do` screen capture
(System Settings → Privacy & Security), same as the browser.

## Point it at your HUD
Defaults to `https://one.meok.ai/hud`. To use a different host, open the overlay's devtools
console and:
```js
localStorage.setItem("meok_hud_url", "http://YOUR-HOST:4173/hud")   // then click ⟳
```

## Controls
Drag the top bar to move · **👻** ghost (dim to 55%) · **📌** toggle always-on-top ·
**⟳** reload · **✕** close.

## Next step — true OS-global click-through
Today the overlay is a movable always-on-top panel. To make it *click-through* (mouse passes to
the app beneath) with a global hotkey that works even when unfocused, add the plugin:
```toml
# Cargo.toml
tauri-plugin-global-shortcut = "2"
```
…register `CmdOrCtrl+Shift+C` → `window.set_ignore_cursor_events(true/false)` and
`CmdOrCtrl+Shift+M` → show/hide, in `main.rs`. Left out of the scaffold to keep the first build
clean; it's a ~20-line addition.

## Honest status
- **[scaffold, ready to build]** — correct Tauri v2 project; compiles with `cargo tauri dev` on a
  machine with Rust + tauri-cli (heavy first compile downloads the tauri crates + system webkit).
- The overlay **wraps** the live `/hud`; it doesn't reimplement it — one source of truth.
- Generate the full icon set anytime: `cargo tauri icon ../../meok_one/web/icon-512.png`.

Built by MEOK AI Labs · https://meok.ai
