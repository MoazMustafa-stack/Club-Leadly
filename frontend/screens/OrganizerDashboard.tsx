import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar, Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { getClubMe, getTasks, ClubMe, Task } from "../services/api"

export default function OrganizerDashboard() {
  const navigation = useNavigation<any>()
  const { decoded, logout } = useAuth()
  const [clubData, setClubData] = useState<ClubMe | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [club, taskList] = await Promise.all([getClubMe(), getTasks()])
      setClubData(club)
      setTasks(taskList)
    } catch (err: any) {
      Alert.alert("Error", err.message)
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const completedTasks = tasks.filter((t) => t.status === "completed")
  const memberCount = clubData?.total_members ?? 0
  const clubName = clubData?.club.name ?? "Your Club"
  const displayName = decoded?.email?.split("@")[0] ?? "Organiser"

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 22 }}>�</Text>
          </View>
          <Text style={styles.greeting}>Hello, {displayName}</Text>
          <TouchableOpacity onPress={() => { logout(); navigation.replace("SignIn") }}>
            <Ionicons name="log-out-outline" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {clubName !== "Your Club" && (
          <Text style={[styles.sectionTitle, { color: "#5b5b9e", marginBottom: 4 }]}>
            {clubName}
          </Text>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsCard}>
          {[
            { icon: "✈️", bg: "#91A88D", label: "Delegate Task", desc: "assign tasks to members", onPress: () => navigation.navigate("DelegateTask") },
            { icon: "📋", bg: "#5365a1", label: "View Tasks", desc: "see all club tasks", onPress: () => navigation.navigate("DelegateTask") },
            { icon: "🏆", bg: "#F8E97E", label: "Leaderboard", desc: "check member rankings", onPress: () => navigation.navigate("Leaderboard") },
            { icon: "📊", bg: "#E1706A", label: "Point History", desc: "award or deduct points", onPress: () => navigation.navigate("Activity") },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionRow, i < 3 && styles.actionBorder]} onPress={action.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Text style={{ fontSize: 16 }}>{action.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Active Tasks */}
          <View style={[styles.statCard, { borderColor: "#FFD99C", flex: 1.2 }]}>
            <Text style={styles.statLabel}>Active Tasks</Text>
            <Text style={styles.statBigNumber}>{pendingTasks.length}</Text>
            <View style={styles.progressBarRow}>
              <View style={[styles.progressFill, {
                flex: pendingTasks.length || 1,
                backgroundColor: pendingTasks.length > 0 ? "#ef4444" : "#d1d5db",
              }]} />
              <View style={[styles.progressFill, {
                flex: completedTasks.length || 1,
                backgroundColor: "#22c55e",
              }]} />
            </View>
            <View style={{ gap: 3, marginTop: 4 }}>
              <Text style={styles.legendItem}>
                <Text style={{ color: "#ef4444", fontSize: 16 }}>●</Text> {pendingTasks.length} pending
              </Text>
              <Text style={styles.legendItem}>
                <Text style={{ color: "#22c55e", fontSize: 16 }}>●</Text> {completedTasks.length} completed
              </Text>
            </View>
          </View>

          {/* Right column */}
          <View style={{ flex: 1, gap: 10 }}>
            <View style={[styles.statCard, { borderColor: "#a5b4fc" }]}>
              <Text style={styles.statLabel}>Join{"\n"}Code</Text>
              <Text style={[styles.statBigNumber, { fontSize: 20, color: "#1e1b4b" }]}>
                {clubData?.club.join_code ?? "—"}
              </Text>
            </View>
            <View style={[styles.statCard, { borderColor: "#374151", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
              <Text style={[styles.statLabel, { fontSize: 13 }]}>Total{"\n"}Members</Text>
              <Text style={[styles.statBigNumber, { fontSize: 30 }]}>{memberCount}</Text>
            </View>
          </View>
        </View>

        {/* Recent Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DelegateTask")}>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 6 }}>
          {pendingTasks.length === 0 ? (
            <View style={[styles.eventCard, { backgroundColor: "#f0f0f0", width: 200, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: "#888", fontSize: 13 }}>No pending tasks</Text>
            </View>
          ) : pendingTasks.slice(0, 5).map((task, i) => (
            <View key={task.id} style={[styles.eventCard, { backgroundColor: i % 2 === 0 ? "#dde3f5" : "#fef3c7" }]}>
              <Text style={{ color: "#ef4444", fontSize: 10, marginBottom: 6 }}>●</Text>
              <Text style={styles.eventTitle}>{task.title}</Text>
              <Text style={styles.eventTime}>
                {task.due_at ? `Due: ${new Date(task.due_at).toLocaleDateString()}` : "No due date"}
              </Text>
              <Text style={styles.eventAttending}>
                {task.assigned_to_name ?? "Unassigned"} · {task.point_value} pts
              </Text>
              <View style={styles.eventDivider} />
              <Text style={[styles.viewDetails, { color: task.status === "pending" ? "#ef4444" : "#22c55e" }]}>
                {task.status}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={22} color="#5b5b9e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Leaderboard")}>
          <Ionicons name="trophy-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("DelegateTask")}>
          <Ionicons name="add-circle-outline" size={22} color="#aaa" />
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  quickActionsCard: {
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#333",
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    backgroundColor: "#fff",
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  actionDesc: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
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
  bottomNav: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  flexDirection: "row",
  justifyContent: "space-around",
  paddingVertical: 12,
  paddingBottom: 50, // 👈 increase this
  borderTopWidth: 1,
  borderTopColor: "#eee",
},
  navItem: {
    alignItems: "center",
  },
})