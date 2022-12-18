mod device_changer;
pub mod notifier;

use anyhow::Result;
use std::sync::Arc;
use tokio::sync::mpsc::Sender;
use windows::Win32::{
    Devices::FunctionDiscovery::PKEY_Device_FriendlyName,
    Media::Audio::{
        eMultimedia, eRender, Endpoints::IAudioEndpointVolume, IMMDevice, IMMDeviceEnumerator,
        MMDeviceEnumerator, DEVICE_STATE_ACTIVE,
    },
    System::Com::{CoCreateInstance, CoInitialize, CoUninitialize, CLSCTX_ALL, STGM_READ},
    UI::Shell::PropertiesSystem::PropVariantToStringAlloc,
};
// use std::sync::mpsc::Sender;

struct Com;

impl Com {
    pub fn new() -> Result<Self> {
        unsafe {
            CoInitialize(None)?;
        }

        Ok(Com)
    }
}

impl Drop for Com {
    fn drop(&mut self) {
        unsafe {
            CoUninitialize();
        }
    }
}

pub struct InstantsSingleton {
    _com: Com,
    pub(crate) device_enumerator: IMMDeviceEnumerator,
    notification_callbacks: notifier::NotificationCallbacks,
    policy_config: device_changer::PolicyConfig,
}

unsafe impl Send for InstantsSingleton {}
unsafe impl Sync for InstantsSingleton {}

impl InstantsSingleton {
    pub fn new(tx: &Sender<notifier::Notification>) -> Result<Self> {
        let com = Com::new()?;
        let device_enumerator = unsafe { CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)? };
        let notification_callbacks = notifier::NotificationCallbacks::new(tx);
        notification_callbacks.register_to_enumerator(&device_enumerator)?;

        let policy_config = device_changer::PolicyConfig::new()?;

        Ok(InstantsSingleton {
            _com: com,
            device_enumerator,
            notification_callbacks,
            policy_config,
        })
    }

    pub fn get_active_audios(self: &Arc<Self>) -> Result<Vec<Audio>> {
        let device_collection = unsafe {
            self.device_enumerator
                .EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE)?
        };

        let len = unsafe { device_collection.GetCount()? };

        let audios = (0..len)
            .map(|i| {
                let device = unsafe { device_collection.Item(i)? };
                Audio::new(Arc::clone(self), device)
            })
            .collect::<Result<Vec<_>>>()?;

        Ok(audios)
    }

    pub fn get_default_audio_id(&self) -> Result<String> {
        let device = unsafe {
            self.device_enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)?
        };
        let id = unsafe { device.GetId()?.to_string()? };

        Ok(id)
    }
}

impl Drop for InstantsSingleton {
    fn drop(&mut self) {
        self.notification_callbacks
            .unregister_to_enumerator(&self.device_enumerator)
            .unwrap();
    }
}

fn get_name_from_immdevice(device: &IMMDevice) -> Result<String> {
    let property_store = unsafe { device.OpenPropertyStore(STGM_READ)? };
    let name_propvariant = unsafe { property_store.GetValue(&PKEY_Device_FriendlyName)? };
    let name = unsafe { PropVariantToStringAlloc(&name_propvariant)?.to_string()? };

    Ok(name)
}

pub struct Audio {
    pub id: String,
    pub name: String,
    _device: IMMDevice,
    pub(crate) volume: IAudioEndpointVolume,
    is: Arc<InstantsSingleton>,
}

unsafe impl Send for Audio {}
unsafe impl Sync for Audio {}

impl Audio {
    pub fn new(is: Arc<InstantsSingleton>, device: IMMDevice) -> Result<Self> {
        let id = unsafe { device.GetId()?.to_string()? };
        let name = get_name_from_immdevice(&device)?;

        let volume: IAudioEndpointVolume = unsafe { device.Activate(CLSCTX_ALL, None)? };

        is.notification_callbacks.register_to_volume(&volume)?;

        Ok(Audio {
            id,
            name,
            _device: device,
            volume,
            is,
        })
    }

    pub fn set_as_default(&self) -> Result<()> {
        self.is.policy_config.set_default_endpoint(&self.id)?;

        Ok(())
    }

    pub fn get_volume(&self) -> Result<f32> {
        let volume = unsafe { self.volume.GetMasterVolumeLevelScalar()? };

        Ok(volume)
    }

    pub fn get_mute_state(&self) -> Result<bool> {
        let mute_state = unsafe { self.volume.GetMute()?.as_bool() };

        Ok(mute_state)
    }

    pub fn set_volume(&self, volume: f32) -> Result<()> {
        unsafe {
            self.volume
                .SetMasterVolumeLevelScalar(volume, std::ptr::null())?;
        }

        Ok(())
    }

    pub fn set_mute_state(&self, mute_state: bool) -> Result<()> {
        unsafe {
            self.volume.SetMute(mute_state, std::ptr::null())?;
        }

        Ok(())
    }
}

impl Drop for Audio {
    fn drop(&mut self) {
        self.is
            .notification_callbacks
            .unregister_to_volume(&self.volume)
            .unwrap();
    }
}
