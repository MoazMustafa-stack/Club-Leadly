import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "../../lib/api";
import { useTasks } from "../../hooks/useTasks";
import { LoadingScreen } from "../../components/ui";

interface PointLog {
  id: string;
  user_id: string;
  full_name: string;
  points: number;
  reason: string;
  awarded_by_name?: string;
  created_at: string;
}

interface ActivityLogItem {
  id: string;
  user_name: string;
  activity_type: string;
  description: string;
  target_user_name?: string | null;
  created_at: string;
}

type Tab = "Recent" | "Old";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const ACTIVITY_CONFIG: Record<string, { emoji: string; color: string }> = {
  member_joined:   { emoji: "👋", color: "#22c55e" },
  member_left:     { emoji: "🚪", color: "#ef4444" },
  member_promoted: { emoji: "⬆️", color: "#8b5cf6" },
  points_awarded:  { emoji: "🏆", color: "#f59e0b" },
  task_completed:  { emoji: "✅", color: "#10b981" },
  task_assigned:   { emoji: "📋", color: "#3b82f6" },
  point_log:       { emoji: "⭐", color: "#f59e0b" },
};

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("Recent");
  const { tasks } = useTasks();

  const { data: pointLogs, isLoading: loadingPoints, refetch: refetchPoints, isRefetching: refetchingPoints } = useQuery<PointLog[]>({
    queryKey: ["point-logs"],
    queryFn: () => api<PointLog[]>("/clubs/me/point-logs"),
    staleTime: 30_000,
  });

  const { data: activityLogs, isLoading: loadingActivity, refetch: refetchActivity, isRefetching: refetchingActivity } = useQuery<ActivityLogItem[]>({
    queryKey: ["activity-logs"],
    queryFn: () => api<ActivityLogItem[]>("/clubs/me/activity"),
    staleTime: 30_000,
  });

  const isLoading = loadingPoints || loadingActivity;
  const isRefetching = refetchingPoints || refetchingActivity;
  const refetch = () => { refetchPoints(); refetchActivity(); };

  if (isLoading) return <LoadingScreen />;

  // Build unified activity feed
  const activities: {
    id: string;
    emoji: string;
    dotColor: string;
    type: string;
    name: string;
    time: string;
    timestamp: number;
    desc: string;
    acknowledge: boolean;
  }[] = [];

  // Add activity log items (join, leave, promote)
  (activityLogs ?? []).forEach((log) => {
    const config = ACTIVITY_CONFIG[log.activity_type] ?? { emoji: "📌", color: "#888" };
    activities.push({
      id: `activity-${log.id}`,
      emoji: config.emoji,
      dotColor: config.color,
      type: log.activity_type,
      name: log.user_name,
      time: timeAgo(log.created_at),
      timestamp: new Date(log.created_at).getTime(),
      desc: log.description,
      acknowledge: false,
    });
  });

  // Add pending tasks as activity items
  const pendingTasks = (tasks ?? []).filter((t) => t.status === "pending");
  pendingTasks.forEach((t) => {
    const config = ACTIVITY_CONFIG.task_assigned;
    activities.push({
      id: `task-${t.id}`,
      emoji: config.emoji,
      dotColor: config.color,
      type: "task_assigned",
      name: `Task: ${t.title}`,
      time: timeAgo(t.created_at),
      timestamp: new Date(t.created_at).getTime(),
      desc: `+${t.point_value} pts on completion`,
      acknowledge: true,
    });
  });

  // Add point logs
  (pointLogs ?? []).forEach((log) => {
    const config = ACTIVITY_CONFIG.point_log;
    activities.push({
      id: `points-${log.id}`,
      emoji: config.emoji,
      dotColor: config.color,
      type: "point_log",
      name: log.full_name,
      time: timeAgo(log.created_at),
      timestamp: new Date(log.created_at).getTime(),
      desc: log.reason || `+${log.points} pts`,
      acknowledge: false,
    });
  });

  // Sort all by timestamp descending (most recent first)
  activities.sort((a, b) => b.timestamp - a.timestamp);

  // Filter: "Recent" = last 7 days, "Old" = older than 7 days
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const filtered = tab === "Recent"
    ? activities.filter((a) => a.timestamp >= sevenDaysAgo)
    : activities.filter((a) => a.timestamp < sevenDaysAgo);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5b5b9e" />
        }
      >
        <View style={{ paddingTop: insets.top + 12 }}>
          <Text style={styles.pageTitle}>Activity</Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === "Recent" && styles.tabActive]}
              onPress={() => setTab("Recent")}
            >
              <Text style={[styles.tabText, tab === "Recent" && styles.tabTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "Old" && styles.tabActive]}
              onPress={() => setTab("Old")}
            >
              <Text style={[styles.tabText, tab === "Old" && styles.tabTextActive]}>
                Old
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          <View style={styles.list}>
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {tab === "Recent" ? "No recent activity" : "No older activity"}
                </Text>
              </View>
            )}
            {filtered.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      {item.name}{" "}
                      <Text style={styles.time}>{item.time}</Text>
                    </Text>
                    {item.acknowledge && (
                      <TouchableOpacity style={styles.ackBtn}>
                        <Text style={styles.ackText}>acknowledge</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.desc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  tabActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  tabText: {
    fontSize: 14,
    color: "#555",
    fontFamily: "InstrumentSans_700Bold",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  list: {
    gap: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginTop: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
    flex: 1,
    flexWrap: "wrap",
  },
  time: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "400",
  },
  desc: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    fontFamily: "GentiumPlus_400Regular",
  },
  ackBtn: {
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ackText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 12,
    fontFamily: "GentiumPlus_400Regular",
  },
});
