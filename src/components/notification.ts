import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export async function initNotification() {
    await checkPermission();
}

async function checkPermission(): Promise<boolean> {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }
    return permissionGranted;
}

export async function showNotification(title: string, body: string) {
    if (!(await checkPermission())) {
        return;
    }

    await sendNotification({
        title,
        body,
    });
}