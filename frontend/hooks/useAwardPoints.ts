import { useMutation, useQueryClient } from "@tanstack/react-query";
import { awardPoints } from "../lib/api/points";

export function useAwardPoints() {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: awardPoints,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return { mutate, isPending, error };
}
