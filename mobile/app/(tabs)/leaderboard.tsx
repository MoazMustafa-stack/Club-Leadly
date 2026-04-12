import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useAuth, useIsOrganiser } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { LoadingScreen, Avatar, Badge } from "../../components/ui";
import AwardPointsSheet from "../../components/features/AwardPointsSheet";
import { Button } from "../../components/ui";
import type { LeaderboardEntry } from "../../lib/types";

const MEDAL = ["🥇", "🥈", "🥉"] as const;

export default function LeaderboardScreen() {
  const { leaderboard, isLoading, refetch } = useLeaderboard();
  const { user } = useAuth();
  const isOrganiser = useIsOrganiser();
  const { showToast, ToastComponent } = useToast();

  const [awardTarget, setAwardTarget] = useState<{
    userId: string;
    fullName: string;
  } | null>(null);

  const renderTopThree = useCallback(
    (entry: LeaderboardEntry, idx: number) => {
      const isMe = entry.user_id === user?.sub;
      return (
        <View key={entry.user_id} style={[styles.podiumItem, isMe && styles.podiumHighlight]}>
          <Text style={styles.medal}>{MEDAL[idx]}</Text>
          <Avatar initials={entry.avatar_initials} colorSeed={entry.full_name} size="lg" />
          <Text style={styles.podiumName} numberOfLines={1}>
            {entry.full_name}
          </Text>
          <Text style={styles.podiumPts}>{entry.total_points} pts</Text>
          <Badge
            label={`${entry.tasks_completed} tasks`}
            variant="purple"
          />
        </View>
      );
    },
    [user?.sub]
  );

  const renderRow = useCallback(
    ({ item }: { item: LeaderboardEntry }) => {
      const isMe = item.user_id === user?.sub;
      return (
        <View style={[styles.row, isMe && styles.rowHighlight]}>
          <Text style={styles.rank}>#{item.rank}</Text>
          <Avatar initials={item.avatar_initials} colorSeed={item.full_name} size="sm" />
          <View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.full_name}
              {isMe ? " (You)" : ""}
            </Text>
            <Text style={styles.rowMeta}>
              {item.tasks_completed} tasks completed
            </Text>
          </View>
          <Text style={styles.rowPts}>{item.total_points}</Text>
          {isOrganiser && (
            <Button
              title="Award"
              variant="secondary"
              onPress={() =>
                setAwardTarget({
                  userId: item.user_id,
                  fullName: item.full_name,
                })
              }
              style={styles.awardBtn}
            />
          )}
        </View>
      );
    },
    [user?.sub, isOrganiser]
  );

  if (isLoading) return <LoadingScreen />;

  const entries = leaderboard?.entries ?? [];
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      <FlatList
        data={rest}
        keyExtractor={(item) => item.user_id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListHeaderComponent={
          topThree.length > 0 ? (
            <View style={styles.podiumRow}>
              {topThree.map((e, i) => renderTopThree(e, i))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          topThree.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No points earned yet</Text>
            </View>
          ) : null
        }
      />

      {/* Award points sheet */}
      <AwardPointsSheet
        visible={!!awardTarget}
        onClose={() => setAwardTarget(null)}
        member={awardTarget}
        onSuccess={() => {
          setAwardTarget(null);
          showToast("Points awarded!", "success");
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

  /* Podium */
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    marginBottom: 8,
  },
  podiumItem: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    width: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  podiumHighlight: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },
  medal: { fontSize: 24, marginBottom: 4 },
  podiumName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
    textAlign: "center",
  },
  podiumPts: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7C3AED",
    marginTop: 2,
  },

  /* Rows */
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowHighlight: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },
  rank: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    width: 32,
  },
  rowInfo: { flex: 1, marginLeft: 10 },
  rowName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  rowMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  rowPts: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7C3AED",
    marginRight: 8,
  },
  awardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  /* Empty */
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#9CA3AF", fontSize: 16, marginTop: 12 },
});
