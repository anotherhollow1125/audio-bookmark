import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useState } from "react";
import { getNeatID } from "@/util";
import Box from "@mui/material/Box";
import { forwardRef } from "react";
import ClearIcon from "@mui/icons-material/Clear";

interface EditModalProps {
  id: string;
  real_name: string;
  nick_name: string;
  shortcut: string;
  apply_callback: (nick_name: string, shortcut: string) => void;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  width: "90vw",
  boxShadow: 24,
  p: 4,
};

function EditAudioModalFunc(props: EditModalProps) {
  const [nickName, setNickName] = useState(props.nick_name);
  const [shortcut, setShortcut] = useState(props.shortcut);

  const handleShortcut = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const shortcut_list = [];
    if (e.altKey) {
      shortcut_list.push("Alt");
    }
    if (e.ctrlKey) {
      shortcut_list.push("Control");
    }
    if (e.shiftKey) {
      shortcut_list.push("Shift");
    }
    if (e.metaKey) {
      shortcut_list.push("Meta");
    }

    if (shortcut_list.indexOf(e.key) == -1) {
      shortcut_list.push(e.key);
    }

    const shortcut = shortcut_list.join("+");
    setShortcut(shortcut);
  };

  return (
    <Box sx={style}>
      <Grid container spacing={2} sx={{ px: 2, my: 2, textAlign: "left" }}>
        <Grid item xs={12}>
          <h2>{props.real_name}</h2>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: 2, my: 2, textAlign: "left" }}>
        <Grid item xs={4}>
          <h4>ID</h4>
        </Grid>
        <Grid item xs={8}>
          <h4>{getNeatID(props.id)}</h4>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: 2, my: 2, textAlign: "left" }}>
        <Grid item xs={4}>
          <h4>NICK NAME</h4>
        </Grid>
        <Grid item xs={8}>
          <TextField
            label="Nick Name"
            variant="outlined"
            fullWidth={true}
            value={nickName}
            onChange={(e) => setNickName(e.target.value)}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: 2, my: 2, textAlign: "left" }}>
        <Grid item xs={4}>
          <h4>SHORTCUT KEY</h4>
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Shortcut Key"
            variant="outlined"
            fullWidth={true}
            value={shortcut}
            onKeyDown={handleShortcut}
          />
        </Grid>
        <Grid item xs={2} sx={{ display: "flex", justifyContent: "center" }}>
          <Button variant="text" onClick={(_) => setShortcut("")}>
            <ClearIcon />
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: 2, my: 2, textAlign: "right" }}>
        <Grid item xs={8}></Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            sx={{ textAlign: "center" }}
            onClick={(_) => props.apply_callback(nickName, shortcut)}
          >
            Apply
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

const EditAudioModal = forwardRef(EditAudioModalFunc);

export default EditAudioModal;
