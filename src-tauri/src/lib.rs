mod device_changer;
pub mod log;
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
    pub unsafe fn new(tx: &Sender<notifier::Notification>) -> Result<Self> {
        let com = Com::new()?;
        let device_enumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
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

    pub unsafe fn get_active_audios(self: &Arc<Self>) -> Result<Vec<Audio>> {
        let device_collection = self
            .device_enumerator
            .EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE)?;

        let len = device_collection.GetCount()?;

        let audios = (0..len)
            .map(|i| {
                let device = device_collection.Item(i)?;
                Audio::new(Arc::clone(self), device)
            })
            .collect::<Result<Vec<_>>>()?;

        Ok(audios)
    }

    pub unsafe fn get_default_audio_id(&self) -> Result<String> {
        let device = self
            .device_enumerator
            .GetDefaultAudioEndpoint(eRender, eMultimedia)?;
        let id = device.GetId()?.to_string()?;

        Ok(id)
    }
}

impl Drop for InstantsSingleton {
    fn drop(&mut self) {
        unsafe {
            self.notification_callbacks
                .unregister_to_enumerator(&self.device_enumerator)
                .unwrap();
        }
    }
}

unsafe fn get_name_from_immdevice(device: &IMMDevice) -> Result<String> {
    let property_store = device.OpenPropertyStore(STGM_READ)?;
    let name_propvariant = property_store.GetValue(&PKEY_Device_FriendlyName)?;
    let name = PropVariantToStringAlloc(&name_propvariant)?.to_string()?;

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
    pub unsafe fn new(is: Arc<InstantsSingleton>, device: IMMDevice) -> Result<Self> {
        let id = device.GetId()?.to_string()?;
        let name = get_name_from_immdevice(&device)?;

        let volume: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None)?;

        is.notification_callbacks.register_to_volume(&volume)?;

        Ok(Audio {
            id,
            name,
            _device: device,
            volume,
            is,
        })
    }

    pub unsafe fn set_as_default(&self) -> Result<()> {
        self.is.policy_config.set_default_endpoint(&self.id)?;

        Ok(())
    }

    pub unsafe fn get_volume(&self) -> Result<f32> {
        let volume = self.volume.GetMasterVolumeLevelScalar()?;

        Ok(volume)
    }

    pub unsafe fn get_mute_state(&self) -> Result<bool> {
        let mute_state = self.volume.GetMute()?.as_bool();

        Ok(mute_state)
    }

    pub unsafe fn set_volume(&self, volume: f32) -> Result<()> {
        self.volume
            .SetMasterVolumeLevelScalar(volume, std::ptr::null())?;

        Ok(())
    }

    pub unsafe fn set_mute_state(&self, mute_state: bool) -> Result<()> {
        self.volume.SetMute(mute_state, std::ptr::null())?;

        Ok(())
    }
}

impl Drop for Audio {
    fn drop(&mut self) {
        unsafe {
            self.is
                .notification_callbacks
                .unregister_to_volume(&self.volume)
                .unwrap();
        }
    }
}
