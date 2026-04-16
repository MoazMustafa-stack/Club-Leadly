import React, { createContext, useContext, useEffect, useState } from "react"
import { setAuthToken, parseJwt } from "../services/api"

export interface DecodedToken {
  sub: string
  email: string
  role: "organiser" | "member"
  club_id: string | null
}

interface AuthContextType {
  token: string | null
  decoded: DecodedToken | null
  setToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

function isTokenExpired(decoded: DecodedToken & { exp?: number }): boolean {
  if (!decoded.exp) return false
  return Date.now() / 1000 > decoded.exp
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)

  const decoded: (DecodedToken & { exp?: number }) | null = token ? parseJwt(token) : null

  // Auto-clear expired token after each token change
  useEffect(() => {
    if (decoded && isTokenExpired(decoded)) {
      setAuthToken(null)
      setTokenState(null)
    }
  }, [token])

  function setToken(t: string) {
    setAuthToken(t)
    setTokenState(t)
  }

  function logout() {
    setAuthToken(null)
    setTokenState(null)
  }

  return (
    <AuthContext.Provider value={{ token, decoded, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
