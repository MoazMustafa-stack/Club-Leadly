import React from "react";
import { Platform } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import {
  registerForPushNotificationsAsync,
  savePushTokenToServer,
  useNotificationListeners,
} from "../lib/notifications";
import { LoadingScreen } from "../components/ui";

const queryClient = new QueryClient();

function RootNavigator() {
  const { isAuthenticated, hasClub, isLoading, user } =
    React.useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  // Register push notifications when user is authenticated and in a club
  React.useEffect(() => {
    if (!isAuthenticated || !hasClub || !user?.club_id) return;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushTokenToServer(token);
        }
      } catch (error) {
        console.warn("Push notification setup failed:", error);
      }
    })();
  }, [isAuthenticated, hasClub, user?.club_id]);

  // Set up notification listeners
  React.useEffect(() => {
    const cleanup = useNotificationListeners((data) => {
      // Navigate based on notification type
      if (data.type === "task_assigned" || data.type === "task_due_soon") {
        router.push("/(tabs)/tasks");
      } else if (data.type === "points_awarded") {
        router.push("/(tabs)/leaderboard");
      }
    });
    return cleanup;
  }, [router]);

  // Handle notification that launched the app (cold start — native only)
  React.useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      const response =
        await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;
        if (
          data.type === "task_assigned" ||
          data.type === "task_due_soon"
        ) {
          router.push("/(tabs)/tasks");
        } else if (data.type === "points_awarded") {
          router.push("/(tabs)/leaderboard");
        }
      }
    })();
  }, []);

  // Auth gate navigation
  React.useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";
    const inClub = segments[0] === "(club)";

    if (!isAuthenticated) {
      if (!inAuth) router.replace("/(auth)/login");
    } else if (!hasClub) {
      if (!inClub) router.replace("/(club)/create-club");
    } else {
      if (inAuth || inClub) router.replace("/(tabs)");
    }
  }, [isAuthenticated, hasClub, isLoading, segments]);

  if (isLoading) return <LoadingScreen />;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
