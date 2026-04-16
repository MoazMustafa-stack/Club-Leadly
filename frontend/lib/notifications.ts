import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";
import api from "./api";

// ---------------------------------------------------------------------------
// Configure how notifications are handled when the app is in the foreground
// ---------------------------------------------------------------------------
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ---------------------------------------------------------------------------
// Register for push notifications and return the Expo push token
// ---------------------------------------------------------------------------
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Push notifications are not supported on web
  if (Platform.OS === "web") return null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Check / request permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get the Expo push token
  const projectId =
    (await Application.getApplicationIdAsync()) ?? undefined;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

// ---------------------------------------------------------------------------
// Save the push token to the backend
// ---------------------------------------------------------------------------
export async function savePushTokenToServer(token: string): Promise<void> {
  try {
    await api("/notifications/register-token", {
      method: "POST",
      body: JSON.stringify({
        push_token: token,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    console.warn("Failed to register push token:", error);
  }
}

// ---------------------------------------------------------------------------
// Notification listeners — call from root layout
// ---------------------------------------------------------------------------
export function useNotificationListeners(
  onNotificationTap?: (data: Record<string, string>) => void
) {
  // No notification listeners on web
  if (Platform.OS === "web") return () => {};

  // Listener for notifications received while app is foregrounded
  const notificationListener =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification.request.content.title);
    });

  // Listener for when user taps on a notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<
        string,
        string
      >;
      onNotificationTap?.(data);
    });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
