import { Stack } from "expo-router";

export default function ClubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create-club" />
      <Stack.Screen name="join-club" />
    </Stack>
  );
}
