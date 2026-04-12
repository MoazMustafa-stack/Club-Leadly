import React, { createContext, useCallback, useEffect, useState } from "react";
import { tokenStorage } from "../lib/storage";
import api from "../lib/api";
import type {
  JWTPayload,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  CreateClubRequest,
  JoinClubRequest,
} from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function decodeJWT(token: string): JWTPayload {
  const base64 = token.split(".")[1];
  const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthState {
  token: string | null;
  user: JWTPayload | null;
  isLoading: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  createClub: (data: CreateClubRequest) => Promise<void>;
  joinClub: (data: JoinClubRequest) => Promise<void>;
  logout: () => Promise<void>;

  /** Convenience booleans */
  isAuthenticated: boolean;
  hasClub: boolean;
  isOrganiser: boolean;
}

export const AuthContext = createContext<AuthState>({} as AuthState);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate token from secure store on mount
  useEffect(() => {
    (async () => {
      const stored = await tokenStorage.get();
      if (stored) {
        try {
          const payload = decodeJWT(stored);
          if (payload.exp * 1000 > Date.now()) {
            setToken(stored);
            setUser(payload);
          } else {
            await tokenStorage.remove();
          }
        } catch {
          await tokenStorage.remove();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const saveToken = useCallback(async (newToken: string) => {
    await tokenStorage.set(newToken);
    setToken(newToken);
    setUser(decodeJWT(newToken));
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await api<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await saveToken(res.access_token);
    },
    [saveToken]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await api<TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await saveToken(res.access_token);
    },
    [saveToken]
  );

  const createClub = useCallback(
    async (data: CreateClubRequest) => {
      const res = await api<TokenResponse>("/clubs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await saveToken(res.access_token);
    },
    [saveToken]
  );

  const joinClub = useCallback(
    async (data: JoinClubRequest) => {
      const res = await api<TokenResponse>("/clubs/join", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await saveToken(res.access_token);
    },
    [saveToken]
  );

  const logout = useCallback(async () => {
    await tokenStorage.remove();
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = token !== null;
  const hasClub = user?.club_id !== null && user?.club_id !== undefined;
  const isOrganiser = user?.role === "organiser";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        register,
        createClub,
        joinClub,
        logout,
        isAuthenticated,
        hasClub,
        isOrganiser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
