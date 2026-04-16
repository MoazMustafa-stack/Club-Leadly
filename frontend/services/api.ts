const API_BASE = "https://clubleadly-api.onrender.com"

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

export function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }
  if (options.body) headers["Content-Type"] = "application/json"
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  const contentType = res.headers.get("content-type") ?? ""
  const body = contentType.includes("json") ? await res.json() : await res.text()

  if (!res.ok) {
    const msg =
      typeof body === "object"
        ? (body as any).detail
          ? Array.isArray((body as any).detail)
            ? (body as any).detail.map((d: any) => d.msg).join(", ")
            : (body as any).detail
          : JSON.stringify(body)
        : body
    throw new Error(msg as string)
  }
  return body as T
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
}

export const register = (fullName: string, email: string, password: string) =>
  request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name: fullName, email, password }),
  })

export const login = (email: string, password: string) =>
  request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

// ── Clubs ─────────────────────────────────────────────────────────────────────

export interface ClubMember {
  user_id: string
  full_name: string
  role: string
  total_points: number
  joined_at: string
}

export interface ClubMe {
  club: { name: string; join_code: string; created_at: string }
  members: ClubMember[]
  total_members: number
}

export const createClub = (name: string) =>
  request<AuthResponse>("/clubs", { method: "POST", body: JSON.stringify({ name }) })

export const joinClub = (joinCode: string) =>
  request<AuthResponse>("/clubs/join", { method: "POST", body: JSON.stringify({ join_code: joinCode }) })

export const getClubMe = () => request<ClubMe>("/clubs/me")

export const getMembers = () => request<ClubMember[]>("/clubs/members")

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "completed"
  point_value: number
  assigned_to_user_id?: string
  assigned_to_name?: string
  due_at?: string
  created_at: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  point_value?: number
  assigned_to_user_id?: string
  due_at?: string
}

export const getTasks = () => request<Task[]>("/tasks")
export const getTask = (id: string) => request<Task>(`/tasks/${id}`)
export const createTask = (data: CreateTaskPayload) =>
  request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) })
export const updateTask = (id: string, data: Partial<CreateTaskPayload & { status: string }>) =>
  request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) })
export const deleteTask = (id: string) =>
  request<void>(`/tasks/${id}`, { method: "DELETE" })
export const completeTask = (id: string) =>
  request<Task>(`/tasks/${id}/complete`, { method: "PATCH" })

// ── Points ────────────────────────────────────────────────────────────────────

export interface PointLog {
  id: string
  delta: number
  reason: string
  created_at: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  full_name: string
  total_points: number
  tasks_completed: number
  avatar_initials: string
}

export interface Leaderboard {
  entries: LeaderboardEntry[]
}

export const awardPoints = (userId: string, delta: number, reason: string) =>
  request<void>("/points/award", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, delta, reason }),
  })

export const getPointHistory = () => request<PointLog[]>("/points/history")
export const getLeaderboard = () => request<Leaderboard>("/points/leaderboard")
