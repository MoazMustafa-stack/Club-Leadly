import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { getTasks, completeTask, Task } from "../services/api"
import { useAuth } from "../context/AuthContext"

export default function Activity() {
  const navigation = useNavigation<any>()
  const { decoded } = useAuth()
  const [tab, setTab] = useState<"Recent" | "Old">("Recent")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const myTasks = tasks.filter(t => t.assigned_to_user_id === decoded?.sub)
  const recentItems = myTasks.filter(t => t.status === "pending")
  const oldItems = myTasks.filter(t => t.status === "completed")
  const displayed = tab === "Recent" ? recentItems : oldItems

  async function handleAck(taskId: string) {
    try {
      await completeTask(taskId)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed" } : t))
    } catch {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <Text style={styles.pageTitle}>Activity</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === "Recent" && styles.tabActive]}
            onPress={() => setTab("Recent")}
          >
            <Text style={[styles.tabText, tab === "Recent" && styles.tabTextActive]}>
              Recent ({recentItems.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "Old" && styles.tabActive]}
            onPress={() => setTab("Old")}
          >
            <Text style={[styles.tabText, tab === "Old" && styles.tabTextActive]}>
              Completed ({oldItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity List */}
        {loading ? (
          <ActivityIndicator color="#5b5b9e" size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {displayed.length === 0 ? (
              <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
                {tab === "Recent" ? "No pending tasks — great job! 🎉" : "No completed tasks yet."}
              </Text>
            ) : displayed.map((task) => (
              <View key={task.id} style={styles.row}>
                <View style={[styles.dot, task.status === "completed" && { backgroundColor: "#22c55e" }]} />
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 24 }}>{task.status === "completed" ? "✅" : "📋"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      {task.title}{" "}
                      <Text style={styles.time}>
                        {task.due_at ? new Date(task.due_at).toLocaleDateString() : ""}
                      </Text>
                    </Text>
                    {task.status === "pending" && (
                      <TouchableOpacity style={styles.ackBtn} onPress={() => handleAck(task.id)}>
                        <Text style={styles.ackText}>complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.desc}>
                    {task.status === "completed"
                      ? `Done · ${task.point_value} pts earned`
                      : task.due_at
                        ? `Due: ${new Date(task.due_at).toLocaleDateString()} · ${task.point_value} pts`
                        : `${task.point_value} pts`}
                  </Text>
                  {task.description ? (
                    <View style={styles.quoteRow}>
                      <View style={styles.quoteLine} />
                      <Text style={styles.quoteText}>{task.description}</Text>
                    </View>
                  ) : null}
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
        <TouchableOpacity style={styles.navItem}>
          <View>
            <Ionicons name="notifications" size={22} color="#5b5b9e" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{recentItems.length}</Text>
            </View>
          </View>
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
    fontFamily: "InstrumentSans_400Regular",
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
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
})