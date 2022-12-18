use if_chain::if_chain;
use tauri::{CustomMenuItem, Menu, Submenu, WindowMenuEvent, Wry};

pub fn main_window_menu() -> Menu {
    let (file_str, setting_str, quit_str) = if_chain! {
        if let Some(lang) = option_env!("LANG");
        if lang.starts_with("ja_JP"); // Developer is Japanese.
        then {
            ("ファイル", "設定", "終了")
        } else {
            ("File", "Setting", "Quit")
        }
    };

    let setting = CustomMenuItem::new("setting".to_string(), setting_str);
    let quit = CustomMenuItem::new("quit".to_string(), quit_str);
    let file = Submenu::new(file_str, Menu::new().add_item(setting).add_item(quit));

    Menu::new().add_submenu(file)
}

pub fn on_main_menu_event(event: WindowMenuEvent<Wry>) {
    match event.menu_item_id() {
        "setting" => log::debug!("setting"),
        "quit" => {
            log::debug!("quit");
            event.window().close().unwrap();
        }
        _ => {}
    }
}
