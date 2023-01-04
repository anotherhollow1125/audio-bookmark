use tauri::{
    api::dialog::message, AppHandle, CustomMenuItem, Manager, Runtime, SystemTray, SystemTrayEvent,
    SystemTrayMenu,
};

pub fn systray_setup() -> SystemTray {
    let quit = CustomMenuItem::new("quit", "Quit");
    let version = CustomMenuItem::new("version", "Version");
    let tray_menu = SystemTrayMenu::new().add_item(quit).add_item(version);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    system_tray
}

pub fn handle_systemtray_events<R: Runtime>(app: &AppHandle<R>, event: SystemTrayEvent) {
    let window = app.get_window("main").unwrap();

    match &event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Ok(true) = window.is_visible() {
                window.hide().unwrap();
            } else {
                window.show().unwrap();
            }
        }
        SystemTrayEvent::MenuItemClick { ref id, .. } if id == "quit" => {
            app.exit(0);
        }
        SystemTrayEvent::MenuItemClick { ref id, .. } if id == "version" => {
            // show version
            message(
                Some(&app.get_window("main").unwrap()),
                "Version",
                format!("audio-bookmark\nVer. {}", env!("CARGO_PKG_VERSION")).as_str(),
            );
        }
        _ => {}
    }
}
