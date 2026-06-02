// MEOK Overlay — a thin Tauri v2 shell that floats /hud always-on-top over your desktop.
// The window (transparent, frameless, always-on-top) is defined in tauri.conf.json; the UI
// (drag bar + ghost/pin/reload/close) lives in ../ui/index.html and drives the window via the
// global Tauri API (app.withGlobalTauri = true). True OS-global click-through hotkeys are the
// documented next step (add tauri-plugin-global-shortcut) — see README.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the MEOK overlay");
}
