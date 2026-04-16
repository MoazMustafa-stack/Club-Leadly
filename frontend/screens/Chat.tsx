import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"

const initialMessages = [
  { id: 1, text: "This is the chat template", sender: "me", time: null },
  { id: 2, text: "Nov 30, 2023, 9:41 AM", sender: "timestamp", time: null },
  { id: 3, text: "Oh?", sender: "other", time: null },
  { id: 4, text: "Cool", sender: "other", time: null },
  { id: 5, text: "How does it work?", sender: "other", time: null },
  { id: 6, text: "You just edit any text to type in the conversation you want to show, and delete any bubbles you don't want to use", sender: "me", time: null },
  { id: 7, text: "Boom!", sender: "me", time: null },
  { id: 8, text: "Hmmm", sender: "other", time: null },
  { id: 9, text: "I think I get it", sender: "other", time: null },
  { id: 10, text: "Will head to the Help Center if I have more questions tho", sender: "other", time: null },
]

export default function Chat() {
  const navigation = useNavigation<any>()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([...messages, { id: Date.now(), text: input.trim(), sender: "me", time: null }])
    setInput("")
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>🐷</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>Trisha Palli</Text>
          <Text style={styles.headerStatus}>Active 11m ago</Text>
        </View>
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons name="call-outline" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="videocam-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            if (msg.sender === "timestamp") {
              return (
                <Text key={msg.id} style={styles.timestamp}>{msg.text}</Text>
              )
            }
            if (msg.sender === "me") {
              return (
                <View key={msg.id} style={styles.meRow}>
                  <View style={styles.meBubble}>
                    <Text style={styles.meText}>{msg.text}</Text>
                  </View>
                </View>
              )
            }
            return (
              <View key={msg.id} style={styles.otherRow}>
                {msg.id === 5 || msg.id === 10 ? (
                  <View style={styles.avatarSmall}>
                    <Text style={{ fontSize: 14 }}>🐷</Text>
                  </View>
                ) : (
                  <View style={{ width: 32 }} />
                )}
                <View style={styles.otherBubble}>
                  <Text style={styles.otherText}>{msg.text}</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={{ marginLeft: 10 }}>
            <Ionicons name="mic-outline" size={22} color="#aaa" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 10 }}>
            <Ionicons name="happy-outline" size={22} color="#aaa" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 10 }} onPress={sendMessage}>
            <Ionicons name="image-outline" size={22} color="#aaa" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#FFFAEE",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 6,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
  },
  headerStatus: {
    fontSize: 12,
    color: "#888",
  },
  timestamp: {
    textAlign: "center",
    fontSize: 12,
    color: "#aaa",
    marginVertical: 12,
  },
  meRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  meBubble: {
    backgroundColor: "#2e2e6e",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "75%",
  },
  meText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  otherBubble: {
    backgroundColor: "#dde3f5",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "75%",
  },
  otherText: {
    color: "#111",
    fontSize: 14,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    paddingBottom: 30,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111",
  },
})