import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeTask } from "../lib/api/tasks";

export function useCompleteTask() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return { mutate, isPending };
}
