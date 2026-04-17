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

const EMOJI_AVATARS = ["🐶", "🐱", "🐨", "🐱", "🐷", "👾", "🐮", "🐭"];

interface PointLog {
  id: string;
  user_id: string;
  full_name: string;
  points: number;
  reason: string;
  awarded_by_name?: string;
  created_at: string;
}

type Tab = "Recent" | "Old";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("Recent");
  const { tasks } = useTasks();

  const { data: pointLogs, isLoading, refetch, isRefetching } = useQuery<PointLog[]>({
    queryKey: ["point-logs"],
    queryFn: () => api<PointLog[]>("/clubs/me/point-logs"),
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingScreen />;

  // Build activity feed from point logs and pending tasks
  const activities: {
    id: string;
    avatar: string;
    name: string;
    time: string;
    desc: string;
    acknowledge: boolean;
    quote: string | null;
  }[] = [];

  // Add pending tasks as activity items
  const pendingTasks = (tasks ?? []).filter((t) => t.status === "pending");
  pendingTasks.forEach((t, i) => {
    activities.push({
      id: `task-${t.id}`,
      avatar: EMOJI_AVATARS[i % EMOJI_AVATARS.length],
      name: `Task assigned: ${t.title}`,
      time: timeAgo(t.created_at),
      desc: `+${t.point_value} pts on completion`,
      acknowledge: true,
      quote: null,
    });
  });

  // Add point logs
  (pointLogs ?? []).forEach((log, i) => {
    activities.push({
      id: log.id,
      avatar: EMOJI_AVATARS[(i + 3) % EMOJI_AVATARS.length],
      name: log.full_name,
      time: timeAgo(log.created_at),
      desc: log.reason || `+${log.points} pts`,
      acknowledge: false,
      quote: log.points > 0 ? "Congratulations!!" : null,
    });
  });

  // Sort by recency placeholder — "Recent" shows all, "Old" shows >7d items
  const filtered = tab === "Recent"
    ? activities
    : activities.filter((a) => !["today", "1d", "2d", "3d"].includes(a.time));

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
                <Text style={styles.emptyText}>No activity yet</Text>
              </View>
            )}
            {filtered.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.dot} />
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 24 }}>{item.avatar}</Text>
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
                  {item.quote && (
                    <View style={styles.quoteRow}>
                      <View style={styles.quoteLine} />
                      <Text style={styles.quoteText}>{item.quote}</Text>
                    </View>
                  )}
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
  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  quoteLine: {
    width: 3,
    height: 16,
    backgroundColor: "#ccc",
    borderRadius: 2,
  },
  quoteText: {
    fontSize: 13,
    color: "#888",
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
