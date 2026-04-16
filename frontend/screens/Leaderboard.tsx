import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { getLeaderboard, LeaderboardEntry } from "../services/api"

const AVATARS = ["🐷","👾","🐮","🐱","🐨","🐶","🐭","🐻","🐼","🦊","🐰"]

const medalColors: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
}

export default function Leaderboard() {
  const navigation = useNavigation<any>()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then(data => setEntries(data.entries))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={{ fontSize: 22 }}>🐷</Text>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.medal}>🏅</Text>
          <Text style={styles.pageTitle}>Leader Board</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#5b5b9e" size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.card}>
            {entries.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text style={{ color: "#888" }}>No rankings yet. Complete tasks to earn points!</Text>
              </View>
            ) : entries.map((entry, i) => (
              <View key={entry.user_id} style={[styles.row, i < entries.length - 1 && styles.rowBorder]}>
                {/* Rank */}
                <View style={styles.rankCol}>
                  {entry.rank <= 3 ? (
                    <Text style={[styles.medalIcon, { color: medalColors[entry.rank] }]}>🏅</Text>
                  ) : (
                    <Text style={[styles.rankNum, entry.rank >= 7 && { color: "#ef4444" }]}>
                      {entry.rank}
                    </Text>
                  )}
                </View>

                {/* Avatar */}
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 22 }}>{AVATARS[i % AVATARS.length]}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{entry.full_name}</Text>
                  <Text style={styles.stats}>
                    {entry.tasks_completed} tasks completed · {entry.total_points} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MemberDashboard")}>
          <Ionicons name="home-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Leaderboard")}>
          <Ionicons name="trophy-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Activity")}>
          <Ionicons name="notifications-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Chat")}>
          <Ionicons name="mail-outline" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
    paddingHorizontal: 20,
    paddingTop: 12,
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
    marginBottom: 12,
  },
  titleRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  medal: {
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
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navItem: {
    alignItems: "center",
  },
})