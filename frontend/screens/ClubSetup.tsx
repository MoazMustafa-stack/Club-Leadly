import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"
import { createClub, joinClub } from "../services/api"

export default function ClubSetup() {
  const { setToken, decoded } = useAuth()
  const navigation = useNavigation<any>()
  const [mode, setMode] = useState<"create" | "join">("create")
  const [clubName, setClubName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (clubName.trim().length < 2) {
      Alert.alert("Error", "Club name must be at least 2 characters.")
      return
    }
    setLoading(true)
    try {
      const res = await createClub(clubName.trim())
      setToken(res.access_token)
      // navigate based on role — new token has club_id now
      navigation.replace(decoded?.role === "organiser" ? "OrganizerDashboard" : "MemberDashboard")
    } catch (err: any) {
      Alert.alert("Error", err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (joinCode.trim().length !== 6) {
      Alert.alert("Error", "Join code must be exactly 6 characters.")
      return
    }
    setLoading(true)
    try {
      const res = await joinClub(joinCode.trim().toUpperCase())
      setToken(res.access_token)
      navigation.replace("MemberDashboard")
    } catch (err: any) {
      Alert.alert("Error", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Leadly</Text>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "create" && styles.toggleActive]}
          onPress={() => setMode("create")}
        >
          <Text style={[styles.toggleText, mode === "create" && styles.toggleTextActive]}>
            Create Club
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === "join" && styles.toggleActive]}
          onPress={() => setMode("join")}
        >
          <Text style={[styles.toggleText, mode === "join" && styles.toggleTextActive]}>
            Join Club
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {mode === "create" ? (
          <>
            <Text style={styles.title}>Create a Club</Text>
            <Text style={styles.subtitle}>You'll become the organiser</Text>
            <TextInput
              style={styles.input}
              placeholder="Club name (min 2 chars)"
              placeholderTextColor="#aaa"
              value={clubName}
              onChangeText={setClubName}
            />
            <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Club</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Join a Club</Text>
            <Text style={styles.subtitle}>Enter the 6-character join code</Text>
            <TextInput
              style={styles.input}
              placeholder="Join code (e.g. ABC123)"
              placeholderTextColor="#aaa"
              value={joinCode}
              onChangeText={setJoinCode}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.btn} onPress={handleJoin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Join Club</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0efe6",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 52,
    fontWeight: "700",
    color: "#2d2d6b",
    textAlign: "center",
    marginBottom: 32,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#2d2d6b",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  toggleTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
  },
  btn: {
    backgroundColor: "#2d2d6b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
})
