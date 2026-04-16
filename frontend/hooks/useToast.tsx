import { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type ToastVariant = "success" | "error";

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: "#059669",
  error: "#DC2626",
};

export function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<ToastVariant>("success");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (msg: string, v: ToastVariant = "success") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(msg);
      setVariant(v);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    },
    [opacity]
  );

  const ToastComponent = useCallback(
    () => (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          { opacity, backgroundColor: VARIANT_COLORS[variant] },
        ]}
      >
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    ),
    [opacity, variant, message]
  );

  return { showToast, ToastComponent };
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
