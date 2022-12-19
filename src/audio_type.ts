export interface AudioInfo {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
}

// for file export
export interface ProfileAudioInfo {
  id: string;
  name: string;
  nick_name: string;
  shortcut: string;
}

export interface CustomAudioInfo extends AudioInfo, ProfileAudioInfo {}

export type AllAudioInfoFromBack = {
  audios: AudioInfo[];
  default: string;
};
