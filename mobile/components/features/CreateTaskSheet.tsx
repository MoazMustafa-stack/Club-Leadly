import React, { useMemo } from "react";
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
import { z } from "zod/v4";
import { useMembers } from "../../hooks/useMembers";
import { useCreateTask } from "../../hooks/useCreateTask";
import { Button } from "../ui";

const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  point_value: z.number().int().min(1, "Points must be at least 1"),
  due_at: z.string().optional(),
});

type FormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskSheet({
  visible,
  onClose,
  onSuccess,
}: CreateTaskSheetProps) {
  const { members } = useMembers();
  const { mutate, isPending, error: mutationError } = useCreateTask();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      assigned_to_user_id: undefined,
      point_value: 10,
      due_at: "",
    },
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        const payload = {
          title: data.title,
          description: data.description || undefined,
          assigned_to_user_id: data.assigned_to_user_id || undefined,
          point_value: data.point_value,
          due_at: data.due_at || undefined,
        };
        mutate(payload, {
          onSuccess: () => {
            reset();
            onSuccess();
          },
        });
      }),
    [handleSubmit, mutate, reset, onSuccess]
  );

  const [selectedMember, setSelectedMember] = React.useState<string>("");
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);

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
          <Text style={styles.headerTitle}>Assign new task</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <Controller
            control={control}
            name="title"
            rules={{ required: "Title is required", minLength: { value: 2, message: "Min 2 characters" } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Design club poster"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.title && (
            <Text style={styles.error}>{errors.title.message}</Text>
          )}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Optional details…"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          {/* Assign to */}
          <Text style={styles.label}>Assign to</Text>
          <Controller
            control={control}
            name="assigned_to_user_id"
            render={({ field: { onChange } }) => (
              <View>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowMemberPicker(!showMemberPicker)}
                >
                  <Text
                    style={
                      selectedMember
                        ? styles.pickerText
                        : styles.pickerPlaceholder
                    }
                  >
                    {selectedMember || "Select a member (optional)"}
                  </Text>
                </TouchableOpacity>
                {showMemberPicker && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        onChange(undefined);
                        setSelectedMember("");
                        setShowMemberPicker(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>— Unassigned —</Text>
                    </TouchableOpacity>
                    {members.map((m) => (
                      <TouchableOpacity
                        key={m.user_id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          onChange(m.user_id);
                          setSelectedMember(m.full_name);
                          setShowMemberPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownText}>{m.full_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          />

          {/* Point value */}
          <Text style={styles.label}>Point value</Text>
          <Controller
            control={control}
            name="point_value"
            rules={{ required: true, min: 1 }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.point_value && styles.inputError]}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor="#9CA3AF"
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  onChange(isNaN(n) ? 0 : n);
                }}
                onBlur={onBlur}
                value={value?.toString() ?? ""}
              />
            )}
          />
          {errors.point_value && (
            <Text style={styles.error}>Points must be at least 1</Text>
          )}

          {/* Due date */}
          <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
          <Controller
            control={control}
            name="due_at"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="2026-04-30"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />

          {/* Mutation error */}
          {mutationError && (
            <Text style={styles.mutationError}>
              {mutationError instanceof Error
                ? mutationError.message
                : "Failed to create task"}
            </Text>
          )}

          <Button
            title="Create task"
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
  container: { flex: 1, backgroundColor: "#FFFAEE" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: "#dde3f5",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "InstrumentSans_700Bold",
    color: "#2e2e6e",
  },
  closeBtn: { fontSize: 20, color: "#6B7280", padding: 12 },
  form: { flex: 1 },
  formContent: { padding: 20 },
  label: {
    fontSize: 14,
    fontFamily: "InstrumentSans_700Bold",
    color: "#374151",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderStyle: "dashed" as any,
    borderColor: "#bbb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "GentiumPlus_400Regular",
    color: "#111827",
    backgroundColor: "#f0f0fa",
  },
  inputError: { borderColor: "#DC2626" },
  multiline: { minHeight: 80, textAlignVertical: "top" },
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
  pickerBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed" as any,
    borderColor: "#bbb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f0f0fa",
  },
  pickerText: { fontSize: 15, fontFamily: "GentiumPlus_400Regular", color: "#111827" },
  pickerPlaceholder: { fontSize: 15, fontFamily: "GentiumPlus_400Regular", color: "#9CA3AF" },
  dropdown: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  dropdownText: { fontSize: 15, fontFamily: "GentiumPlus_400Regular", color: "#111827" },
  submitBtn: { marginTop: 24 },
});
