import React from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { LoadingScreen } from "../components/ui";

const PREF_ITEMS: {
  key: keyof typeof LABELS;
  label: string;
  description: string;
}[] = [
  {
    key: "task_assigned",
    label: "Task assigned",
    description: "When a task is assigned to you",
  },
  {
    key: "points_awarded",
    label: "Points awarded",
    description: "When you receive points",
  },
  {
    key: "task_due_soon",
    label: "Task due soon",
    description: "Reminders for upcoming deadlines",
  },
  {
    key: "member_joined",
    label: "Member joined",
    description: "When someone joins your club",
  },
];

const LABELS = {
  task_assigned: true,
  points_awarded: true,
  task_due_soon: true,
  member_joined: true,
};

export default function SettingsScreen() {
  const { preferences, isLoading, update } = useNotificationPreferences();

  if (isLoading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Notification Preferences */}
      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      <View style={styles.card}>
        {PREF_ITEMS.map((item, idx) => (
          <View
            key={item.key}
            style={[
              styles.prefRow,
              idx < PREF_ITEMS.length - 1 && styles.prefRowBorder,
            ]}
          >
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefLabel}>{item.label}</Text>
              <Text style={styles.prefDesc}>{item.description}</Text>
            </View>
            <Switch
              value={preferences[item.key]}
              onValueChange={(val) => update({ [item.key]: val })}
              trackColor={{ false: "#D1D5DB", true: "#a5b4fc" }}
              thumbColor={preferences[item.key] ? "#5b5b9e" : "#F3F4F6"}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAEE" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  prefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  prefTextWrap: { flex: 1, marginRight: 12 },
  prefLabel: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  prefDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },
});
