import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import MonthSelector from "../components/MonthSelector";
import { useDashboard } from "../hooks/useDashboard";
import { useTheme } from "../theme/ThemeContext";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    selectorMonths,
    selectedMonth,
    handleMonthChange,
    loadingData,
    monthHasData,
    result,
    error,
  } = useDashboard(!!user);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <MonthSelector
        months={selectorMonths}
        selected={selectedMonth}
        onChange={handleMonthChange}
        allowNew
        loading={loadingData}
      />

      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerBg }]}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      )}

      {!monthHasData && !result && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {t("app.uploadStatements")}
        </Text>
      )}

      {result && monthHasData && (
        <Text style={[styles.loaded, { color: colors.textMuted }]}>
          {t("app.transactions")}: {result.transactions.filter((tx) => !tx.hidden).length}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  hint: { textAlign: "center", marginTop: 24, fontSize: 15 },
  loaded: { textAlign: "center", fontSize: 14 },
});
