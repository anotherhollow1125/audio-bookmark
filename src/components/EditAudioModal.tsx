import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useState } from "react";
import { getNeatID } from "@/util";
import Box from "@mui/material/Box";
import { forwardRef, ForwardedRef } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import InvalidSnackbar from "./InvalidSnackbars";

interface EditModalProps {
  id: string;
  real_name: string;
  nick_name: string;
  shortcut: string;
  another_shortcut_list: string[];
  apply_callback: (nick_name: string, shortcut: string) => void;
  cancel_callback: () => void;
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

function EditAudioModalFunc(
  props: EditModalProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const [nickName, setNickName] = useState(props.nick_name);
  const [shortcut, setShortcut] = useState(props.shortcut);
  const [InvalidShortcutSnackbarStr, setInvalidShortcutSnackbarStr] = useState<
    string | null
  >(null);

  const handleShortcut = async (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    if (props.another_shortcut_list.find((s) => s == shortcut) === undefined) {
      setShortcut(shortcut);
    } else {
      setInvalidShortcutSnackbarStr(shortcut);
    }
  };

  return (
    <>
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
          <Grid item xs={6}></Grid>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              sx={{ textAlign: "center" }}
              onClick={(_) => props.cancel_callback()}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item xs={2}>
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
      <InvalidSnackbar
        message={`"${InvalidShortcutSnackbarStr}" is already used.`}
        open={InvalidShortcutSnackbarStr !== null}
        close={() => setInvalidShortcutSnackbarStr(null)}
      />
    </>
  );
}

const EditAudioModal = forwardRef(EditAudioModalFunc);

export default EditAudioModal;
