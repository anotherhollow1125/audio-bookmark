export type AudioInfo = {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
};

export type AllAudioInfo = {
  audios: AudioInfo[];
  default: string;
};