import { getNeatID } from "@/util";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import ListItem from "@mui/material/ListItem";
import { invoke_query } from "@/query";
import SliderPart from "@/components/SliderPart";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";

interface AudioProps {
  is_default: boolean;
  id: string;
  volume: number;
  muted: boolean;
  real_name: string;
  nick_name: string;
  setting_callback: () => void;
}

function ProfileAudioCard(props: AudioProps) {
  const cardClick = async () => {
    if (props.is_default) {
      await invoke_query({ kind: "QBeep" });
    } else {
      await invoke_query({ kind: "QDefaultAudioChange", id: props.id });
    }
  };

  const sub_name =
    props.real_name == props.nick_name ? (
      <></>
    ) : (
      <>
        {props.real_name}
        <br />
      </>
    );

  return (
    <ListItem>
      <ListItemButton onClick={cardClick}>
        <ListItemIcon>
          <Checkbox edge="start" checked={props.is_default} />
        </ListItemIcon>
        <ListItemText
          primary={props.nick_name}
          secondary={
            <>
              {sub_name}
              {getNeatID(props.id)}
            </>
          }
        />
      </ListItemButton>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <ListItemButton onClick={props.setting_callback}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
        </ListItemButton>
        <SliderPart {...props}></SliderPart>
      </Box>
    </ListItem>
  );
}

export default ProfileAudioCard;
