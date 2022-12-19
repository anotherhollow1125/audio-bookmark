import { useState, useEffect, useRef } from "react";
import { AudioInfo, AllAudioInfoFromBack } from "@/audio_type";
import { invoke_query } from "@/query";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { UpdateNotifierB2F } from "@/notify_from_back_type";

const useAllAudioInfo = () => {
  const [allAudioInfo, setAllAudioInfo] = useState<AllAudioInfoFromBack | null>(
    null
  );
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

  return allAudioInfo;
};

export default useAllAudioInfo;
