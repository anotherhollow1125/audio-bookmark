import { useState, Dispatch, SetStateAction } from "react";
import { CustomAudioInfo, AllAudioInfoFromBack } from "@/audio_type";
import EditProfileAudioCard from "@/components/EditProfileAudioCard";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";

interface EditProfileProps {
  allAudioInfo: AllAudioInfoFromBack;
  memberAudios: CustomAudioInfo[];
  setMemberAudios: Dispatch<SetStateAction<CustomAudioInfo[]>>;
}

function EditProfileAudios({
  allAudioInfo,
  memberAudios,
  setMemberAudios,
}: EditProfileProps) {
  const init_not_member_audios: CustomAudioInfo[] = allAudioInfo.audios
    .filter(
      (audio) => memberAudios.findIndex((value) => value.id == audio.id) == -1
    )
    .map((audio_info) => {
      return { nick_name: audio_info.name, shortcut: "", ...audio_info };
    });

  const [notMemberAudios, setNotMemberAudios] = useState(
    init_not_member_audios
  );

  return (
    <>
      <List>
        {Array.from(memberAudios).map((audio_info) => {
          const removeMember = () => {
            const new_audios = memberAudios.filter(
              (value) => value.id != audio_info.id
            );
            setMemberAudios([...new_audios]);
            notMemberAudios.push(audio_info);
            setNotMemberAudios([...notMemberAudios]);
          };

          return (
            <EditProfileAudioCard
              is_member={true}
              key={audio_info.id}
              real_name={audio_info.name}
              cardClick={removeMember}
              {...audio_info}
            />
          );
        })}
      </List>
      <Divider />
      <List>
        {Array.from(notMemberAudios).map((audio_info) => {
          const new_audio_info = {
            ...audio_info,
          };
          const addMember = () => {
            memberAudios.push(new_audio_info);
            setMemberAudios([...memberAudios]);
            const new_nm_audios = notMemberAudios.filter(
              (value) => value.id != new_audio_info.id
            );
            setNotMemberAudios([...new_nm_audios]);
          };

          return (
            <EditProfileAudioCard
              is_member={false}
              key={new_audio_info.id}
              real_name={new_audio_info.name}
              cardClick={addMember}
              {...new_audio_info}
            />
          );
        })}
      </List>
    </>
  );
}

export default EditProfileAudios;
