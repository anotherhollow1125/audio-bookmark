import { Dispatch, SetStateAction } from "react";
import { CustomAudioInfo, AllAudioInfoFromBack } from "@/audio_type";
import ProfileAudioCard from "@/components/ProfileAudioCard";
import List from "@mui/material/List";
import EditAudioModal from "@/components/EditAudioModal";
import { Profile } from "@/profiles_hook";

interface ProfileProps {
  profile: Profile;
  allAudioInfo: AllAudioInfoFromBack;
  modProfile: (profile: Profile) => void;
  setEditAudioModal: Dispatch<SetStateAction<JSX.Element | null>>;
  audios: CustomAudioInfo[];
}

function ProfileAudios({
  profile,
  allAudioInfo,
  modProfile,
  setEditAudioModal,
  audios,
}: ProfileProps) {
  const apply_callback = (id: string, nick_name: string, shortcut: string) => {
    setEditAudioModal(null);
    const target_audio = profile.audios.find((pai) => pai.id == id);

    if (target_audio) {
      target_audio.nick_name = nick_name != "" ? nick_name : target_audio.name;
      target_audio.shortcut = shortcut;
      // 新しいインスタンスを作る必要性はないものの念のため
      modProfile({ ...profile });
    }
  };

  return (
    <List>
      {Array.from(audios).map((audio_info) => {
        return (
          <ProfileAudioCard
            is_default={audio_info.id == allAudioInfo.default}
            key={audio_info.id}
            real_name={audio_info.name}
            setting_callback={() =>
              setEditAudioModal(
                <EditAudioModal
                  id={audio_info.id}
                  real_name={audio_info.name}
                  nick_name={audio_info.nick_name}
                  shortcut={audio_info.shortcut}
                  apply_callback={(n: string, s: string) =>
                    apply_callback(audio_info.id, n, s)
                  }
                />
              )
            }
            {...audio_info}
          />
        );
      })}
    </List>
  );
}

export default ProfileAudios;
