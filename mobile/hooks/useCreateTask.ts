import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../lib/api/tasks";

export function useCreateTask() {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return { mutate, isPending, error };
}
