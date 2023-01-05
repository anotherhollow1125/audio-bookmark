import { appWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/api/process";

export default function initCustomTitlebar() {
  document
    ?.getElementById("titlebar-minimize")
    ?.addEventListener("click", () => appWindow.hide());
  document
    ?.getElementById("titlebar-close")
    ?.addEventListener("click", async () => await exit(0));
}
