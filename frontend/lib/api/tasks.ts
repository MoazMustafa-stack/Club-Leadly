import api from "../api";
import type { TaskResponse, CreateTaskRequest } from "../types";

export async function fetchTasks(): Promise<TaskResponse[]> {
  return api<TaskResponse[]>("/tasks");
}

export async function fetchTask(taskId: string): Promise<TaskResponse> {
  return api<TaskResponse>(`/tasks/${taskId}`);
}

export async function createTask(data: CreateTaskRequest): Promise<TaskResponse> {
  return api<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function completeTask(taskId: string): Promise<TaskResponse> {
  return api<TaskResponse>(`/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return api<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
