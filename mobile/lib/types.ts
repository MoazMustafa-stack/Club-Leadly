// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// JWT payload decoded from the access token
export interface JWTPayload {
  sub: string; // user_id
  club_id: string | null;
  role: string | null; // "organiser" | "member"
  email: string;
  exp: number;
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------
export interface CreateClubRequest {
  name: string;
}

export interface JoinClubRequest {
  join_code: string;
}

export interface ClubResponse {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface MemberResponse {
  user_id: string;
  full_name: string;
  avatar_initials: string;
  role: string;
  total_points: number;
  joined_at: string;
}

export interface ClubDetailResponse {
  club: ClubResponse;
  members: MemberResponse[];
  total_members: number;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export interface CreateTaskRequest {
  title: string;
  description?: string;
  point_value?: number;
  assigned_to_user_id?: string;
  due_at?: string;
}

export interface TaskResponse {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  point_value: number;
  status: "pending" | "completed";
  due_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Points
// ---------------------------------------------------------------------------
export interface AwardPointsRequest {
  user_id: string;
  delta: number;
  reason: string;
}

export interface PointLogResponse {
  id: string;
  club_id: string;
  user_id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_initials: string;
  total_points: number;
  tasks_completed: number;
}

export interface LeaderboardResponse {
  club_id: string;
  entries: LeaderboardEntry[];
  generated_at: string;
}
