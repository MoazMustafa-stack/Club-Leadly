import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { MemberResponse } from "../lib/types";

export function useMembers() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: () => api<MemberResponse[]>("/clubs/members"),
    staleTime: 30_000,
  });

  return { members: data ?? [], isLoading, isError, refetch };
}
