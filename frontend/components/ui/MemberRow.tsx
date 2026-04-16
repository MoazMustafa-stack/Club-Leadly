import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Avatar from "./Avatar";

interface MemberRowProps {
  fullName: string;
  avatarInitials: string;
  role: string;
  totalPoints: number;
  right?: React.ReactNode;
}

function MemberRow({
  fullName,
  avatarInitials,
  role,
  totalPoints,
  right,
}: MemberRowProps) {
  return (
    <View style={styles.row}>
      <Avatar initials={avatarInitials} colorSeed={fullName} />
      <View style={styles.info}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.meta}>
          {role} · {totalPoints} pts
        </Text>
      </View>
      {right}
    </View>
  );
}

export default memo(MemberRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  meta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
});
