#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::Result;
use audio_bookmark::{notifier::Notification, Audio, InstantsSingleton};
use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tokio::sync::mpsc::{channel, Sender};

type AudioDict = BTreeMap<String, Audio>;

#[derive(serde::Serialize, Debug, Clone)]
#[serde(tag = "kind")]
enum UnexpectedErr {
    LockError,
    MPSCClosedError,
}

#[derive(serde::Serialize, Debug, Clone)]
#[serde(tag = "type")]
enum ABAPIError {
    Unexpected { inner: UnexpectedErr },
    SomethingWrong { msg: String },
}

enum Query {
    QNewAudioDict,
    QExistAudioDict,
}

enum Response {
    RAudioDict(AllAudioInfo),
}

#[tokio::main]
async fn main() -> Result<()> {
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    env_logger::init();

    let (update_tx, mut update_rx) = channel(256);
    let (query_tx, mut query_rx) = channel(256);
    let (response_tx, mut response_rx) = channel(256);
    let is_thread = tokio::spawn(async move {
        let is = Arc::new(unsafe { InstantsSingleton::new(&update_tx) }.map_err(|e| {
            ABAPIError::SomethingWrong {
                msg: format!("@InstantsSingleton::new {:?}", e),
            }
        })?);

        let audio_dict = Arc::new(Mutex::new(unsafe { get_audio_dict(&(is)) }.map_err(
            |e| ABAPIError::SomethingWrong {
                msg: format!("@get_audio_dict {:?}", e),
            },
        )?));

        while let Some(q) = query_rx.recv().await {
            match q {
                Query::QNewAudioDict => {
                    let mut dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                        inner: UnexpectedErr::LockError,
                    })?;
                    *dict =
                        unsafe { get_audio_dict(&is) }.map_err(|e| ABAPIError::SomethingWrong {
                            msg: format!("@get_audio_dict {:?}", e),
                        })?;
                }
                _ => (),
            }

            let default = match unsafe { is.get_default_audio_id() } {
                Ok(name) => name,
                Err(e) => {
                    log::error!("Failed to get default audio name: {}", e);
                    continue;
                }
            };

            let all_audio_info = {
                let dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                    inner: UnexpectedErr::LockError,
                })?;
                match AllAudioInfo::new(&dict, default) {
                    Ok(info) => info,
                    Err(e) => {
                        log::error!("Failed to get all audio info: {}", e);
                        continue;
                    }
                }
            };

            response_tx
                .send(Response::RAudioDict(all_audio_info))
                .await
                .map_err(|_| ABAPIError::Unexpected {
                    inner: UnexpectedErr::MPSCClosedError,
                })?;
        }

        Result::<(), ABAPIError>::Ok(())
    });

    tauri::Builder::default()
        .manage(query_tx)
        .invoke_handler(tauri::generate_handler![query_all_audio_info])
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();

            let mw = main_window.clone();
            let _notification_thread = tokio::spawn(async move {
                while let Some(notification) = update_rx.recv().await {
                    let e = mw.emit("audio_state_change", notification);
                    if let Err(e) = e {
                        log::error!("@Notify {:?}", e);
                    }
                }
            });

            let mw = main_window; // .clone();
            let _response_thread = tokio::spawn(async move {
                while let Some(response) = response_rx.recv().await {
                    match response {
                        Response::RAudioDict(info) => {
                            let e = mw.emit("response_for_request", info);
                            if let Err(e) = e {
                                log::error!("@Response {:?}", e);
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    let e = is_thread.await;
    if let Err(e) = e {
        log::error!("is_thread end with Error: {}", e);
    }

    Ok(())
}

unsafe fn get_audio_dict(is: &Arc<InstantsSingleton>) -> Result<AudioDict> {
    let res = InstantsSingleton::get_active_audios(is)?
        .into_iter()
        .map(|a| (a.id.clone(), a))
        .collect();

    Ok(res)
}

#[derive(serde::Serialize, Debug, Clone)]
struct AudioInfo {
    id: String,
    name: String,
    volume: f32,
    muted: bool,
}

impl AudioInfo {
    fn from_audio(audio: &Audio) -> Result<Self> {
        Ok(Self {
            id: audio.id.clone(),
            name: audio.name.clone(),
            volume: unsafe { audio.get_volume()? },
            muted: unsafe { audio.get_mute_state()? },
        })
    }
}

#[derive(serde::Serialize, Debug, Clone)]
struct AllAudioInfo {
    audios: Vec<AudioInfo>,
    default: String,
}

impl AllAudioInfo {
    fn new(audio_dict: &AudioDict, default: String) -> Result<Self> {
        let audios = audio_dict
            .values()
            .map(|a| AudioInfo::from_audio(a))
            .collect::<Result<Vec<_>>>()?;

        Ok(Self { audios, default })
    }
}

#[tauri::command]
async fn query_all_audio_info(
    tx: tauri::State<'_, Sender<Query>>,
    notification: Option<Notification>,
) -> Result<(), ABAPIError> {
    match notification {
        None | Some(Notification::VolumeChanged { .. }) => tx.send(Query::QExistAudioDict).await,
        Some(_) => tx.send(Query::QNewAudioDict).await,
    }
    .map_err(|_| ABAPIError::Unexpected {
        inner: UnexpectedErr::MPSCClosedError,
    })?;

    Ok(())
}
