import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { limitProgress } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import DailySpendingChart from "../components/DailySpendingChart";
import FamilyUploader from "../components/FamilyUploader";
import MonthSelector from "../components/MonthSelector";
import SaveConfirmBar from "../components/SaveConfirmBar";
import SpendingPieChart from "../components/SpendingPieChart";
import SummaryBar from "../components/SummaryBar";
import TransactionTable from "../components/TransactionTable";
import { Card, SegmentedControl, UnderlineTabs } from "../components/ui";
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

  const visibleTransactions = result?.transactions.filter((tx) => !tx.hidden) ?? [];

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
        <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}>
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
            transactionCount={visibleTransactions.length}
            hiddenCount={result.transactions.filter((tx) => tx.hidden).length}
            limitsExceeded={limitsExceeded}
          />

          {breached.length > 0 && (
            <View
              style={[
                styles.breach,
                { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
              ]}
            >
              <Ionicons name="warning-outline" size={20} color={colors.danger} style={styles.breachIcon} />
              <View style={styles.breachCopy}>
                <Text style={{ color: colors.danger, fontWeight: "600" }}>
                  {t("limits.breachBanner", { count: breached.length })}
                </Text>
                <Text style={{ color: colors.danger, fontSize: 12, marginTop: 2 }}>
                  {breached.map((c) => c.category).join(", ")}
                </Text>
              </View>
            </View>
          )}

          <Card style={styles.chartCard}>
            <UnderlineTabs
              options={[
                { value: "category", label: t("app.tabCategory") },
                { value: "daily", label: t("app.tabDaily") },
              ]}
              value={chartTab}
              onChange={setChartTab}
            />
            <View style={styles.chartBody}>
              {chartTab === "category" ? (
                <SpendingPieChart categories={result.categories} showExpensesOnly />
              ) : (
                <DailySpendingChart transactions={visibleTransactions} />
              )}
            </View>
          </Card>

          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.textMuted }]}>
              {t("app.transactions")}
            </Text>
            <SegmentedControl
              options={[
                { value: "all", label: t("app.tabAllTransactions") },
                { value: "byCategory", label: t("app.tabByCategory") },
              ]}
              value={txTab}
              onChange={setTxTab}
            />
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
  errorBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  results: { marginTop: 8, gap: 16 },
  breach: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  breachIcon: { marginTop: 1, marginRight: 10 },
  breachCopy: { flex: 1 },
  chartCard: { marginTop: 0 },
  chartBody: { padding: 16 },
  transactionsHeader: { gap: 10 },
  transactionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
