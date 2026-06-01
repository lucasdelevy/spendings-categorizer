import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useCategoryConfig } from "../hooks/useCategoryConfig";
import { useTheme } from "../theme/ThemeContext";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { config, loading } = useCategoryConfig(true);

  if (loading || !config) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>{t("app.loading", "Loading…")}</Text>
      </View>
    );
  }

  const names = Object.keys(config.categories);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t("app.categories")}</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {names.length} {t("categories.categories", "categories")}
      </Text>
      {names.map((name) => (
        <View key={name} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.catName, { color: colors.text }]}>{name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {(config.categories[name]?.keywords ?? []).slice(0, 4).join(", ")}
          </Text>
        </View>
      ))}
      <Text style={[styles.note, { color: colors.textMuted }]}>
        {t("categories.editOnWebHint", "Full category editing is available on web; mobile view is read-only for now.")}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  sub: { marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  catName: { fontWeight: "600", marginBottom: 4 },
  note: { marginTop: 16, fontSize: 13, fontStyle: "italic" },
});
