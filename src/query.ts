import { invoke } from "@tauri-apps/api/tauri";

export type QAudioDict = {
  kind: "QAudioDict";
};

export type QDefaultAudioChange = {
  kind: "QDefaultAudioChange";
  id: string;
};

export type QVolumeChange = {
  kind: "QVolumeChange";
  id: string;
  volume: number;
};

export type QMuteStateChange = {
  kind: "QMuteStateChange";
  id: string;
  muted: boolean;
};

export type QBeep = {
  kind: "QBeep";
};

// union type
export type Query =
  | QAudioDict
  | QDefaultAudioChange
  | QVolumeChange
  | QMuteStateChange
  | QBeep;

export async function invoke_query(query: Query): Promise<void> {
  await invoke("query", { query });
}
