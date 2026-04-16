import api from "../api";
import type { NotificationPreferences } from "../types";

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return api<NotificationPreferences>("/notifications/preferences");
}

export async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return api<NotificationPreferences>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
