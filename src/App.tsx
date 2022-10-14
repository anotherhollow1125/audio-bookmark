import { useState, useEffect } from "react";
import { listen } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { NotificationFromBack } from "notify_from_back";
import { AudioInfo, AllAudioInfo } from "auio_type";

function App() {
  const [allAudioInfo, setAllAudioInfo] = useState<AllAudioInfo | null>(null);

  useEffect(() => {
    (async () => {
      const new_audio_info = await invoke<AllAudioInfo>("query_all_audio_info");
      setAllAudioInfo(new_audio_info);

      listen<NotificationFromBack>("audio_state_change", event => {
        invoke("query_all_audio_info", { notification: event.payload});
      });
      
      listen<AllAudioInfo>("response_for_request", event => {
        setAllAudioInfo(event.payload);
      });

      console.log("initialized");
    })();
  }, []);

  return (
    allAudioInfo == null ? <></> : <>
      Default: {allAudioInfo.default} <br />
      {allAudioInfo.audios.map((audio_info: AudioInfo) => {
        return <div key={audio_info.id}>
          {audio_info.id == allAudioInfo.default ? "*" : ""}
           {audio_info.id}: {audio_info.name} volume: {audio_info.volume} mute: {audio_info.muted ? "○" : "☓"}
        </div>;
      })}
    </>
  );
}

export default App;
