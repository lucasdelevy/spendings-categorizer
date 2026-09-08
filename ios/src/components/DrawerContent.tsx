import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { AuthUser } from "../auth/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { useTheme } from "../theme/ThemeContext";

interface Props extends DrawerContentComponentProps {
  user: AuthUser;
  onLogout: () => void;
}

const NAV_ITEMS: { route: keyof import("../navigation/types").DrawerParamList; labelKey: string }[] = [
  { route: "Categories", labelKey: "app.categories" },
  { route: "Accounts", labelKey: "app.accounts" },
  { route: "Family", labelKey: "app.family" },
  { route: "ManageMonths", labelKey: "app.manageMonths" },
];

export default function DrawerContent({ user, onLogout, ...props }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { navigation } = props;

  const itemColors = {
    inactiveTintColor: colors.text,
    activeTintColor: colors.primary,
    labelStyle: styles.itemLabel,
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <DrawerItem
        label={t("app.dashboard")}
        onPress={() => navigation.navigate("Dashboard")}
        {...itemColors}
      />
      {NAV_ITEMS.map((item) => (
        <DrawerItem
          key={item.route}
          label={t(item.labelKey)}
          onPress={() => navigation.navigate(item.route)}
          {...itemColors}
        />
      ))}

      <View style={styles.spacer} />

      <DrawerItem
        label={t("app.about")}
        onPress={() => navigation.navigate("About")}
        {...itemColors}
      />

      <View style={[styles.userSection, { borderTopColor: colors.border }]}>
        <Image source={{ uri: user.picture }} style={styles.avatar} />
        <View style={styles.userText}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.border }]}
        onPress={onLogout}
      >
        <Text style={[styles.logoutText, { color: colors.text }]}>{t("app.logout")}</Text>
      </TouchableOpacity>
      <View style={[styles.prefsRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <LanguageSwitcher compact />
        <DarkModeToggle />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  itemLabel: { fontWeight: "500", marginLeft: -8 },
  spacer: { flex: 1 },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  userText: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "600" },
  userEmail: { fontSize: 12 },
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { fontSize: 14, fontWeight: "500" },
  prefsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
