import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../../lib/api";
import type { ClubDetailResponse, TaskResponse } from "../../lib/types";
import { useAuth, useIsOrganiser } from "../../hooks/useAuth";
import { useTasks } from "../../hooks/useTasks";
import { LoadingScreen, Badge } from "../../components/ui";

const EMOJI_AVATARS = ["🐷", "🐳", "👾", "🐮", "🐱", "🦊", "🐸", "🐵"];

function getEmoji(index: number) {
  return EMOJI_AVATARS[index % EMOJI_AVATARS.length];
}

export default function DashboardScreen() {
  const { user, logout, leaveClub } = useAuth();
  const isOrganiser = useIsOrganiser();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

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
  const allTasks = tasks ?? [];

  // task breakdown for progress bar
  const criticalCount = pendingTasks.length;
  const doneCount = completedTasks.length;
  const totalCount = allTasks.length || 1;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5b5b9e" />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 22 }}>{isOrganiser ? "🐳" : "🐷"}</Text>
        </View>
        <Text style={styles.greeting}>
          Hello {user?.email?.split("@")[0] ?? "there"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          hitSlop={12}
          style={{ marginLeft: "auto" }}
        >
          <Ionicons name="settings-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Alert card for pending tasks */}
      {pendingTasks.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>⚠️ Pending Tasks</Text>
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: "700" }}>You have </Text>
              {pendingTasks.length} pending task{pendingTasks.length > 1 ? "s" : ""}.
              {pendingTasks[0] && (
                <>
                  {"\n"}
                  <Text style={{ fontWeight: "700" }}>Next: </Text>
                  {pendingTasks[0].title}
                </>
              )}
            </Text>
            <TouchableOpacity
              style={styles.acknowledgeBtn}
              onPress={() => router.push("/(tabs)/tasks")}
            >
              <Text style={styles.acknowledgeBtnText}>View Tasks</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Stats Row — partner's 2-column layout */}
      <View style={styles.statsRow}>
        {/* Left: Active Tasks card (tall) */}
        <View style={[styles.statCard, { borderColor: "#FFD99C", flex: 1.2 }]}>
          <Text style={styles.statLabel}>Active Tasks</Text>
          <Text style={styles.statBigNumber}>{allTasks.length}</Text>
          <View style={styles.progressBarRow}>
            <View style={[styles.progressFill, { flex: criticalCount || 1, backgroundColor: "#ef4444" }]} />
            <View style={[styles.progressFill, { flex: doneCount || 1, backgroundColor: "#22c55e" }]} />
          </View>
          <View style={{ gap: 3, marginTop: 4 }}>
            <Text style={styles.legendItem}>
              <Text style={{ color: "#CA2C2C", fontSize: 22 }}>●</Text> {pendingTasks.length} pending
            </Text>
            <Text style={styles.legendItem}>
              <Text style={{ color: "#449E65", fontSize: 22 }}>●</Text> {completedTasks.length} completed
            </Text>
          </View>
        </View>

        {/* Right column */}
        <View style={{ flex: 1, gap: 10 }}>
          {/* Points card */}
          <View style={[styles.statCard, { borderColor: "#a5b4fc" }]}>
            <Text style={styles.statLabel}>My{"\n"}Points</Text>
            <Text style={[styles.statBigNumber, { fontSize: 22, color: "#1e1b4b" }]}>{myPoints}</Text>
          </View>
          {/* Total Members card */}
          <View style={[styles.statCard, { borderColor: "#374151", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <Text style={[styles.statLabel, { fontSize: 13 }]}>Total{"\n"}Members</Text>
            <Text style={[styles.statBigNumber, { fontSize: 30 }]}>{totalMembers}</Text>
          </View>
        </View>
      </View>

      {/* Join code */}
      <View style={styles.joinCodeCard}>
        <Text style={styles.joinCodeLabel}>Club join code</Text>
        <Text style={styles.joinCode}>{club?.join_code}</Text>
      </View>

      {/* Upcoming Tasks carousel */}
      {pendingTasks.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 6 }}
          >
            {pendingTasks.slice(0, 6).map((item, index) => {
              const dot = index % 3 === 0 ? "#ef4444" : index % 3 === 1 ? "#22c55e" : "#eab308";
              const bg = index % 2 === 0 ? "#dde3f5" : "#fef3c7";
              return (
                <View key={item.id} style={[styles.eventCard, { backgroundColor: bg }]}>
                  <Text style={{ color: dot, fontSize: 10, marginBottom: 6 }}>●</Text>
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.eventTime}>+{item.point_value} pts</Text>
                  {item.assigned_to_name && (
                    <Text style={styles.eventAttending}>→ {item.assigned_to_name}</Text>
                  )}
                  <View style={styles.eventDivider} />
                  <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
                    <Text style={styles.viewDetails}>view details</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Member Ranking */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Members</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")}>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
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

      {/* Ranking info card */}
      <View style={styles.rankingCard}>
        <Text style={styles.rankingText}>
          Member ranking is based on task completion, consistency, and quality.
          The higher your score, the higher your rank in the club.
        </Text>
      </View>

      {/* Leave Club */}
      <TouchableOpacity
        style={styles.leaveBtn}
        onPress={() => {
          const doLeave = async () => {
            try {
              await leaveClub();
            } catch (e: any) {
              const msg = e?.message || "Failed to leave club";
              if (Platform.OS === "web") {
                window.alert(msg);
              } else {
                Alert.alert("Error", msg);
              }
            }
          };
          if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to leave this club? Your points and task history will be lost.")) {
              doLeave();
            }
          } else {
            Alert.alert(
              "Leave Club",
              "Are you sure you want to leave this club? Your points and task history will be lost.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Leave", style: "destructive", onPress: doLeave },
              ]
            );
          }
        }}
      >
        <Text style={styles.leaveText}>Leave Club</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    flex: 1,
    fontFamily: "InstrumentSans_700Bold",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  alertCard: {
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: "#DB3636",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  alertText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: "GentiumPlus_400Regular",
  },
  acknowledgeBtn: {
    backgroundColor: "#E37F77",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  acknowledgeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 7,
    padding: 14,
    backgroundColor: "#fff",
  },
  statLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    fontFamily: "InstrumentSans_700Bold",
  },
  statBigNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  progressBarRow: {
    flexDirection: "row",
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressFill: {
    height: "100%",
  },
  legendItem: {
    fontSize: 11,
    color: "#555",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  chevron: {
    fontSize: 24,
    color: "#555",
  },
  eventCard: {
    width: 185,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
    fontFamily: "InstrumentSans_700Bold",
  },
  eventTime: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  eventAttending: {
    fontSize: 12,
    color: "#555",
  },
  eventDivider: {
    height: 1,
    backgroundColor: "#00000015",
    marginVertical: 10,
  },
  viewDetails: {
    fontSize: 13,
    color: "#5b5b9e",
    fontWeight: "500",
    textAlign: "center",
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
    fontSize: 13,
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
  rankingCard: {
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#aaa",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  rankingText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    fontFamily: "GentiumPlus_400Regular",
  },
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
  leaveBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#DC2626",
    borderRadius: 12,
  },
  leaveText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
});