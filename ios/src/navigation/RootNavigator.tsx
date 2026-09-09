import { createDrawerNavigator } from "@react-navigation/drawer";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import BrandSplash from "../components/BrandSplash";
import DrawerContent from "../components/DrawerContent";
import AboutScreen from "../screens/AboutScreen";
import AccountsScreen from "../screens/AccountsScreen";
import RemindersScreen from "../screens/RemindersScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import DashboardScreen from "../screens/DashboardScreen";
import FamilyScreen from "../screens/FamilyScreen";
import LoginScreen from "../screens/LoginScreen";
import ManageMonthsScreen from "../screens/ManageMonthsScreen";
import { useTheme } from "../theme/ThemeContext";
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
  const { user, logout, deleteAccount } = useAuth();
  const { colors } = useTheme();
  if (!user) return null;

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => (
        <DrawerContent
          {...props}
          user={user}
          onLogout={logout}
          onDeleteAccount={deleteAccount}
        />
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
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Aletheia", swipeEnabled: false }}
      />
      <Drawer.Screen name="Categories" component={CategoriesScreen} />
      <Drawer.Screen name="Accounts" component={AccountsScreen} />
      <Drawer.Screen name="Reminders" component={RemindersScreen} />
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
    return <BrandSplash />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainDrawer /> : <LoginScreen />}
    </NavigationContainer>
  );
}
