import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

const PHASES = ["14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("app.title")}</Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>{t("about.tagline", "Personal spending categorizer")}</Text>
      <Text style={[styles.section, { color: colors.text }]}>{t("about.featuresTitle", "Features")}</Text>
      {PHASES.map((phase) => (
        <View key={phase} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.phase, { color: colors.primary }]}>{t(`about.features.phase${phase}Title`)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {t(`about.features.phase${phase}Desc`)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  tagline: { marginBottom: 20, marginTop: 4 },
  section: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  phase: { fontWeight: "600", marginBottom: 4 },
});
