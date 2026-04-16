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
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Floating animated dots — matches frontend's SignIn design
interface DotConfig {
  size: number;
  color: string;
  left: number;
  top: number;
  delay: number;
}

const DOT_CONFIGS: DotConfig[] = [
  { size: 18, color: "#dcd7ca", left: 40, top: 60, delay: 0 },
  { size: 12, color: "#c5bfb0", left: 200, top: 100, delay: 400 },
  { size: 22, color: "#b6b09f", left: 120, top: 180, delay: 800 },
  { size: 10, color: "#e5e0d5", left: 300, top: 50, delay: 200 },
  { size: 16, color: "#d4cfc0", left: 60, top: 300, delay: 600 },
  { size: 14, color: "#c5bfb0", left: 260, top: 250, delay: 1000 },
  { size: 20, color: "#dcd7ca", left: 180, top: 400, delay: 300 },
  { size: 8, color: "#e5e0d5", left: 320, top: 350, delay: 700 },
  { size: 15, color: "#b6b09f", left: 30, top: 500, delay: 500 },
  { size: 11, color: "#d4cfc0", left: 280, top: 470, delay: 900 },
  { size: 18, color: "#c5bfb0", left: 150, top: 550, delay: 100 },
  { size: 13, color: "#dcd7ca", left: 90, top: 150, delay: 1100 },
  { size: 9, color: "#e5e0d5", left: 340, top: 180, delay: 350 },
  { size: 17, color: "#b6b09f", left: 220, top: 320, delay: 750 },
];

function FloatingDot({ config }: { config: DotConfig }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          delay: config.delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20 - Math.random() * 15],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: config.left % (SCREEN_WIDTH - 20),
        top: config.top % (SCREEN_HEIGHT - 20),
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        backgroundColor: config.color,
        transform: [{ translateY }],
        opacity,
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
    <View style={styles.root}>
      {/* Animated floating dots background */}
      {DOT_CONFIGS.map((config, i) => (
        <FloatingDot key={i} config={config} />
      ))}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Text style={styles.logo}>Leadly</Text>
          <Text style={styles.tagline}>
            {mode === "login"
              ? "Welcome back! Sign in to continue."
              : "Create your account to get started."}
          </Text>

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === "login" && styles.toggleActive]}
              onPress={() => { setMode("login"); setError(""); }}
            >
              <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === "register" && styles.toggleActive]}
              onPress={() => { setMode("register"); setError(""); }}
            >
              <Text style={[styles.toggleText, mode === "register" && styles.toggleTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

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
              placeholder="Email"
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
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f0efe6",
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontFamily: "InriaSerif_700Bold",
    color: "#2e2e6e",
    textAlign: "center",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "GentiumPlus_400Regular",
    color: "#888",
    textAlign: "center",
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#e5e0d5",
    borderRadius: 25,
    padding: 3,
    marginBottom: 24,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 22,
  },
  toggleActive: {
    backgroundColor: "#5b5b9e",
  },
  toggleText: {
    fontSize: 15,
    fontFamily: "InstrumentSans_700Bold",
    color: "#888",
  },
  toggleTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
    fontFamily: "GentiumPlus_400Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    color: "#111",
    backgroundColor: "#f0f0fa",
    fontFamily: "GentiumPlus_400Regular",
  },
  submitBtn: {
    backgroundColor: "#5b5b9e",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "InstrumentSans_700Bold",
  },
});