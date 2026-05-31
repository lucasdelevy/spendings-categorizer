import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isPt = i18n.language.startsWith("pt");

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{t("sidebar.settings")}</Text>
      <View style={styles.buttons}>
        <Pressable
          style={[styles.chip, isPt && styles.chipActive]}
          onPress={() => setLanguage("pt-BR")}
        >
          <Text style={[styles.chipText, isPt && styles.chipTextActive]}>PT</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, !isPt && styles.chipActive]}
          onPress={() => setLanguage("en")}
        >
          <Text style={[styles.chipText, !isPt && styles.chipTextActive]}>EN</Text>
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
  label: { fontSize: 14, color: "#374151" },
  buttons: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  chipTextActive: { color: "#4338ca" },
});
