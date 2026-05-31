import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import FamilyUploader from "../components/FamilyUploader";
import MonthSelector from "../components/MonthSelector";
import { useCategoryConfig } from "../hooks/useCategoryConfig";
import { useDashboard } from "../hooks/useDashboard";
import { useLocalPreview } from "../hooks/useLocalPreview";
import { useTheme } from "../theme/ThemeContext";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { config: catConfig } = useCategoryConfig(!!user);
  const {
    selectorMonths,
    selectedMonth,
    handleMonthChange,
    loadingData,
    monthHasData,
    result: remoteResult,
    error,
    setError,
  } = useDashboard(!!user);
  const { familyFiles, localResult, handleFamilyFiles } = useLocalPreview(catConfig);

  const showUploader = !monthHasData || familyFiles.length > 0;
  const result = localResult ?? remoteResult;

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

      {showUploader && (
        <FamilyUploader files={familyFiles} onFilesLoaded={handleFamilyFiles} />
      )}

      {result && (
        <Text style={[styles.loaded, { color: colors.textMuted }]}>
          {t("app.transactions")}: {result.transactions.filter((tx) => !tx.hidden).length}
          {localResult ? ` (${t("upload.preview", "preview")})` : ""}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  loaded: { textAlign: "center", fontSize: 14, marginTop: 8 },
});
