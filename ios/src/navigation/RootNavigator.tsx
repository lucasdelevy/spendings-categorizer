import { createDrawerNavigator } from "@react-navigation/drawer";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import DrawerContent from "../components/DrawerContent";
import AboutScreen from "../screens/AboutScreen";
import AccountsScreen from "../screens/AccountsScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import DashboardScreen from "../screens/DashboardScreen";
import FamilyScreen from "../screens/FamilyScreen";
import LoginScreen from "../screens/LoginScreen";
import ManageMonthsScreen from "../screens/ManageMonthsScreen";
import { useTheme } from "../theme/ThemeContext";
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  if (!user) return null;

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => (
        <DrawerContent {...props} user={user} onLogout={logout} />
      )}
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "600", color: colors.text },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Aletheia" }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} />
      <Drawer.Screen name="Accounts" component={AccountsScreen} />
      <Drawer.Screen name="Family" component={FamilyScreen} />
      <Drawer.Screen name="ManageMonths" component={ManageMonthsScreen} options={{ title: "Manage Months" }} />
      <Drawer.Screen name="About" component={AboutScreen} />
    </Drawer.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainDrawer /> : <LoginScreen />}
    </NavigationContainer>
  );
}
