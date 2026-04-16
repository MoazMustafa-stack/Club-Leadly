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
import { getClubMe, getTasks, completeTask, ClubMe, Task } from "../services/api"

export default function MemberDashboard() {
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

  async function handleComplete(taskId: string) {
    try {
      await completeTask(taskId)
      loadData()
    } catch (err: any) {
      Alert.alert("Error", err.message)
    }
  }

  const myPendingTasks = tasks.filter(
    (t) => t.status === "pending" && t.assigned_to_user_id === decoded?.sub
  )
  const newTask = myPendingTasks[0] ?? null
  const memberCount = clubData?.total_members ?? 0
  const displayName = decoded?.email?.split("@")[0] ?? "Member"

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 22 }}>🐷</Text>
          </View>
          <Text style={styles.greeting}>Hello, {displayName}</Text>
          <TouchableOpacity onPress={() => { logout(); navigation.replace("SignIn") }}>
            <Ionicons name="log-out-outline" size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {clubData && (
          <Text style={[styles.sectionLabel, { color: "#5b5b9e", marginBottom: 4 }]}>
            {clubData.club.name}  ·  Code: {clubData.club.join_code}
          </Text>
        )}

        {/* New Task Alert */}
        {newTask && (
          <>
            <Text style={styles.sectionLabel}>⚠️ New Task</Text>
            <View style={styles.alertCard}>
              <Text style={styles.alertText}>
                <Text style={{ fontWeight: "700" }}>You're assigned to: </Text>
                {newTask.title}{"\n"}
                {newTask.due_at ? (
                  <>
                    <Text style={{ fontWeight: "700" }}>Deadline: </Text>
                    {new Date(newTask.due_at).toLocaleDateString()}
                  </>
                ) : "No deadline set"}
              </Text>
              <TouchableOpacity
                style={styles.acknowledgeBtn}
                onPress={() => handleComplete(newTask.id)}
              >
                <Text style={styles.acknowledgeBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: "#FFD99C", flex: 1.2 }]}>
            <Text style={styles.statLabel}>My Tasks</Text>
            <Text style={styles.statBigNumber}>{myPendingTasks.length}</Text>
            <View style={styles.progressBarRow}>
              <View style={[styles.progressFill, {
                flex: myPendingTasks.length || 1,
                backgroundColor: myPendingTasks.length > 0 ? "#ef4444" : "#d1d5db",
              }]} />
              <View style={[styles.progressFill, {
                flex: tasks.filter(t => t.status === "completed" && t.assigned_to_user_id === decoded?.sub).length || 1,
                backgroundColor: "#22c55e",
              }]} />
            </View>
            <View style={{ gap: 3, marginTop: 4 }}>
              <Text style={styles.legendItem}>
                <Text style={{ color: "#ef4444", fontSize: 22 }}>●</Text> {myPendingTasks.length} pending
              </Text>
              <Text style={styles.legendItem}>
                <Text style={{ color: "#22c55e", fontSize: 22 }}>●</Text>{" "}
                {tasks.filter(t => t.status === "completed" && t.assigned_to_user_id === decoded?.sub).length} done
              </Text>
            </View>
          </View>

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

        {/* All My Pending Tasks */}
        <View style={[styles.sectionHeader, { marginTop: 4 }]}>
          <Text style={styles.sectionTitle}>My Pending Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Activity")}>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 6 }}>
          {myPendingTasks.length === 0 ? (
            <View style={[styles.eventCard, { backgroundColor: "#f0f0f0", width: 200, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: "#22c55e", fontSize: 13 }}>All caught up! 🎉</Text>
            </View>
          ) : myPendingTasks.slice(0, 5).map((task, i) => (
            <View key={task.id} style={[styles.eventCard, { backgroundColor: i % 2 === 0 ? "#dde3f5" : "#fef3c7" }]}>
              <Text style={{ color: "#ef4444", fontSize: 10, marginBottom: 6 }}>●</Text>
              <Text style={styles.eventTitle}>{task.title}</Text>
              <Text style={styles.eventTime}>
                {task.due_at ? `Due: ${new Date(task.due_at).toLocaleDateString()}` : "No due date"}
              </Text>
              <Text style={styles.eventAttending}>{task.point_value} pts</Text>
              <View style={styles.eventDivider} />
              <TouchableOpacity onPress={() => handleComplete(task.id)}>
                <Text style={styles.viewDetails}>Mark Complete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Member Ranking */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Member Ranking</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Leaderboard")}>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rankingCard}>
          <Text style={styles.rankingText}>
            Member ranking is calculated based on points earned from completed tasks. The more tasks you complete, the higher your rank within the club. Tap "›" to view the full leaderboard.
          </Text>
        </View>

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
    marginBottom: 10,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
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
    color: "#666",
    lineHeight: 20,
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