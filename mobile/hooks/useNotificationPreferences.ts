import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "../lib/api/notifications";
import type { NotificationPreferences } from "../lib/types";

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: fetchNotificationPreferences,
    staleTime: 60_000,
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] });
      const previous = queryClient.getQueryData<NotificationPreferences>([
        "notification-preferences",
      ]);
      queryClient.setQueryData<NotificationPreferences>(
        ["notification-preferences"],
        (old) => ({ ...old!, ...newPrefs })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notification-preferences"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  return {
    preferences: data ?? {
      task_assigned: true,
      points_awarded: true,
      task_due_soon: true,
      member_joined: true,
    },
    isLoading,
    error,
    update,
    isUpdating,
  };
}
