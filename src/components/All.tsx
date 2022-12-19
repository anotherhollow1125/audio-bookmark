import { AudioInfo, AllAudioInfoFromBack } from "@/audio_type";
import AudioCard from "@/components/AudioCard";
import List from "@mui/material/List";

interface AllProps {
  allAudioInfo: AllAudioInfoFromBack;
}

function All({ allAudioInfo }: AllProps) {
  return (
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

export default All;
