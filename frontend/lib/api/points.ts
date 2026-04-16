import api from "../api";
import type {
  LeaderboardResponse,
  PointLogResponse,
  AwardPointsRequest,
} from "../types";

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return api<LeaderboardResponse>("/points/leaderboard");
}

export async function fetchPointHistory(
  userId?: string
): Promise<PointLogResponse[]> {
  const params = userId ? `?user_id=${userId}` : "";
  return api<PointLogResponse[]>(`/points/history${params}`);
}

export async function awardPoints(
  data: AwardPointsRequest
): Promise<PointLogResponse> {
  return api<PointLogResponse>("/points/award", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
