import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import FamilyUploader from "../components/FamilyUploader";
import MonthSelector from "../components/MonthSelector";
import SaveConfirmBar from "../components/SaveConfirmBar";
import { useAccounts } from "../hooks/useAccounts";
import { useCategoryConfig } from "../hooks/useCategoryConfig";
import { useDashboard } from "../hooks/useDashboard";
import { useLocalPreview } from "../hooks/useLocalPreview";
import { useTheme } from "../theme/ThemeContext";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { config: catConfig } = useCategoryConfig(!!user);
  const { accounts } = useAccounts(!!user);
  const {
    selectorMonths,
    selectedMonth,
    handleMonthChange,
    loadingData,
    monthHasData,
    result: remoteResult,
    error,
    loadSavedMonths,
    loadMonthFromRemote,
    monthCache,
    setSelectedMonth,
  } = useDashboard(!!user);
  const { familyFiles, localResult, handleFamilyFiles, clearLocal } = useLocalPreview(catConfig);

  const showUploader = !monthHasData || familyFiles.length > 0;
  const result = localResult ?? remoteResult;

  const handleSaved = async (ym: string) => {
    clearLocal();
    monthCache.current.clear();
    setSelectedMonth(ym);
    await loadSavedMonths();
    await loadMonthFromRemote(ym, true);
  };

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

      {localResult && familyFiles.length > 0 && (
        <SaveConfirmBar
          result={localResult}
          files={familyFiles}
          catConfig={catConfig}
          accounts={accounts}
          onSaved={handleSaved}
        />
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
