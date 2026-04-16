import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "../lib/api/points";

export function useLeaderboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 20_000,
  });

  return { leaderboard: data ?? null, isLoading, isError, refetch };
}
