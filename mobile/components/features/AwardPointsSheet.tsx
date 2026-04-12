import React from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useAwardPoints } from "../../hooks/useAwardPoints";
import { Button } from "../ui";

interface AwardPointsSheetProps {
  visible: boolean;
  onClose: () => void;
  member: { userId: string; fullName: string } | null;
  onSuccess: () => void;
}

interface FormValues {
  delta: number;
  reason: string;
}

export default function AwardPointsSheet({
  visible,
  onClose,
  member,
  onSuccess,
}: AwardPointsSheetProps) {
  const { mutate, isPending, error: mutationError } = useAwardPoints();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { delta: 0, reason: "" },
  });

  const onSubmit = handleSubmit((data) => {
    if (!member) return;
    mutate(
      {
        user_id: member.userId,
        delta: data.delta,
        reason: data.reason,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess();
        },
      }
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Award points</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Member name */}
          {member && (
            <View style={styles.memberCard}>
              <Text style={styles.memberLabel}>Awarding to</Text>
              <Text style={styles.memberName}>{member.fullName}</Text>
            </View>
          )}

          {/* Points */}
          <Text style={styles.label}>Points</Text>
          <Controller
            control={control}
            name="delta"
            rules={{
              validate: (v) => v !== 0 || "Points cannot be zero",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.delta && styles.inputError]}
                keyboardType="number-pad"
                placeholder="e.g. 10 or -5"
                placeholderTextColor="#9CA3AF"
                onChangeText={(t) => {
                  const negative = t.startsWith("-");
                  const digits = t.replace(/[^0-9]/g, "");
                  const n = parseInt(digits, 10);
                  onChange(isNaN(n) ? 0 : negative ? -n : n);
                }}
                onBlur={onBlur}
                value={value === 0 ? "" : value.toString()}
              />
            )}
          />
          <Text style={styles.hint}>
            Use negative values to deduct points
          </Text>
          {errors.delta && (
            <Text style={styles.error}>{errors.delta.message}</Text>
          )}

          {/* Reason */}
          <Text style={styles.label}>Reason *</Text>
          <Controller
            control={control}
            name="reason"
            rules={{
              required: "Please provide a reason",
              minLength: { value: 3, message: "Min 3 characters" },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.reason && styles.inputError]}
                placeholder="e.g. Attended Saturday session"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.reason && (
            <Text style={styles.error}>{errors.reason.message}</Text>
          )}

          {/* Mutation error */}
          {mutationError && (
            <Text style={styles.mutationError}>
              {mutationError instanceof Error
                ? mutationError.message
                : "Failed to award points"}
            </Text>
          )}

          <Button
            title="Award points"
            onPress={onSubmit}
            loading={isPending}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  closeBtn: { fontSize: 20, color: "#6B7280", padding: 4 },
  form: { flex: 1 },
  formContent: { padding: 20 },
  memberCard: {
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  memberLabel: { fontSize: 12, fontWeight: "600", color: "#7C3AED" },
  memberName: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 2 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  inputError: { borderColor: "#DC2626" },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  error: { color: "#DC2626", fontSize: 12, marginTop: 4 },
  mutationError: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  submitBtn: { marginTop: 24 },
});
