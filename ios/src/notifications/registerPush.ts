import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { api } from "../auth/api";

const TOKEN_KEY = "push_device_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushNotifications(locale: string): Promise<void> {
  if (Platform.OS !== "ios") return;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return;

  const device = await Notifications.getDevicePushTokenAsync();
  const token = typeof device.data === "string" ? device.data : "";
  if (!token) return;

  await api.post("/devices", { token, platform: "ios", locale }).catch(async () => {
    await api.get("/categories", {
      headers: {
        "X-Push-Token": token,
        "X-Push-Locale": locale,
      },
    });
  });
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return;
  try {
    await api.delete(`/devices/${encodeURIComponent(token)}`);
  } catch {
    try {
      await api.get("/categories", { headers: { "X-Push-Unregister": token } });
    } catch {
      // Best-effort: still drop the local token so we don't keep a stale one.
    }
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
