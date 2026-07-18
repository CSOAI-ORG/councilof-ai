#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("Show", "show"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(SystemTrayMenuItem::new("Quit", "quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet, get_sov3_status])
        .run(tauri::generate_context!())
        .expect("error while running MEOKCLAW");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to MEOKCLAW.", name)
}

#[tauri::command]
async fn get_sov3_status() -> Result<String, String> {
    match reqwest::get("http://localhost:3102/health").await {
        Ok(resp) => match resp.json::<serde_json::Value>().await {
            Ok(json) => Ok(json.to_string()),
            Err(e) => Err(format!("JSON parse error: {}", e)),
        },
        Err(e) => Err(format!("SOV3 unreachable: {}", e)),
    }
}
