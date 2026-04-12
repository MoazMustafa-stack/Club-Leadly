import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tasks coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F3FF" },
  text: { color: "#9CA3AF", fontSize: 16 },
});
