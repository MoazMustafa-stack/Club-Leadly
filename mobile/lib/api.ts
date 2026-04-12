import { Platform } from "react-native";
import { tokenStorage } from "./storage";

const API_BASE =
  Platform.OS === "web"
    ? "http://localhost:8000"
    : "http://10.0.2.2:8000"; // Android emulator → host machine

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
