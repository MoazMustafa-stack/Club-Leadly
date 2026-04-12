import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { TaskResponse } from "../../lib/types";
import { Badge } from "../ui";

interface TaskCardProps {
  task: TaskResponse;
  onComplete?: () => void;
  onDelete?: () => void;
  isCompleting?: boolean;
}

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskCard({ task, onComplete, onDelete, isCompleting }: TaskCardProps) {
  const scale = useSharedValue(1);
  const isCompleted = task.status === "completed";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleComplete = useCallback(() => {
    if (!onComplete) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );
    onComplete();
  }, [onComplete, scale]);

  return (
    <Animated.View
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        animatedStyle,
      ]}
    >
      {/* Top row: title + status */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          {isCompleted && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#059669"
              style={styles.checkIcon}
            />
          )}
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
        </View>
        <Badge
          label={task.status}
          variant={isCompleted ? "success" : "warning"}
        />
      </View>

      {/* Second row: points + due date */}
      <View style={styles.metaRow}>
        <Text style={styles.points}>+{task.point_value} pts</Text>
        {task.due_at && (
          <Text style={styles.dueDate}>Due {formatDueDate(task.due_at)}</Text>
        )}
      </View>

      {/* Description */}
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Assigned to (organiser view) */}
      {task.assigned_to_name ? (
        <Text style={styles.assignee}>
          Assigned to {task.assigned_to_name}
        </Text>
      ) : null}

      {/* Complete button */}
      {!isCompleted && onComplete && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={handleComplete}
          disabled={isCompleting}
          activeOpacity={0.8}
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={styles.completeBtnText}>Mark complete</Text>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default memo(TaskCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardCompleted: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  dueDate: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  assignee: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    fontStyle: "italic",
  },
  completeBtn: {
    marginTop: 12,
    backgroundColor: "#EDE9FE",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  completeBtnText: {
    color: "#7C3AED",
    fontWeight: "600",
    fontSize: 14,
  },
});
