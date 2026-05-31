import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { limitProgress } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import FamilyUploader from "../components/FamilyUploader";
import MonthSelector from "../components/MonthSelector";
import SaveConfirmBar from "../components/SaveConfirmBar";
import SpendingCharts from "../components/SpendingCharts";
import SummaryBar from "../components/SummaryBar";
import TransactionTable from "../components/TransactionTable";
import { useAccounts } from "../hooks/useAccounts";
import { useCategoryConfig } from "../hooks/useCategoryConfig";
import { useDashboard } from "../hooks/useDashboard";
import { useLocalPreview } from "../hooks/useLocalPreview";
import { useTransactionActions } from "../hooks/useTransactionActions";
import { useTheme } from "../theme/ThemeContext";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { config: catConfig, refresh: refreshConfig } = useCategoryConfig(!!user);
  const { accounts } = useAccounts(!!user);
  const {
    selectorMonths,
    selectedMonth,
    handleMonthChange,
    loadingData,
    monthHasData,
    result: remoteResult,
    dataSource,
    error,
    loadSavedMonths,
    loadMonthFromRemote,
    monthCache,
    setSelectedMonth,
  } = useDashboard(!!user);
  const { familyFiles, localResult, handleFamilyFiles, clearLocal } = useLocalPreview(catConfig);
  const [chartTab, setChartTab] = useState<"category" | "daily">("category");
  const [txTab, setTxTab] = useState<"all" | "byCategory">("all");

  const showUploader = !monthHasData || familyFiles.length > 0;
  const result = localResult ?? remoteResult;
  const activeSource = localResult ? "local" : dataSource;

  const reloadMonth = async () => {
    monthCache.current.delete(selectedMonth);
    await loadMonthFromRemote(selectedMonth, true);
  };

  const actions = useTransactionActions(selectedMonth, activeSource, refreshConfig, reloadMonth);

  const handleSaved = async (ym: string) => {
    clearLocal();
    monthCache.current.clear();
    setSelectedMonth(ym);
    await loadSavedMonths();
    await loadMonthFromRemote(ym, true);
  };

  const limitsExceeded = result && catConfig
    ? result.categories.filter((cat) => {
        const limit = catConfig.categories[cat.category]?.limit;
        if (!limit || limit.amount <= 0) return false;
        return limitProgress(cat.total, limit, selectedMonth) >= 1;
      }).length
    : 0;

  const breached = result && catConfig
    ? result.categories.filter((cat) => {
        const limit = catConfig.categories[cat.category]?.limit;
        if (!limit || limit.amount <= 0) return false;
        return limitProgress(cat.total, limit, selectedMonth) >= 1;
      })
    : [];

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
        <View style={styles.results}>
          <SummaryBar
            type={result.type}
            totalIn={result.totalIn}
            totalOut={result.totalOut}
            balance={result.balance}
            transactionCount={result.transactions.filter((tx) => !tx.hidden).length}
            hiddenCount={result.transactions.filter((tx) => tx.hidden).length}
            limitsExceeded={limitsExceeded}
          />

          {breached.length > 0 && (
            <View style={[styles.breach, { backgroundColor: colors.dangerBg }]}>
              <Text style={{ color: colors.danger, fontWeight: "600" }}>
                {t("limits.breachBanner", { count: breached.length })}
              </Text>
              <Text style={{ color: colors.danger, fontSize: 12 }}>
                {breached.map((c) => c.category).join(", ")}
              </Text>
            </View>
          )}

          <View style={[styles.tabs, { borderColor: colors.border }]}>
            <Pressable onPress={() => setChartTab("category")} style={styles.tab}>
              <Text style={{ color: chartTab === "category" ? colors.primary : colors.textMuted }}>
                {t("app.tabCategory")}
              </Text>
            </Pressable>
            <Pressable onPress={() => setChartTab("daily")} style={styles.tab}>
              <Text style={{ color: chartTab === "daily" ? colors.primary : colors.textMuted }}>
                {t("app.tabDaily")}
              </Text>
            </Pressable>
          </View>
          <SpendingCharts
            mode={chartTab}
            categories={result.categories}
            transactions={result.transactions.filter((tx) => !tx.hidden)}
          />

          <View style={[styles.tabs, { borderColor: colors.border, marginTop: 16 }]}>
            <Pressable onPress={() => setTxTab("all")} style={styles.tab}>
              <Text style={{ color: txTab === "all" ? colors.primary : colors.textMuted }}>
                {t("app.tabAllTransactions")}
              </Text>
            </Pressable>
            <Pressable onPress={() => setTxTab("byCategory")} style={styles.tab}>
              <Text style={{ color: txTab === "byCategory" ? colors.primary : colors.textMuted }}>
                {t("app.tabByCategory")}
              </Text>
            </Pressable>
          </View>
          <TransactionTable
            categories={result.categories}
            statementType={result.type}
            catConfig={catConfig}
            yearMonth={selectedMonth}
            mode={txTab === "all" ? "all" : "byCategory"}
            accounts={accounts}
            {...actions}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  results: { marginTop: 8 },
  breach: { padding: 12, borderRadius: 8, marginBottom: 12 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
});
