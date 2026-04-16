import { useState, useEffect, useRef } from "react"
import { useNavigation } from "@react-navigation/native"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Animated, Dimensions,
  Alert, ActivityIndicator, ScrollView,
} from "react-native"
import { useAuth } from "../context/AuthContext"
import { register, login, parseJwt } from "../services/api"

const { width, height } = Dimensions.get("window")
const dots = [
  { top: 0.03, left: 0.10, delay: 0 },
  { top: 0.03, left: 0.80, delay: 500 },
  { top: 0.10, left: 0.45, delay: 300 },
  { top: 0.10, left: 0.88, delay: 800 },
  { top: 0.18, left: 0.05, delay: 600 },
  { top: 0.18, left: 0.70, delay: 400 },
  { top: 0.25, left: 0.30, delay: 1000 },
  { top: 0.25, left: 0.88, delay: 700 },
  { top: 0.33, left: 0.08, delay: 1200 },
  { top: 0.33, left: 0.75, delay: 900 },
  { top: 0.40, left: 0.50, delay: 500 },
  { top: 0.48, left: 0.05, delay: 300 },
  { top: 0.48, left: 0.88, delay: 1100 },
  { top: 0.55, left: 0.25, delay: 800 },
  { top: 0.55, left: 0.70, delay: 400 },
  { top: 0.63, left: 0.08, delay: 1300 },
  { top: 0.63, left: 0.82, delay: 600 },
  { top: 0.70, left: 0.40, delay: 200 },
  { top: 0.78, left: 0.12, delay: 900 },
  { top: 0.78, left: 0.75, delay: 1000 },
  { top: 0.90, left: 0.50, delay: 700 },
  { top: 0.85, left: 0.88, delay: 300 },
  { top: 0.92, left: 0.34, delay: 1100 },
  { top: 0.98, left: 0.60, delay: 500 },
  { top: 0.96, left: 0.88, delay: 200 },
  { top: 0.99, left: 0.05, delay: 600 },
  { top: 0.59, left: 0.95, delay: 600 },
  { top: 0.74, left: 0.02, delay: 600 },
]

function FloatingDot({ top, left, delay }: { top: number; left: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -14, duration: 2000, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={{
      position: "absolute",
      top: top * height,
      left: left * width,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#5b5b9e",
      opacity: 0.35,
      transform: [{ translateY: anim }],
    }} />
  )
}

export default function SignIn() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuth()
  const navigation = useNavigation<any>()

  function navigateAfterAuth(token: string) {
    const decoded = parseJwt(token)
    if (!decoded) return
    const hasClub = decoded.club_id && decoded.club_id !== "None"
    if (!hasClub) {
      navigation.replace("ClubSetup")
    } else if (decoded.role === "organiser") {
      navigation.replace("OrganizerDashboard")
    } else {
      navigation.replace("MemberDashboard")
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Email and password are required.")
      return
    }
    if (mode === "register" && !fullName.trim()) {
      Alert.alert("Error", "Full name is required.")
      return
    }
    setLoading(true)
    try {
      const res =
        mode === "register"
          ? await register(fullName.trim(), email.trim(), password)
          : await login(email.trim(), password)
      setToken(res.access_token)
      navigateAfterAuth(res.access_token)
    } catch (err: any) {
      Alert.alert("Error", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {dots.map((d, i) => (
        <FloatingDot key={i} top={d.top} left={d.left} delay={d.delay} />
      ))}

      <Text style={styles.logo}>Leadly</Text>

      <View style={styles.card}>
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {mode === "login" ? "Welcome back" : "Create an account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Sign in to your Leadly account"
            : "Enter your details to sign up"}
        </Text>

        {mode === "register" && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#aaa"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="email@domain.com"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueBtnText}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By clicking continue, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
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
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  roleBtnActive: {
    borderColor: "#5b5b9e",
    backgroundColor: "#eeeef8",
  },
  roleBtnText: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
  },
  roleBtnTextActive: {
    color: "#5b5b9e",
  },
  modeRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  modeBtnActive: {
    backgroundColor: "#5b5b9e",
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#aaa",
  },
  modeBtnTextActive: {
    color: "#fff",
  },
  continueBtn: {
    backgroundColor: "#5b5b9e",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  orText: {
    marginHorizontal: 10,
    color: "#aaa",
    fontSize: 13,
  },
  socialBtn: {
    backgroundColor: "#fdf6ec",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  terms: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  termsLink: {
    color: "#333",
    fontWeight: "600",
  },
})