import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { AuthUser } from "../auth/AuthContext";

interface Props extends DrawerContentComponentProps {
  user: AuthUser;
  onLogout: () => void;
}

const NAV_ITEMS: { route: keyof import("../navigation/types").DrawerParamList; label: string }[] = [
  { route: "Categories", label: "Categories" },
  { route: "Accounts", label: "Accounts" },
  { route: "Family", label: "Family" },
  { route: "ManageMonths", label: "Manage Months" },
];

export default function DrawerContent({ navigation, user, onLogout }: Props) {
  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Navigation</Text>
      <DrawerItem
        label="Dashboard"
        onPress={() => navigation.navigate("Dashboard")}
      />
      {NAV_ITEMS.map((item) => (
        <DrawerItem
          key={item.route}
          label={item.label}
          onPress={() => navigation.navigate(item.route)}
        />
      ))}

      <View style={styles.spacer} />

      <DrawerItem label="About" onPress={() => navigation.navigate("About")} />

      <View style={styles.userSection}>
        <Image source={{ uri: user.picture }} style={styles.avatar} />
        <View style={styles.userText}>
          <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  spacer: { flex: 1 },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  userText: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  userEmail: { fontSize: 12, color: "#6b7280" },
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { fontSize: 14, fontWeight: "500", color: "#374151" },
});
