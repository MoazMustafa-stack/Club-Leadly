import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "purple";
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: "#F3F4F6", text: "#374151" },
  success: { bg: "#D1FAE5", text: "#065F46" },
  warning: { bg: "#FEF3C7", text: "#92400E" },
  purple: { bg: "#EDE9FE", text: "#7C3AED" },
};

export default function Badge({
  label,
  variant = "default",
  style,
}: BadgeProps) {
  const colors = VARIANT_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
