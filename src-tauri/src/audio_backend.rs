use crate::{
    audio_api::{notifier::Notification, Audio, InstantsSingleton},
    errors::*,
};
use anyhow::Result;
use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};
use tauri::{App, Manager, Wry};
use tokio::sync::mpsc::{channel, Receiver, Sender};
use tokio::task::JoinHandle;
use tokio::time::{timeout, Duration};
use windows::{
    core::{HSTRING, PCWSTR},
    Win32::Media::Audio::{PlaySoundW, SND_ALIAS, SND_ASYNC},
};

type AudioDict = BTreeMap<String, Audio>;

#[derive(serde::Deserialize, Debug, Clone)]
#[serde(tag = "kind")]
pub enum Query {
    QAudioDictUpdate { notification: Notification },
    QAudioDict,
    QDefaultAudioChange { id: String },
    QVolumeChange { id: String, volume: f32 },
    QMuteStateChange { id: String, muted: bool },
    QBeep,
}

const RECEIVE_INTERVAL: Duration = Duration::from_millis(100);

pub struct BackendPrepareRet {
    pub relay_thread: JoinHandle<Result<()>>,
    pub backend_thread: JoinHandle<Result<(), ABAPIError>>,
    pub query_tx: Sender<Query>,
    pub frontend_update_rx: Receiver<UpdateNotifierB2F>,
}

pub async fn backend_prepare() -> Result<BackendPrepareRet> {
    let (backend_update_tx, mut backend_update_rx) = channel(256);
    let (frontend_update_tx, frontend_update_rx) = channel(256);
    let (query_tx, mut query_rx) = channel(256);

    let qt = query_tx.clone();
    let relay_thread = tokio::spawn(async move {
        while let Some(mut notification) = backend_update_rx.recv().await {
            loop {
                match timeout(RECEIVE_INTERVAL, backend_update_rx.recv()).await {
                    Ok(Some(n)) => notification = n,
                    _ => break,
                }
            }

            qt.send(Query::QAudioDictUpdate { notification })
                .await
                .map_err(|_| ABAPIError::Unexpected {
                    inner: UnexpectedErr::MPSCClosedError,
                })?;
        }

        Result::<()>::Ok(())
    });

    let backend_thread = tokio::spawn(async move {
        let is = Arc::new(InstantsSingleton::new(&backend_update_tx).map_err(|e| {
            ABAPIError::SomethingWrong {
                msg: format!("@InstantsSingleton::new {:?}", e),
            }
        })?);

        let audio_dict = Arc::new(Mutex::new(get_audio_dict(&(is)).map_err(|e| {
            ABAPIError::SomethingWrong {
                msg: format!("@get_audio_dict {:?}", e),
            }
        })?));

        while let Some(q) = query_rx.recv().await {
            match q {
                Query::QAudioDictUpdate { notification } => {
                    {
                        let mut dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                            inner: UnexpectedErr::LockError,
                        })?;
                        *dict = get_audio_dict(&is).map_err(|e| ABAPIError::SomethingWrong {
                            msg: format!("@get_audio_dict {:?}", e),
                        })?;
                    }
                    let e = update_notifing_b2f(
                        &is,
                        &audio_dict,
                        Some(notification),
                        &frontend_update_tx,
                    )
                    .await;

                    if let Err(e) = e {
                        log::error!("{:?}", e);
                        // continue;
                    }
                }
                Query::QAudioDict => {
                    let e = update_notifing_b2f(&is, &audio_dict, None, &frontend_update_tx).await;

                    if let Err(e) = e {
                        log::error!("update_notifing_b2f {:?}", e);
                        // continue;
                    }
                }
                Query::QDefaultAudioChange { id } => {
                    let dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                        inner: UnexpectedErr::LockError,
                    })?;

                    let audio_w = dict.get(&id).ok_or(ABAPIError::SomethingWrong {
                        msg: format!("No such audio: {:?}", id),
                    });

                    let audio = match audio_w {
                        Ok(audio) => audio,
                        Err(e) => {
                            log::error!("{:?}", e);
                            continue;
                        }
                    };

                    let e = audio
                        .set_as_default()
                        .map_err(|e| ABAPIError::SomethingWrong {
                            msg: format!("audio.set_as_default {:?}", e),
                        });

                    if let Err(e) = e {
                        log::error!("{:?}", e);
                        // continue;
                    }
                }
                Query::QVolumeChange { id, volume } => {
                    let dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                        inner: UnexpectedErr::LockError,
                    })?;

                    let audio_w = dict.get(&id).ok_or(ABAPIError::SomethingWrong {
                        msg: format!("No such audio: {:?}", id),
                    });

                    let audio = match audio_w {
                        Ok(audio) => audio,
                        Err(e) => {
                            log::error!("{:?}", e);
                            continue;
                        }
                    };

                    let e = audio
                        .set_volume(volume)
                        .map_err(|e| ABAPIError::SomethingWrong {
                            msg: format!("@audio.set_volume {:?}", e),
                        });

                    if let Err(e) = e {
                        log::error!("{:?}", e);
                        // continue;
                    }
                }
                Query::QMuteStateChange { id, muted } => {
                    let dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
                        inner: UnexpectedErr::LockError,
                    })?;

                    let audio_w = dict.get(&id).ok_or(ABAPIError::SomethingWrong {
                        msg: format!("No such audio: {:?}", id),
                    });

                    let audio = match audio_w {
                        Ok(audio) => audio,
                        Err(e) => {
                            log::error!("{:?}", e);
                            continue;
                        }
                    };

                    let e = audio
                        .set_mute_state(muted)
                        .map_err(|e| ABAPIError::SomethingWrong {
                            msg: format!("@audio.set_mute {:?}", e),
                        });

                    if let Err(e) = e {
                        log::error!("{:?}", e);
                        // continue;
                    }
                }
                Query::QBeep => unsafe {
                    // http://yamatyuu.net/computer/program/sdk/other/playsound/index.html
                    let notify: HSTRING = "Notification.Default".into();
                    let notify: PCWSTR = (&notify).into();
                    let _ = PlaySoundW(notify, None, SND_ALIAS | SND_ASYNC);
                },
            }
        }

        Result::<(), ABAPIError>::Ok(())
    });

    Ok(BackendPrepareRet {
        relay_thread,
        backend_thread,
        query_tx,
        frontend_update_rx,
    })
}

