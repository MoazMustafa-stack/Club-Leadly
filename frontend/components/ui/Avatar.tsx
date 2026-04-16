import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BG_COLORS = [
  "#5b5b9e",
  "#2e2e6e",
  "#059669",
  "#D97706",
  "#a5b4fc",
  "#7b8ec9",
  "#4a6fa5",
  "#0891B2",
];

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

interface AvatarProps {
  initials: string;
  colorSeed?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: 32, md: 40, lg: 56 };
const FONT_SIZES = { sm: 12, md: 14, lg: 20 };

export default function Avatar({
  initials,
  colorSeed,
  size = "md",
}: AvatarProps) {
  const bg = colorFromSeed(colorSeed ?? initials ?? "?");
  const dim = SIZES[size];

  return (
    <View
      style={[
        styles.circle,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: FONT_SIZES[size] }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
