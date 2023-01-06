use tauri::{
    AppHandle, CustomMenuItem, Manager, Runtime, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

pub fn systray_setup() -> SystemTray {
    let quit = CustomMenuItem::new("quit", "Quit");
    let config = CustomMenuItem::new("config", "Config");
    let tray_menu = SystemTrayMenu::new().add_item(config).add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    system_tray
}

pub fn handle_systemtray_events<R: Runtime>(app: &AppHandle<R>, event: SystemTrayEvent) {
    let config = app.get_window("config").unwrap();
    config.hide().unwrap();

    match &event {
        SystemTrayEvent::LeftClick { .. } => {
            let window = app.get_window("main").unwrap();
            if let Ok(true) = window.is_visible() {
                window.hide().unwrap();
            } else {
                window.show().unwrap();
            }
        }
        SystemTrayEvent::MenuItemClick { ref id, .. } if id == "quit" => {
            app.exit(0);
        }
        SystemTrayEvent::MenuItemClick { ref id, .. } if id == "config" => {
            config.show().unwrap();
        }
        _ => {}
    }
}
