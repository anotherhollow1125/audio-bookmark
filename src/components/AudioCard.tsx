import { getNeatID, volFloat2Int, volInt2Float } from "@/util";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import ListItem from "@mui/material/ListItem";
import { invoke_query } from "@/query";
import SliderPart from "@/components/SliderPart";

interface AudioProps {
  is_default: boolean;
  id: string;
  name: string;
  volume: number;
  muted: boolean;
}

function AudioCard(props: AudioProps) {
  const cardClick = async () => {
    if (props.is_default) {
      await invoke_query({ kind: "QBeep" });
    } else {
      await invoke_query({ kind: "QDefaultAudioChange", id: props.id });
    }
  };

  return (
    <ListItem>
      <ListItemButton onClick={cardClick}>
        <ListItemIcon>
          <Radio checked={props.is_default} />
        </ListItemIcon>
        <ListItemText primary={props.name} secondary={getNeatID(props.id)} />
      </ListItemButton>
      <SliderPart {...props}></SliderPart>
    </ListItem>
  );
}

export default AudioCard;