pub fn backend_tauri_setup(
    app: &mut App<Wry>,
    mut frontend_update_rx: Receiver<UpdateNotifierB2F>,
) -> JoinHandle<()> {
    let main_window = app.get_window("main").unwrap();

    let mw = main_window.clone();
    let notification_thread = tokio::spawn(async move {
        while let Some(unb2f) = frontend_update_rx.recv().await {
            let e = mw.emit("audio_state_change", unb2f);
            if let Err(e) = e {
                log::error!("{:?}", e);
            }
        }
    });

    notification_thread
}

fn get_audio_dict(is: &Arc<InstantsSingleton>) -> Result<AudioDict> {
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
            volume: audio.get_volume()?,
            muted: audio.get_mute_state()?,
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

#[derive(serde::Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNotifierB2F {
    all_audio_info: AllAudioInfo,
    notification: Option<Notification>,
}

async fn update_notifing_b2f(
    is: &Arc<InstantsSingleton>,
    audio_dict: &Arc<Mutex<AudioDict>>,
    notification: Option<Notification>,
    tx: &Sender<UpdateNotifierB2F>,
) -> Result<()> {
    let default = is.get_default_audio_id()?;
    let all_audio_info = {
        let dict = audio_dict.lock().map_err(|_| ABAPIError::Unexpected {
            inner: UnexpectedErr::LockError,
        })?;
        AllAudioInfo::new(&dict, default)?
    };

    let unb2f = UpdateNotifierB2F {
        all_audio_info: all_audio_info,
        notification,
    };

    tx.send(unb2f).await.map_err(|_| ABAPIError::Unexpected {
        inner: UnexpectedErr::MPSCClosedError,
    })?;

    Ok(())
}
