import Slider from "@mui/material/Slider";
import ListItemIcon from "@mui/material/ListItemIcon";
import { getNeatID, volFloat2Int, volInt2Float } from "@/util";
import { useEffect, useState, useRef } from "react";
import { invoke_query } from "@/query";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import Box from "@mui/material/Box";
import MuiInput from "@mui/material/Input";
import { styled } from "@mui/material/styles";

interface SliderProps {
  is_default: boolean;
  id: string;
  volume: number;
  muted: boolean;
}

const Input = styled(MuiInput)({
  width: 42,
});

function SliderPart(props: SliderProps) {
  const actualVol = volFloat2Int(props.volume);
  const [currentVol, setCurrentVol] = useState<number>(actualVol);
  const submitHandleID = useRef<number | null>(null);

  useEffect(() => {
    setCurrentVol(actualVol);
  }, [actualVol]);

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ListItemIcon onClick={props.is_default ? muteStateChange : () => {}}>
        {props.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </ListItemIcon>
      <Slider
        sx={{
          width: 100,
          mx: 2,
        }}
        aria-label="Volume"
        value={currentVol}
        onChange={
          props.is_default ? (_e, v) => volChange(v as number) : () => {}
        }
        disabled={!props.is_default}
      />
      <Input
        value={currentVol}
        size="small"
        onChange={
          props.is_default ? (e) => volChange(Number(e.target.value)) : () => {}
        }
        inputProps={{
          step: 1,
          min: 0,
          max: 100,
          type: "number",
          "aria-labelledby": "Volume",
        }}
      />
      {/* <div style={{ width: "30px" }}>{currentVol}</div> */}
    </Box>
  );
}

export default SliderPart;
