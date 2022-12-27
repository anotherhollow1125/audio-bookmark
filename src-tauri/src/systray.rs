use tauri::{
    AppHandle, CustomMenuItem, Manager, Runtime, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

pub fn systray_setup() -> SystemTray {
    let quit = CustomMenuItem::new("quit", "Quit");
    let tray_menu = SystemTrayMenu::new().add_item(quit);
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
            let tray_handle = app.tray_handle_by_id("main").unwrap();
            tray_handle.destroy().unwrap();
            app.exit(0);
        }
        _ => {}
    }
}
