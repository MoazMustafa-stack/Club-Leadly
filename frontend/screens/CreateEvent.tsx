import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"

export default function CreateEventScreen() {
  const navigation = useNavigation<any>()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [importance, setImportance] = useState("")

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={styles.avatar}>
          <Text style={{ fontSize: 22 }}>🐷</Text>
        </View>

        <Text style={styles.pageTitle}>Create Event</Text>

        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={[styles.stepLine, { backgroundColor: "#5b5b9e" }]} />
            <View style={[styles.stepLine, { backgroundColor: "#c4c4c4" }]} />
            <View style={[styles.stepLine, { backgroundColor: "#c4c4c4" }]} />
            <View style={[styles.stepLine, { backgroundColor: "#c4c4c4" }]} />
          </View>

          <Text style={styles.cardTitle}>Event Details</Text>
          <Text style={styles.cardSubtitle}>basic info about your event</Text>

          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: social mixer"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 10 }]}
            placeholder="Tell members what this event is about"
            placeholderTextColor="#aaa"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: TT VOC gallery"
                placeholderTextColor="#aaa"
                value={location}
                onChangeText={setLocation}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Importance</Text>
              <TextInput
                style={styles.input}
                placeholder="pick color"
                placeholderTextColor="#aaa"
                value={importance}
                onChangeText={setImportance}
              />
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
              <Text style={styles.btnText}>{"< back"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("ScheduleDetails")}>
              <Text style={styles.btnText}>{"next >"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("OrganizerDashboard")}>
          <Ionicons name="home-outline" size={22} color="#5b5b9e" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Leaderboard")}>
          <Ionicons name="trophy-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Activity")}>
            <Ionicons name="notifications-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Chat")}>
          <Ionicons name="mail-outline" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAEE",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e5e0d5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    fontFamily: "InstrumentSans_700Bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#dde3f5",
    borderRadius: 20,
    padding: 20,
  },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
    fontFamily: "InstrumentSans_700Bold",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
    marginTop: 10,
    fontFamily: "InstrumentSans_700Bold",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#aaa",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#111",
    backgroundColor: "#f0f0fa",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    backgroundColor: "#2e2e6e",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "InstrumentSans_700Bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navItem: {
    alignItems: "center",
  },
})