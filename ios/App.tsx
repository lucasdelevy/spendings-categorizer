import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/auth/AuthContext";
import "./src/i18n";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
          <ThemedStatusBar />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
