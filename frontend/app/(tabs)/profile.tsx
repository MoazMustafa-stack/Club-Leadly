import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-outline" size={48} color="#5b5b9e" />
        </View>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
        <Text style={styles.description}>
          Your profile page is under construction. Stay tuned!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 24,
  },
  content: { alignItems: "center", paddingHorizontal: 32 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#dde3f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5b5b9e",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
