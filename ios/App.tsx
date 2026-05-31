import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/auth/AuthContext";
import "./src/i18n";
import { ThemeProvider } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
