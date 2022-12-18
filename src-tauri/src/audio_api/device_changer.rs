#![allow(non_snake_case)]

use anyhow::{anyhow, Result};
use windows::{
    core::{interface, IUnknown, IUnknown_Vtbl, GUID, HRESULT, HSTRING, PCWSTR},
    Win32::Media::Audio::{eCommunications, eConsole, eMultimedia},
    Win32::System::Com::{CoCreateInstance, CLSCTX_ALL},
};

#[interface("F8679F50-850A-41CF-9C72-430F290290C8")]
unsafe trait IPolicyConfig: IUnknown {
    fn GetMixFormat(&self) -> HRESULT;
    fn GetDeviceFormat(&self) -> HRESULT;
    fn ResetDeviceFormat(&self) -> HRESULT;
    fn SetDeviceFormat(&self) -> HRESULT;
    fn GetProcessingPeriod(&self) -> HRESULT;
    fn SetProcessingPeriod(&self) -> HRESULT;
    fn GetShareMode(&self) -> HRESULT;
    fn SetShareMode(&self) -> HRESULT;
    fn GetPropertyValue(&self) -> HRESULT;
    fn SetPropertyValue(&self) -> HRESULT;
    fn SetDefaultEndpoint(&self, deviceID: *const u16, role: u32) -> HRESULT;
    fn SetEndpointVisibility(&self) -> HRESULT;
}

// 870AF99C-171D-4F9E-AF0D-E63DF40C2BC9
#[allow(non_upper_case_globals)]
const CLSID_PolicyConfigClient: GUID = GUID {
    data1: 0x870AF99C,
    data2: 0x171D,
    data3: 0x4F9E,
    data4: [0xAF, 0x0D, 0xE6, 0x3D, 0xF4, 0x0C, 0x2B, 0xC9],
};

// https://www.natsuneko.blog/entry/2020/01/16/rust-windows-com
// https://imu0x10.hatenablog.com/entry/20111106/1320577919
// https://learn.microsoft.com/ja-jp/windows/win32/api/mmdeviceapi/ne-mmdeviceapi-erole
// https://github.com/microsoft/windows-rs/blob/8f4f65ee6f4ebdd6826cdf5aa8ff0a7db4316972/docs/FAQ.md

pub(crate) struct PolicyConfig(IPolicyConfig);

impl PolicyConfig {
    pub(crate) fn new() -> Result<Self> {
        let policy_config =
            unsafe { CoCreateInstance(&CLSID_PolicyConfigClient, None, CLSCTX_ALL)? };
        Ok(PolicyConfig(policy_config))
    }

    pub(crate) fn set_default_endpoint(&self, device_id: &str) -> Result<()> {
        let device_id: HSTRING = device_id.into();
        let device_id: PCWSTR = (&device_id).into();

        unsafe {
            let hr = self
                .0
                .SetDefaultEndpoint(device_id.as_ptr(), eConsole.0 as _);
            if hr.0 != 0 {
                return Err(anyhow!("Error with 0x{:X}", hr.0));
            }

            let hr = self
                .0
                .SetDefaultEndpoint(device_id.as_ptr(), eMultimedia.0 as _);
            if hr.0 != 0 {
                return Err(anyhow!("Error with 0x{:X}", hr.0));
            }

            let hr = self
                .0
                .SetDefaultEndpoint(device_id.as_ptr(), eCommunications.0 as _);
            if hr.0 != 0 {
                return Err(anyhow!("Error with 0x{:X}", hr.0));
            }
        }

        Ok(())
    }
}
