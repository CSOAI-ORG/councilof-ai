/**
 * MEOK AI LABS — Desktop Character Integration
 *
 * Desktop-specific character features:
 * - System tray character status
 * - Character selection from tray menu
 * - Character state sync with browser
 * - Desktop overlay character display
 */

use tauri::{
    Emitter,
    Manager,
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
};
use std::process::Command;
use std::time::Duration;
use std::thread;
use std::sync::Mutex;

mod commands;

const FAB_W: u32 = 80;
const FAB_H: u32 = 80;

// Active character state (shared across app)
static ACTIVE_CHARACTER: Mutex<Option<String>> = Mutex::new(None);

// Known characters for the tray menu
const CHARACTERS: &[(&str, &str, &str)] = &[
    ("aria", "Aria", "nurturer"),
    ("marcus", "Marcus", "protector"),
    ("luna", "Luna", "dreamer"),
    ("sage", "Sage", "sage"),
    ("sol", "Sol", "explorer"),
    ("echo", "Echo", "creator"),
];

fn get_active_character() -> Option<String> {
    ACTIVE_CHARACTER.lock().unwrap().clone()
}

fn set_active_character(id: String) {
    *ACTIVE_CHARACTER.lock().unwrap() = Some(id);
}

fn detect_running_game() -> Option<String> {
    let known_games = [
        ("FortniteClient-Win64-Shipping", "Fortnite"),
        ("VALORANT-Win64-Shipping", "Valorant"),
        ("League of Legends", "League of Legends"),
        ("cs2", "Counter-Strike 2"),
        ("RocketLeague", "Rocket League"),
        ("Minecraft", "Minecraft"),
    ];
    
    let output = Command::new("ps")
        .args(["-eo", "comm"])
        .output()
        .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_lowercase();
    
    for (process_name, display_name) in known_games {
        if stdout.contains(&process_name.to_lowercase()) {
            return Some(display_name.to_string());
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::resize_for_panel,
            commands::resize_for_fab,
            commands::get_app_version,
            get_character_state,
            set_character_state,
            get_all_characters,
            sync_character_from_browser,
        ])
        .setup(|app| {
            // ── Build character submenu ─────────────────────────────────────
            let mut char_items: Vec<tauri::menu::MenuItem<tauri::Wry>> = Vec::new();
            for (id, name, archetype) in CHARACTERS {
                let item = MenuItemBuilder::new(format!("{} ({})", name, archetype))
                    .id(format!("char:{}", id))
                    .build(app)?;
                char_items.push(item);
            }
            let char_refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = char_items.iter().map(|i| i as &dyn tauri::menu::IsMenuItem<tauri::Wry>).collect();
            let char_submenu = SubmenuBuilder::new(app, "Characters")
                .items(&char_refs)
                .build()?;
            
            // ── System tray ─────────────────────────────────────────────────
            let show_item = MenuItemBuilder::new("Show MEOK").id("show").build(app)?;
            let hide_item = MenuItemBuilder::new("Hide MEOK").id("hide").build(app)?;
            let separator = MenuItemBuilder::new("─────────────").id("sep").enabled(false).build(app)?;
            let quit_item = MenuItemBuilder::new("Quit").id("quit").build(app)?;
            
            let tray_menu = MenuBuilder::new(app)
                .items(&[&show_item, &hide_item, &separator, &char_submenu, &separator, &quit_item])
                .build()?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("MEOK Companion")
                .on_menu_event(|app, event| {
                    let id = event.id.as_ref();
                    match id {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        id if id.starts_with("char:") => {
                            let char_id = id.strip_prefix("char:").unwrap_or("aria");
                            set_active_character(char_id.to_string());
                            let _ = app.emit("character-selected", char_id);
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // ── Game detection thread ───────────────────────────────────────
            {
                let app_handle = app.handle().clone();
                thread::spawn(move || {
                    let mut last_game: Option<String> = None;
                    loop {
                        thread::sleep(Duration::from_secs(5));
                        let current = detect_running_game();
                        if current != last_game {
                            let payload = match &current {
                                Some(game) => game.clone(),
                                None => String::from("none"),
                            };
                            let _ = app_handle.emit("game-detected", payload);
                            last_game = current;
                        }
                    }
                });
            }

            // ── Global shortcuts ───────────────────────────────────────────
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
            
            // Cmd+Shift+M: Toggle visibility
            app.global_shortcut().on_shortcut("CommandOrControl+Shift+M", move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(w) = app.get_webview_window("main") {
                        if w.is_visible().unwrap_or(false) {
                            let _ = w.hide();
                        } else {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                }
            })?;

            // Cmd+Shift+V: Voice activation
            app.global_shortcut().on_shortcut("CommandOrControl+Shift+V", move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.set_focus();
                        let _ = w.emit("voice-activate", ());
                    }
                }
            })?;

            // Cmd+Shift+1-6: Quick character switch
            for (i, (id, _, _)) in CHARACTERS.iter().enumerate() {
                let char_id = id.to_string();
                let app_handle = app.handle().clone();
                let shortcut_str = format!("CommandOrControl+Shift+{}", i + 1);
                let shortcut: tauri_plugin_global_shortcut::Shortcut = shortcut_str.parse().expect("valid shortcut");
                app.global_shortcut().on_shortcut(
                    shortcut,
                    move |app, _shortcut, event| {
                        if event.state == ShortcutState::Pressed {
                            set_active_character(char_id.clone());
                            let _ = app.emit("character-selected", char_id.clone());
                        }
                    },
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MEOK companion");
}

// ── Tauri Commands ─────────────────────────────────────────────────────────

#[tauri::command]
fn get_character_state() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "activeCharacter": get_active_character(),
        "mood": "active",
        "synced": true
    }))
}

#[tauri::command]
fn set_character_state(character_id: String, _mood: String) -> Result<(), String> {
    set_active_character(character_id);
    Ok(())
}

#[tauri::command]
fn get_all_characters() -> Result<Vec<serde_json::Value>, String> {
    Ok(CHARACTERS.iter().map(|(id, name, archetype)| {
        serde_json::json!({
            "id": id,
            "name": name,
            "archetype": archetype,
            "isActive": get_active_character().as_deref() == Some(id)
        })
    }).collect())
}

#[tauri::command]
fn sync_character_from_browser(character_id: String, _state: serde_json::Value) -> Result<(), String> {
    set_active_character(character_id);
    Ok(())
}