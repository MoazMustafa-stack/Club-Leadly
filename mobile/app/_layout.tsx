import React from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import { LoadingScreen } from "../components/ui";

const queryClient = new QueryClient();

function RootNavigator() {
  const { isAuthenticated, hasClub, isLoading } = React.useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";
    const inClub = segments[0] === "(club)";

    if (!isAuthenticated) {
      // Not logged in → go to login
      if (!inAuth) router.replace("/(auth)/login");
    } else if (!hasClub) {
      // Logged in but no club → go to create-club
      if (!inClub) router.replace("/(club)/create-club");
    } else {
      // Logged in + has club → go to tabs
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
