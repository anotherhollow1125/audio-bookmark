import { useState, useEffect, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import "./App.css";
import { UpdateNotifierB2F } from "@/notify_from_back_type";
import { AudioInfo, AllAudioInfo } from "@/audio_type";
import AudioCard from "@/components/AudioCard";
import List from "@mui/material/List";
import { invoke_query } from "@/query";

function App() {
  const [allAudioInfo, setAllAudioInfo] = useState<AllAudioInfo | null>(null);
  const initializeAsyncFn = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (initializeAsyncFn.current !== null) {
      return;
    }

    initializeAsyncFn.current = async () => {
      await listen<UpdateNotifierB2F>("audio_state_change", (event) => {
        setAllAudioInfo({ ...event.payload.allAudioInfo });
      });
      await invoke_query({ kind: "QAudioDict" });

      console.log("initialized");
    };
    initializeAsyncFn.current();
  }, []);

  return allAudioInfo == null ? (
    <>Loading...</>
  ) : (
    <>
      <List>
        {allAudioInfo.audios.map((audio_info: AudioInfo) => {
          return (
            <AudioCard
              is_default={audio_info.id == allAudioInfo.default}
              key={audio_info.id}
              {...audio_info}
            />
          );
        })}
      </List>
    </>
  );
}

export default App;
