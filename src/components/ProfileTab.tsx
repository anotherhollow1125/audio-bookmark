import { useState } from "react";
import { CustomAudioInfo, AudioInfo, AllAudioInfoFromBack } from "@/audio_type";
import Modal from "@mui/material/Modal";
import { Profile } from "@/profiles_hook";
import ProfileAudios from "@/components/ProfileAudios";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EditProfileAudios from "./EditProfileAudios";
import TextField from "@mui/material/TextField";
import ProfileRemoveDialog from "@/components/ProfileRemoveDialog";
import InvalidProfileNameSnackbar from "@/components/InvalidProfileNameSnackbar";

interface ProfileProps {
  profile: Profile;
  allAudioInfo: AllAudioInfoFromBack;
  modProfile: (profile: Profile) => void;
  delProfile: (name: string) => void;
  renameProfile: (old_name: string, new_name: string) => boolean;
}

function ProfileTab(props: ProfileProps) {
  const [editAudioModal, setEditAudioModal] = useState<JSX.Element | null>(
    null
  );
  const [editMode, setEditMode] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>(
    props.profile.name
  );
  const [removeDialogOpen, setRemoveDialogOpen] = useState<boolean>(false);
  const [InvalidProfileNameSnackbarOpen, setInvalidProfileNameSnackbarOpen] =
    useState<boolean>(false);

  const audios: CustomAudioInfo[] = props.allAudioInfo.audios.flatMap(
    (audio_info: AudioInfo) => {
      const prof_audio = props.profile.audios.find(
        (pai) => pai.id == audio_info.id
      );
      if (prof_audio === undefined) {
        return [];
      }

      return [
        {
          ...audio_info,
          nick_name: prof_audio.nick_name,
          shortcut: prof_audio.shortcut,
        },
      ];
    }
  );

  const [memberAudios, setMemberAudios] = useState(audios);

  const save = (_e: any) => {
    if (props.profile.name != newProfileName) {
      const res = props.renameProfile(props.profile.name, newProfileName);
      if (!res) {
        setInvalidProfileNameSnackbarOpen(true);
        return;
      }
    }
    const new_profile = { ...props.profile };
    new_profile.name = newProfileName;
    new_profile.audios = [...memberAudios];
    props.modProfile(new_profile);
    setEditMode(false);
  };
  const enterEditMode = (_e: any) => setEditMode(true);
  const icon = editMode ? <SaveIcon /> : <EditIcon />;
  const button = (
    <Button
      variant="contained"
      onClick={(e) => (editMode ? save(e) : enterEditMode(e))}
    >
      {icon}
    </Button>
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          pb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            flexDirection: "row",
            pb: 1,
          }}
        >
          {editMode ? (
            <TextField
              label="Profile Name"
              variant="standard"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
            />
          ) : (
            <>{props.profile.name}</>
          )}
        </Box>
        {button}
      </Box>
      {editMode ? (
        <Box
          sx={{ display: "flex", width: "100%", justifyContent: "flex-end" }}
        >
          <Button variant="contained" onClick={() => setRemoveDialogOpen(true)}>
            <DeleteIcon />
          </Button>
        </Box>
      ) : (
        <></>
      )}

      {editMode ? (
        <EditProfileAudios
          memberAudios={memberAudios}
          setMemberAudios={setMemberAudios}
          {...props}
        />
      ) : (
        <>
          <ProfileAudios
            setEditAudioModal={setEditAudioModal}
            audios={audios}
            {...props}
          />
          <Modal open={editAudioModal != null}>{editAudioModal ?? <></>}</Modal>
        </>
      )}

      <ProfileRemoveDialog
        open={removeDialogOpen}
        close={() => setRemoveDialogOpen(false)}
        profileName={props.profile.name}
        delProfile={props.delProfile}
      />

      <InvalidProfileNameSnackbar
        open={InvalidProfileNameSnackbarOpen}
        close={() => setInvalidProfileNameSnackbarOpen(false)}
      />
    </>
  );
}

export default ProfileTab;
