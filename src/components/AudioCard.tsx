import { getNeatID, volFloat2Str, volFloat2Int, volInt2Float } from "@/util";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import Slider from "@mui/material/Slider";
import ListItem from "@mui/material/ListItem";
import { invoke_query } from "@/query";
import { useEffect, useState, useRef } from "react";

interface AudioProps {
  is_default: boolean;
  id: string;
  name: string;
  volume: number;
  muted: boolean;
}

function AudioCard(props: AudioProps) {
  const actualVol = volFloat2Int(props.volume);
  const [currentVol, setCurrentVol] = useState<number>(actualVol);
  const submitHandleID = useRef<number | null>(null);

  useEffect(() => {
    setCurrentVol(actualVol);
  }, [actualVol]);

  const cardClick = async () => {
    if (props.is_default) {
      await invoke_query({ kind: "QBeep" });
    } else {
      await invoke_query({ kind: "QDefaultAudioChange", id: props.id });
    }
  };

  const volChange = (volume: number) => {
    setCurrentVol(volume);
    const floatVol = volInt2Float(volume);

    if (submitHandleID.current !== null) {
      clearTimeout(submitHandleID.current);
    }
    submitHandleID.current = window.setTimeout(async () => {
      await invoke_query({
        kind: "QVolumeChange",
        id: props.id,
        volume: floatVol,
      });
    }, 50);
  };

  const muteStateChange = async () => {
    await invoke_query({
      kind: "QMuteStateChange",
      id: props.id,
      muted: !props.muted,
    });
  };

  const volume_part = props.is_default ? (
    <>
      volume:
      <Slider
        sx={{ width: 100, mx: 2 }}
        aria-label="Volume"
        value={currentVol}
        onChange={(_e, v) => volChange(v as number)}
      />
      <div style={{ width: "30px" }}>{currentVol}</div>
      <ListItemIcon onClick={muteStateChange}>
        {props.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </ListItemIcon>
    </>
  ) : (
    <>
      volume:
      <Slider
        sx={{ width: 100, mx: 2 }}
        aria-label="Volume"
        value={currentVol}
        disabled={true}
      />
      <div style={{ width: "30px" }}>{currentVol}</div>
      <ListItemIcon>
        {props.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </ListItemIcon>
    </>
  );

  return (
    <ListItem>
      <ListItemButton onClick={cardClick}>
        <ListItemIcon>
          <Checkbox edge="start" checked={props.is_default} />
        </ListItemIcon>
        <ListItemText primary={props.name} secondary={getNeatID(props.id)} />
      </ListItemButton>
      {volume_part}
    </ListItem>
  );
}

export default AudioCard;
