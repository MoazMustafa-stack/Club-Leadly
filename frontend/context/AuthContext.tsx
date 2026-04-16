import React, { createContext, useContext, useState } from "react"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)

  const decoded: DecodedToken | null = token ? parseJwt(token) : null

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
