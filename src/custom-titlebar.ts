import { appWindow } from '@tauri-apps/api/window'

export default function initCustomTitlebar() {
    document?.getElementById('titlebar-minimize')?.addEventListener('click', () => appWindow.hide())
    document?.getElementById('titlebar-close')?.addEventListener('click', () => appWindow.close())
}