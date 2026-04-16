import { Redirect } from "expo-router";

// Registration is now handled in the login screen via mode toggle
export default function RegisterRedirect() {
  return <Redirect href="/(auth)/login" />;
}