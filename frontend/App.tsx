import { useFonts } from "expo-font"
import {
  GentiumPlus_400Regular,
  GentiumPlus_700Bold,
} from "@expo-google-fonts/gentium-plus"
import {
  InstrumentSans_400Regular,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans"
import {
  InriaSerif_400Regular,
  InriaSerif_700Bold,
} from "@expo-google-fonts/inria-serif"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SignIn from "./screens/SignIn"
import MemberDashboard from "./screens/MemberDashboard"
import OrganizerDashboard from "./screens/OrganizerDashboard"
import CreateEventScreen from "./screens/CreateEvent"
import ScheduleDetails from "./screens/ScheduleDetails"
import CreateEventStep3 from "./screens/CreateEventStep3"
import DelegateTask from "./screens/DelegateTask"
import Chat from "./screens/Chat"
import Activity from "./screens/Activity"
import Leaderboard from "./screens/Leaderboard"
import ClubSetup from "./screens/ClubSetup"
import { AuthProvider } from "./context/AuthContext"

const Stack = createNativeStackNavigator()

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    GentiumPlus_400Regular,
    GentiumPlus_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_700Bold,
    InriaSerif_400Regular,
    InriaSerif_700Bold,
  })

  if (!fontsLoaded && !fontError) return null

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="ClubSetup" component={ClubSetup} />
          <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
          <Stack.Screen name="OrganizerDashboard" component={OrganizerDashboard} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="ScheduleDetails" component={ScheduleDetails} />
          <Stack.Screen name="CreateEventStep3" component={CreateEventStep3} />
          <Stack.Screen name="DelegateTask" component={DelegateTask} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="Activity" component={Activity} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}