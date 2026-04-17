import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useIsOrganiser } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { LoadingScreen } from "../../components/ui";
import AwardPointsSheet from "../../components/features/AwardPointsSheet";
import { Button } from "../../components/ui";
import type { LeaderboardEntry } from "../../lib/types";

const EMOJI_AVATARS = ["🐷", "👾", "🐮", "🐱", "🐨", "🐶", "🐭", "🐱", "🐨", "🐮", "👾"];
const MEDAL_COLORS: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

export default function LeaderboardScreen() {
  const { leaderboard, isLoading, refetch } = useLeaderboard();
  const { user } = useAuth();
  const isOrganiser = useIsOrganiser();
  const { showToast, ToastComponent } = useToast();
  const insets = useSafeAreaInsets();

  const [awardTarget, setAwardTarget] = useState<{
    userId: string;
    fullName: string;
  } | null>(null);

  if (isLoading) return <LoadingScreen />;

  const entries = leaderboard?.entries ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#5b5b9e" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
          <View style={styles.avatarBubble}>
            <Text style={{ fontSize: 22 }}>🐷</Text>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.medalBig}>🏅</Text>
            <Text style={styles.pageTitle}>Leader Board</Text>
          </View>
        </View>

        {/* List card */}
        {entries.length > 0 ? (
          <View style={styles.card}>
            {entries.map((entry, i) => {
              const isMe = entry.user_id === user?.sub;
              const rank = entry.rank;
              return (
                <View
                  key={entry.user_id}
                  style={[
                    styles.row,
                    i < entries.length - 1 && styles.rowBorder,
                    isMe && styles.rowHighlight,
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankCol}>
                    {rank <= 3 ? (
                      <Text style={[styles.medalIcon, { color: MEDAL_COLORS[rank] }]}>🏅</Text>
                    ) : (
                      <Text style={[styles.rankNum, rank >= 7 && { color: "#ef4444" }]}>
                        {rank}
                      </Text>
                    )}
                  </View>

                  {/* Avatar */}
                  <View style={styles.avatarCircle}>
                    <Text style={{ fontSize: 22 }}>
                      {EMOJI_AVATARS[(i) % EMOJI_AVATARS.length]}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {entry.full_name}{isMe ? " (You)" : ""}
                    </Text>
                    <Text style={styles.stats}>
                      {entry.tasks_completed} tasks · {entry.total_points} pts
                    </Text>
                  </View>

                  {/* Award button for organiser */}
                  {isOrganiser && (
                    <Button
                      title="Award"
                      variant="secondary"
                      onPress={() =>
                        setAwardTarget({
                          userId: entry.user_id,
                          fullName: entry.full_name,
                        })
                      }
                      style={styles.awardBtn}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No points earned yet</Text>
          </View>
        )}
      </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
  },
  headerArea: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  avatarBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },
  titleRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  medalBig: {
    fontSize: 36,
    textAlign: "center",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
    textAlign: "center",
  },
  card: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowHighlight: {
    backgroundColor: "#f5f4ff",
  },
  rankCol: {
    width: 32,
    alignItems: "center",
  },
  medalIcon: {
    fontSize: 22,
  },
  rankNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  stats: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontFamily: "GentiumPlus_400Regular",
  },
  awardBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
