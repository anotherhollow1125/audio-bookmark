import { AllAudioInfo } from "@/audio_type";

export type DefaultDeviceChanged = {
  typ: "DefaultDeviceChanged";
  id: string;
};

export type DeviceAdded = {
  typ: "DeviceAdded";
  id: string;
};

export type DeviceRemoved = {
  typ: "DeviceRemoved";
  id: string;
};

export type DeviceStateChanged = {
  typ: "DeviceStateChanged";
  id: string;
  state: number;
};

export type PropertyValueChanged = {
  typ: "PropertyValueChanged";
  id: string;
  key: string;
};

export type VolumeChanged = {
  typ: "VolumeChanged";
  id: string;
  volume: number;
  muted: boolean;
};

export type NotificationFromBack = DefaultDeviceChanged | DeviceAdded | DeviceRemoved | DeviceStateChanged | PropertyValueChanged | VolumeChanged;
export type UpdateNotifierB2F = {
  allAudioInfo: AllAudioInfo;
  notification: NotificationFromBack | null;
};