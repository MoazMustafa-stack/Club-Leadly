import { Platform } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { tokenStorage } from "./storage";
import { isTokenExpired } from "../contexts/AuthContext";

function getApiBase(): string {
  if (Platform.OS === "web") return "http://localhost:8000";
  // Derive host from Metro bundler URI (e.g. "172.16.205.36:8081" → "172.16.205.36")
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:8000`;
  }
  return "http://10.0.2.2:8000"; // fallback for Android emulator
}

const API_BASE = getApiBase();

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getToken(): Promise<string | null> {
  return tokenStorage.get();
}

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  // Proactively check token expiry before sending
  if (token && isTokenExpired(token)) {
    await tokenStorage.remove();
    router.replace("/(auth)/login");
    throw new ApiError("Token expired", 401);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Handle 401 — token rejected by server
    if (res.status === 401) {
      await tokenStorage.remove();
      router.replace("/(auth)/login");
      throw new ApiError("Unauthorized", 401);
    }

    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.detail ?? `Request failed (${res.status})`,
      res.status
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export { ApiError, getToken };
export default api;
