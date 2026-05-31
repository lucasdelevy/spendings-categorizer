import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

export default function DarkModeToggle() {
  const { t } = useTranslation();
  const { isDark, toggle, colors } = useTheme();

  return (
    <Pressable style={styles.row} onPress={toggle}>
      <Text style={[styles.label, { color: colors.text }]}>
        {isDark ? t("theme.dark", "Dark mode") : t("theme.light", "Light mode")}
      </Text>
      <View style={[styles.track, { backgroundColor: isDark ? colors.primary : colors.border }]}>
        <View style={[styles.thumb, isDark && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: { fontSize: 14 },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  thumbOn: { alignSelf: "flex-end" },
});
