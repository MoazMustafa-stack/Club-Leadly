import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../../lib/api";
import type { ClubDetailResponse, TaskResponse } from "../../lib/types";
import { useAuth, useIsOrganiser } from "../../hooks/useAuth";
import { useTasks } from "../../hooks/useTasks";
import { LoadingScreen, Badge } from "../../components/ui";

const EMOJI_AVATARS = ["🐷", "🐳", "👾", "🐮", "🐱", "🦊", "🐸", "🐵"];
const STAT_COLORS = ["#333", "#5b5b9e", "#2e2e6e", "#888"];

function getEmoji(index: number) {
  return EMOJI_AVATARS[index % EMOJI_AVATARS.length];
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const isOrganiser = useIsOrganiser();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ClubDetailResponse>({
    queryKey: ["club-detail"],
    queryFn: () => api<ClubDetailResponse>("/clubs/me"),
    staleTime: 30_000,
  });

  const { tasks } = useTasks();

  if (isLoading) return <LoadingScreen />;

  const club = data?.club;
  const members = data?.members ?? [];
  const totalMembers = data?.total_members ?? 0;
  const myPoints = members.find((m) => m.user_id === user?.sub)?.total_points ?? 0;
  const pendingTasks = (tasks ?? []).filter((t) => t.status === "pending");
  const completedTasks = (tasks ?? []).filter((t) => t.status === "completed");

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5b5b9e" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{isOrganiser ? "🐳" : "🐷"}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.email?.split("@")[0] ?? "there"}
            </Text>
            <Text style={styles.clubLabel}>{club?.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          hitSlop={12}
        >
          <Ionicons name="settings-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { borderColor: STAT_COLORS[0] }]}>
          <Text style={styles.statValue}>{myPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={[styles.statCard, { borderColor: STAT_COLORS[1] }]}>
          <Text style={styles.statValue}>{pendingTasks.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderColor: STAT_COLORS[2] }]}>
          <Text style={styles.statValue}>{completedTasks.length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { borderColor: STAT_COLORS[3] }]}>
          <Text style={styles.statValue}>{totalMembers}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
      </View>

      {/* Join code */}
      <View style={styles.joinCodeCard}>
        <Text style={styles.joinCodeLabel}>Club join code</Text>
        <Text style={styles.joinCode}>{club?.join_code}</Text>
      </View>

      {/* Recent tasks carousel */}
      {pendingTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={pendingTasks.slice(0, 6)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.carousel}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.taskCard,
                  { backgroundColor: index % 2 === 0 ? "#dde3f5" : "#fef3c7" },
                ]}
              >
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.taskPoints}>+{item.point_value} pts</Text>
                {item.assigned_to_name && (
                  <Text style={styles.taskAssignee} numberOfLines={1}>
                    → {item.assigned_to_name}
                  </Text>
                )}
              </View>
            )}
          />
        </>
      )}

      {/* Members section */}
      <Text style={styles.sectionTitle}>Members</Text>
      <View style={styles.membersCard}>
        {members.map((member, idx) => (
          <View key={member.user_id} style={styles.memberRow}>
            <View style={styles.memberAvatarCircle}>
              <Text style={styles.memberAvatarEmoji}>{getEmoji(idx)}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.full_name}</Text>
              <Text style={styles.memberMeta}>
                {member.role} · {member.total_points} pts
              </Text>
            </View>
          </View>
        ))}
        {members.length === 0 && (
          <Text style={styles.empty}>No members yet</Text>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 24 },
  greeting: {
    fontSize: 20,
    fontFamily: "InstrumentSans_700Bold",
    color: "#111",
  },
  clubLabel: {
    fontSize: 13,
    fontFamily: "GentiumPlus_400Regular",
    color: "#888",
  },
  statRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 7,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "InstrumentSans_700Bold",
    color: "#111",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "GentiumPlus_400Regular",
    color: "#888",
    marginTop: 2,
  },
  joinCodeCard: {
    marginHorizontal: 16,
    backgroundColor: "#dde3f5",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  joinCodeLabel: {
    fontSize: 14,
    fontFamily: "GentiumPlus_400Regular",
    color: "#555",
  },
  joinCode: {
    fontSize: 18,
    fontFamily: "InstrumentSans_700Bold",
    color: "#2e2e6e",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "InstrumentSans_700Bold",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  carousel: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskCard: {
    width: 160,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: "InstrumentSans_700Bold",
    color: "#111",
    marginBottom: 6,
  },
  taskPoints: {
    fontSize: 13,
    fontFamily: "GentiumPlus_400Regular",
    color: "#5b5b9e",
  },
  taskAssignee: {
    fontSize: 12,
    fontFamily: "GentiumPlus_400Regular",
    color: "#888",
    marginTop: 4,
  },
  membersCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  memberAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarEmoji: { fontSize: 18 },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: {
    fontSize: 15,
    fontFamily: "InstrumentSans_700Bold",
    color: "#111",
  },
  memberMeta: {
    fontSize: 12,
    fontFamily: "GentiumPlus_400Regular",
    color: "#888",
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    padding: 24,
    fontSize: 14,
    fontFamily: "GentiumPlus_400Regular",
  },
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
});