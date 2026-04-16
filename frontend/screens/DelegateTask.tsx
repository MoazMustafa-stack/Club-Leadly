import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import { getMembers, createTask, ClubMember } from "../services/api"

export default function DelegateTask() {
  const navigation = useNavigation<any>()
  const [taskTitle, setTaskTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [members, setMembers] = useState<ClubMember[]>([])
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMembers()
      .then(setMembers)
      .catch(() => Alert.alert("Error", "Could not load members"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    if (!taskTitle.trim()) return Alert.alert("Validation", "Task title is required")
    if (!selectedMember) return Alert.alert("Validation", "Please select a member")
    setSubmitting(true)
    try {
      const due_at = deadline.trim()
        ? (() => {
            const parts = deadline.trim().split("-")
            if (parts.length === 3) {
              const [dd, mm, yy] = parts
              return new Date(`20${yy}-${mm}-${dd}T23:59:00`).toISOString()
            }
            return undefined
          })()
        : undefined
      await createTask({
        title: taskTitle.trim(),
        description: description.trim() || undefined,
        assigned_to_user_id: selectedMember.user_id,
        due_at,
        point_value: 10,
      })
      Alert.alert("Success", `Task assigned to ${selectedMember.full_name}!`, [
        { text: "OK", onPress: () => navigation.navigate("OrganizerDashboard") },
      ])
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.avatar}>
          <Text style={{ fontSize: 22 }}>🐷</Text>
        </View>

        <Text style={styles.pageTitle}>Delegate Task</Text>

        <View style={styles.card}>

          <Text style={styles.cardTitle}>Task Details</Text>
          <Text style={styles.cardSubtitle}>assign a task to a club member</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: write event report"
            placeholderTextColor="#aaa"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 10 }]}
            placeholder="Tell the member what needs to be done"
            placeholderTextColor="#aaa"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Assign To</Text>
          {loading ? (
            <ActivityIndicator color="#5b5b9e" style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.memberList}>
              {members.filter(m => m.role === "member").map(m => (
                <TouchableOpacity
                  key={m.user_id}
                  style={[styles.memberItem, selectedMember?.user_id === m.user_id && styles.memberItemSelected]}
                  onPress={() => setSelectedMember(m)}
                >
                  <Text style={[styles.memberItemText, selectedMember?.user_id === m.user_id && { color: "#fff" }]}>
                    {m.full_name}  ·  {m.total_points} pts
                  </Text>
                  {selectedMember?.user_id === m.user_id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
              {members.filter(m => m.role === "member").length === 0 && (
                <Text style={{ color: "#888", fontSize: 13 }}>No members found. Share your join code!</Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Deadline (dd-mm-yy)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 25-12-25"
            placeholderTextColor="#aaa"
            value={deadline}
            onChangeText={setDeadline}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
              <Text style={styles.btnText}>{"< back"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{"assign >"}</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("OrganizerDashboard")}>
          <Ionicons name="home-outline" size={22} color="#5b5b9e" />
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
    paddingHorizontal: 24,
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
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#dde3f5",
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
    fontFamily: "InstrumentSans_700Bold",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#00000015",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
    marginTop: 10,
    fontFamily: "InstrumentSans_700Bold",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#aaa",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#111",
    backgroundColor: "#f0f0fa",
  },
  memberList: {
    gap: 8,
    marginBottom: 4,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#aaa",
    backgroundColor: "#f0f0fa",
  },
  memberItemSelected: {
    backgroundColor: "#2e2e6e",
    borderColor: "#2e2e6e",
  },
  memberItemText: {
    fontSize: 13,
    color: "#111",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    backgroundColor: "#2e2e6e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "InstrumentSans_700Bold",
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