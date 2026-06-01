import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAccounts } from "../hooks/useAccounts";
import { useTheme } from "../theme/ThemeContext";

export default function AccountsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { accounts, loading, refresh } = useAccounts(true);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>{t("app.accounts")}</Text>
        <Pressable onPress={() => refresh()}>
          <Text style={{ color: colors.primary }}>{t("app.refresh", "Refresh")}</Text>
        </Pressable>
      </View>
      {loading && <Text style={{ color: colors.textMuted }}>{t("app.loading", "Loading…")}</Text>}
      {accounts.map((a) => (
        <View key={a.accountId} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.text }]}>{a.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {a.type === "card" ? t("accounts.card", "Card") : t("accounts.bank", "Bank")}
            {a.closingDay ? ` · ${t("accounts.closingDay", "Closing")} ${a.closingDay}` : ""}
            {a.hasApiKey ? ` · ${a.apiKeyHint}` : ""}
          </Text>
        </View>
      ))}
      {accounts.length === 0 && !loading && (
        <Text style={{ color: colors.textMuted }}>{t("accounts.empty", "No accounts yet")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  name: { fontWeight: "600", marginBottom: 4 },
});
