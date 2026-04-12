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

export default function CreateClubScreen() {
  const { createClub } = useAuth();
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError("");
    const trimmed = clubName.trim();
    if (!trimmed) {
      setError("Please enter a club name");
      return;
    }
    setLoading(true);
    try {
      await createClub({ name: trimmed });
    } catch (e: any) {
      setError(e.message ?? "Failed to create club");
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
        <Text style={styles.title}>Create a Club</Text>
        <Text style={styles.subtitle}>
          Start your club and invite members with the join code.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Club name"
          placeholderTextColor="#9CA3AF"
          value={clubName}
          onChangeText={setClubName}
        />

        <Button title="Create club" onPress={handleCreate} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Have a join code? </Text>
          <Link href="/(club)/join-club" style={styles.link}>
            Join instead
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#7C3AED",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
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
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: "#111827",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: "#6B7280", fontSize: 14 },
  link: { color: "#7C3AED", fontSize: 14, fontWeight: "600" },
});
