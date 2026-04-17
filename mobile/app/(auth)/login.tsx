import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

const { width, height } = Dimensions.get("window");

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
];

function FloatingDot({ top, left, delay }: { top: number; left: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -14, duration: 2000, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: top * height,
        left: left * width,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#5b5b9e",
        opacity: 0.35,
        transform: [{ translateY: anim }],
      }}
    />
  );
}

type Mode = "login" | "register";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (mode === "register" && !fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ full_name: fullName.trim(), email, password });
      }
    } catch (e: any) {
      setError(e.message ?? `${mode === "login" ? "Login" : "Registration"} failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      {dots.map((d, i) => (
        <FloatingDot key={i} top={d.top} left={d.left} delay={d.delay} />
      ))}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>Leadly</Text>

          <View style={styles.card}>
            <Text style={styles.title}>
              {mode === "login" ? "Welcome back" : "Create an account"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "login"
                ? "Sign in to continue"
                : "Enter your details to sign up"}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Mode toggle */}
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, mode === "login" && styles.roleBtnActive]}
                onPress={() => { setMode("login"); setError(""); }}
              >
                <Text style={[styles.roleBtnText, mode === "login" && styles.roleBtnTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, mode === "register" && styles.roleBtnActive]}
                onPress={() => { setMode("register"); setError(""); }}
              >
                <Text style={[styles.roleBtnText, mode === "register" && styles.roleBtnTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "register" && (
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#aaa"
                value={fullName}
                onChangeText={setFullName}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="email@domain.com"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder={mode === "register" ? "Password (min 8 chars)" : "Password"}
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.continueBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>
                {loading ? "Please wait..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              <Text style={styles.switchBtnText}>
                {mode === "login" ? "Create a new account" : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By clicking continue, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f0efe6",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 52,
    fontWeight: "700",
    color: "#2d2d6b",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "InriaSerif_700Bold",
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
    fontFamily: "InstrumentSans_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "GentiumPlus_400Regular",
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
    fontFamily: "GentiumPlus_400Regular",
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
    fontFamily: "InstrumentSans_700Bold",
  },
  roleBtnTextActive: {
    color: "#5b5b9e",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    marginBottom: 14,
    fontFamily: "GentiumPlus_400Regular",
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
    fontFamily: "InstrumentSans_700Bold",
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
  switchBtn: {
    backgroundColor: "#fdf6ec",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  switchBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    fontFamily: "InstrumentSans_400Regular",
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
});