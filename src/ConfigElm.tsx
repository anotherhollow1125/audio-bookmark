import Grid from "@mui/material/Grid";
import StartUpSwitch from "./components/StartUpSwitch";
import Button from "@mui/material/Button";
import { getVersion } from "@tauri-apps/api/app";
import { appWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export default function ConfigElm() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then((v) => {
      setVersion(v);
    });
  }, []);

  return (
    <>
      <Grid container spacing={2} sx={{ px: 2, textAlign: "left" }}>
        <Grid item xs={12}>
          <h2>Config</h2>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ px: 2, textAlign: "left" }}>
        <Grid item xs={4}>
          <h4>Start Up</h4>
        </Grid>
        <Grid
          item
          xs={8}
          sx={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
          }}
        >
          <StartUpSwitch />
        </Grid>
      </Grid>

      <Grid
        container
        spacing={2}
        sx={{ px: 2, mt: 2, textAlign: "right", alignItems: "center" }}
      >
        <Grid item xs={8} sx={{ textAlign: "left" }}>
          <h4>{"Ver. " + version}</h4>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            sx={{ textAlign: "center" }}
            onClick={async (_) => await appWindow.hide()}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    </>
  );
}
