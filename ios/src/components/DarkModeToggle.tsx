import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

export default function DarkModeToggle() {
  const { t } = useTranslation();
  const { isDark, toggle, colors } = useTheme();

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? t("theme.dark", "Dark mode") : t("theme.light", "Light mode")}
      hitSlop={8}
      style={styles.wrap}
    >
      <View style={[styles.track, { backgroundColor: isDark ? colors.primary : colors.border }]}>
        <View style={[styles.thumb, isDark ? styles.thumbOn : styles.thumbOff]}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={14}
            color={isDark ? colors.primary : "#f59e0b"}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 12 },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 3,
    justifyContent: "center",
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbOff: { alignSelf: "flex-start" },
  thumbOn: { alignSelf: "flex-end" },
});
