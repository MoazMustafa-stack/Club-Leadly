import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../lib/api/tasks";

export function useTasks() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 15_000,
  });

  return { tasks: data ?? [], isLoading, isError, refetch };
}
