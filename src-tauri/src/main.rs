#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::Result;
use audio_bookmark::{
    audio_backend::{backend_prepare, backend_tauri_setup, BackendPrepareRet, Query},
    errors::*,
    log::env_logger_init,
    systray::{handle_systemtray_events, systray_setup},
    // menu::{main_window_menu, on_main_menu_event},
};
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tokio::sync::mpsc::Sender;

#[tauri::command]
async fn query(tx: tauri::State<'_, Sender<Query>>, query: Query) -> Result<(), ABAPIError> {
    log::debug!("query: {:?}", query);
    tx.send(query).await.map_err(|_| ABAPIError::Unexpected {
        inner: UnexpectedErr::MPSCClosedError,
    })?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    env_logger_init();

    let BackendPrepareRet {
        relay_thread,
        backend_thread,
        query_tx,
        frontend_update_rx,
    } = backend_prepare().await?;

    // let menu = main_window_menu();

    let system_tray = systray_setup();

    tauri::Builder::default()
        // .menu(menu)
        // .on_menu_event(on_main_menu_event)
        .system_tray(system_tray)
        .on_system_tray_event(handle_systemtray_events)
        .manage(query_tx)
        .invoke_handler(tauri::generate_handler![query])
        .setup(|app| {
            let _notification_thread = backend_tauri_setup(app, frontend_update_rx);
            app.handle().get_window("config").unwrap().hide().unwrap();

            Ok(())
        })
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    let e = relay_thread.await;
    if let Err(e) = e {
        log::error!("relay_thread end with Error: {:?}", e);
    }

    let e = backend_thread.await;
    if let Err(e) = e {
        log::error!("backend_thread end with Error: {:?}", e);
    }

    Ok(())
}
