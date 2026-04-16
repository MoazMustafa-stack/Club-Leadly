import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui";

export default function JoinClubScreen() {
  const { joinClub } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setError("");
    const trimmed = joinCode.trim();
    if (!trimmed) {
      setError("Please enter a join code");
      return;
    }
    setLoading(true);
    try {
      await joinClub({ join_code: trimmed });
    } catch (e: any) {
      setError(e.message ?? "Failed to join club");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Join a Club</Text>
        <Text style={styles.subtitle}>
          Enter the join code shared by your club organiser.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Join code"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />

        <Button title="Join club" onPress={handleJoin} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Want to create your own? </Text>
          <Link href="/(club)/create-club" style={styles.link}>
            Create club
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f0efe6" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "InstrumentSans_700Bold",
    color: "#2e2e6e",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    fontFamily: "GentiumPlus_400Regular",
    textAlign: "center",
    marginBottom: 32,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: "#111",
    backgroundColor: "#f0f0fa",
    letterSpacing: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: "#6B7280", fontSize: 14 },
  link: { color: "#5b5b9e", fontSize: 14, fontWeight: "600" },
});
