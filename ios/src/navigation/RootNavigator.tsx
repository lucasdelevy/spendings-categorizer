import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
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
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => (
        <DrawerContent {...props} user={user} onLogout={logout} />
      )}
      screenOptions={{
        headerTintColor: "#4f46e5",
        headerTitleStyle: { fontWeight: "600" },
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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainDrawer /> : <LoginScreen />}
    </NavigationContainer>
  );
}
