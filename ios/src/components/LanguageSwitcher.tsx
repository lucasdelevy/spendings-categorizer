import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";
import { useTheme } from "../theme/ThemeContext";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { colors } = useTheme();
  const isPt = i18n.language.startsWith("pt");

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.text }]}>{t("sidebar.settings")}</Text>
      <View style={styles.buttons}>
        <Pressable
          style={[
            styles.chip,
            { borderColor: colors.border },
            isPt && { backgroundColor: colors.primaryMutedBg, borderColor: colors.primary },
          ]}
          onPress={() => setLanguage("pt-BR")}
        >
          <Text style={[styles.chipText, { color: isPt ? colors.primaryText : colors.textMuted }]}>
            PT
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.chip,
            { borderColor: colors.border },
            !isPt && { backgroundColor: colors.primaryMutedBg, borderColor: colors.primary },
          ]}
          onPress={() => setLanguage("en")}
        >
          <Text style={[styles.chipText, { color: !isPt ? colors.primaryText : colors.textMuted }]}>
            EN
          </Text>
        </Pressable>
      </View>
    </View>
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
  label: { fontSize: 14, fontWeight: "500" },
  buttons: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
});
