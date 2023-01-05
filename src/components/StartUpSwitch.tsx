import Switch from "@mui/material/Switch";
import { enable, disable, isEnabled } from "@tauri-apps/tauri-plugin-autostart";
import { useEffect, useState, ChangeEvent } from "react";

export default function StartUpSwitch() {
  const [checked, setChecked] = useState(false);
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      await enable();
    } else {
      await disable();
    }
  };

  useEffect(() => {
    isEnabled().then((enabled: boolean) => {
      setChecked(enabled);
    });
  }, []);

  return (
    <Switch
      checked={checked}
      onChange={handleChange}
      inputProps={{ "aria-label": "controlled" }}
    />
  );
}
