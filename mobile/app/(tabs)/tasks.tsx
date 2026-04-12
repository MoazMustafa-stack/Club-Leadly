import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "../../hooks/useTasks";
import { useCompleteTask } from "../../hooks/useCompleteTask";
import { useIsOrganiser } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { deleteTask } from "../../lib/api/tasks";
import { LoadingScreen } from "../../components/ui";
import TaskCard from "../../components/features/TaskCard";
import CreateTaskSheet from "../../components/features/CreateTaskSheet";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskResponse } from "../../lib/types";

type Filter = "all" | "pending" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

export default function TasksScreen() {
  const isOrganiser = useIsOrganiser();
  const { tasks, isLoading, refetch } = useTasks();
  const { mutate: markComplete, variables: completingId } = useCompleteTask();
  const queryClient = useQueryClient();
  const { showToast, ToastComponent } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const handleComplete = useCallback(
    (task: TaskResponse) => {
      markComplete(task.id, {
        onSuccess: () => showToast(`+${task.point_value} pts earned!`, "success"),
        onError: () => showToast("Failed to complete task", "error"),
      });
    },
    [markComplete, showToast]
  );

  const handleDelete = useCallback(
    (task: TaskResponse) => {
      Alert.alert("Delete task", `Delete "${task.title}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(task.id);
              queryClient.invalidateQueries({ queryKey: ["tasks"] });
              showToast("Task deleted", "success");
            } catch {
              showToast("Failed to delete task", "error");
            }
          },
        },
      ]);
    },
    [queryClient, showToast]
  );

  const renderItem = useCallback(
    ({ item }: { item: TaskResponse }) => (
      <TaskCard
        task={item}
        onComplete={
          item.status === "pending" ? () => handleComplete(item) : undefined
        }
        onDelete={isOrganiser ? () => handleDelete(item) : undefined}
        isCompleting={completingId === item.id}
      />
    ),
    [handleComplete, handleDelete, isOrganiser, completingId]
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isOrganiser ? "All tasks" : "My tasks"}
        </Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, filter === f.key && styles.pillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.pillText,
                filter === f.key && styles.pillTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={48}
              color="#D1D5DB"
            />
            <Text style={styles.emptyText}>No tasks yet</Text>
          </View>
        }
      />

      {/* FAB for organiser */}
      {isOrganiser && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create sheet */}
      <CreateTaskSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          showToast("Task created!", "success");
        }}
      />

      <ToastComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#111827" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  pillText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  pillTextActive: { color: "#FFFFFF" },
  list: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#9CA3AF", fontSize: 16, marginTop: 12 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
