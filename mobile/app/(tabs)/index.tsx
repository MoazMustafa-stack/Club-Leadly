import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { ClubDetailResponse } from "../../lib/types";
import { useAuth } from "../../hooks/useAuth";
import { Avatar, LoadingScreen, MemberRow, Badge } from "../../components/ui";

export default function DashboardScreen() {
  const { user, logout } = useAuth();

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

  if (isLoading) return <LoadingScreen />;

  const club = data?.club;
  const members = data?.members ?? [];

  return (
    <View style={styles.container}>
      {/* Club header card */}
      <View style={styles.card}>
        <Text style={styles.clubName}>{club?.name}</Text>
        <View style={styles.row}>
          <Badge label={`${data?.total_members ?? 0} members`} />
          <Badge label={`Code: ${club?.join_code}`} variant="purple" />
        </View>
      </View>

      {/* Members Section */}
      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <MemberRow
            fullName={item.full_name}
            avatarInitials={item.avatar_initials}
            role={item.role}
            totalPoints={item.total_points}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No members yet</Text>
        }
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  clubName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16 },
  empty: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 24,
    fontSize: 14,
  },
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  logoutText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
});
