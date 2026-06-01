import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type {
  Account,
  CategoryConfig,
  CategorySummary,
  StatementType,
  Transaction,
} from "@aletheia/shared";
import {
  compareDatesDesc,
  effectiveMonthlyLimit,
  getCategoryColorFromConfig,
  limitColor,
  limitProgress,
} from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import TransactionActionModal from "./TransactionActionModal";
import type { RecategorizePayload } from "./TransactionActionModal";
import TransactionFilters, {
  EMPTY_FILTERS,
  collectOwners,
  filtersActive,
  matchesFilters,
  type FilterState,
} from "./TransactionFilters";
import { getTableLayout, TransactionTableBody } from "./TransactionTableRows";
import { Button, Card } from "./ui";

export type TransactionTableMode = "all" | "byCategory";
export type { RecategorizePayload };

interface Props {
  categories: CategorySummary[];
  statementType: StatementType;
  catConfig?: CategoryConfig | null;
  yearMonth?: string;
  mode?: TransactionTableMode;
  accounts?: Account[];
  onRecategorize?: (payload: RecategorizePayload) => void;
  onRename?: (payload: { globalIndex: number; newPayeeName: string }) => void;
  onIgnore?: (payload: { globalIndex: number }) => void;
  onHide?: (payload: { globalIndex: number }) => void;
}

interface ModalTarget {
  transaction: Transaction;
  globalIndex: number;
  category: string;
}

export default function TransactionTable({
  categories,
  statementType,
  catConfig,
  yearMonth,
  mode = "byCategory",
  accounts,
  onRecategorize,
  onRename,
  onIgnore,
  onHide,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);

  const hasActions = !!(onRecategorize || onRename || onIgnore);
  const isFiltering = filtersActive(filters);

  const allTransactions = useMemo(
    () => categories.flatMap((c) => c.transactions),
    [categories],
  );
  const owners = useMemo(() => collectOwners(allTransactions), [allTransactions]);

  const filteredCategories = useMemo(() => {
    const base = isFiltering
      ? categories
          .map((cat) => {
            const txs = cat.transactions.filter((tx) => matchesFilters(tx, filters));
            return { ...cat, transactions: txs, count: txs.length };
          })
          .filter((cat) => cat.transactions.length > 0)
      : categories;

    return base.map((cat) => ({
      ...cat,
      total: cat.transactions.reduce((sum, tx) => (tx.hidden ? sum : sum + tx.amount), 0),
      count: cat.transactions.filter((tx) => !tx.hidden).length,
    }));
  }, [categories, filters, isFiltering]);

  const hasAvatars = filteredCategories.some((c) =>
    c.transactions.some((tx) => tx.uploadedBy?.picture),
  );

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts ?? []) map.set(a.accountId, a.name);
    return map;
  }, [accounts]);

  const flatRows = useMemo(() => {
    if (mode !== "all") return [];
    const rows: { tx: Transaction; category: string; globalIndex: number }[] = [];
    for (const cat of filteredCategories) {
      for (const tx of cat.transactions) {
        rows.push({
          tx,
          category: cat.category,
          globalIndex: tx._originalIndex ?? rows.length,
        });
      }
    }
    rows.sort((a, b) => compareDatesDesc(a.tx.date, b.tx.date));
    return rows;
  }, [mode, filteredCategories]);

  const visibleCategoryNames = categories.map((c) => c.category);
  const configCategoryNames = catConfig ? Object.keys(catConfig.categories) : [];
  const allCategoryNames = Array.from(new Set([...visibleCategoryNames, ...configCategoryNames]));

  const allLayout = getTableLayout(statementType, hasAvatars, hasActions, !!onHide, true);
  const categoryLayout = getTableLayout(statementType, hasAvatars, hasActions, !!onHide, false);

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (categories.length === 0) return null;

  const noResults =
    (mode === "byCategory" && isFiltering && filteredCategories.length === 0) ||
    (mode === "all" && flatRows.length === 0);

  return (
    <View>
      <Button
        label={showFilters ? `${t("filters.title")} ▾` : `${t("filters.title")} ▸`}
        variant="secondary"
        compact
        onPress={() => setShowFilters((v) => !v)}
        style={styles.filterToggle}
      />
      {showFilters && (
        <TransactionFilters filters={filters} onChange={setFilters} owners={owners} />
      )}

      {noResults && (
        <Text style={[styles.noResults, { color: colors.textMuted }]}>{t("table.noResults")}</Text>
      )}

      {mode === "all" && flatRows.length > 0 && (
        <Card style={styles.tableCard}>
          <TransactionTableBody
            statementType={statementType}
            layout={allLayout}
            rows={flatRows}
            catConfig={catConfig}
            accountNameMap={accountNameMap}
            hasActions={hasActions}
            onHide={onHide}
            onOpenModal={setModalTarget}
          />
        </Card>
      )}

      {mode === "byCategory" && (
        <View style={styles.categoryList}>
          {filteredCategories.map(({ category, total, count, transactions }) => {
            const isOpen = expanded.has(category);
            const color = getCategoryColorFromConfig(category, catConfig ?? null);
            const hiddenCount = transactions.filter((tx) => tx.hidden).length;
            const catLimit = catConfig?.categories[category]?.limit;
            const hasLimit = !!(catLimit && catLimit.amount > 0 && yearMonth);
            const progress = hasLimit ? limitProgress(total, catLimit!, yearMonth!) : 0;
            const progressClamp = Math.min(progress, 1);
            const progressTone = hasLimit ? limitColor(progress) : "green";
            const monthlyBudget = hasLimit ? effectiveMonthlyLimit(catLimit!, yearMonth!) : 0;
            const progressBarColor =
              progressTone === "red" ? "#ef4444" : progressTone === "amber" ? "#f59e0b" : "#22c55e";
            const progressTextColor =
              progressTone === "red"
                ? colors.danger
                : progressTone === "amber"
                  ? "#d97706"
                  : colors.textMuted;

            const rows = transactions.map((tx, txIdx) => ({
              tx,
              category,
              globalIndex: tx._originalIndex ?? txIdx,
            }));

            return (
              <Card key={category} style={styles.categoryCard}>
                <Pressable
                  onPress={() => toggle(category)}
                  style={[styles.categoryHeader, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.categoryHeaderTop}>
                    <View style={styles.categoryTitleRow}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{count}x</Text>
                      </View>
                      {hiddenCount > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                          <Ionicons name="eye-off-outline" size={11} color={colors.textMuted} />
                          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{hiddenCount}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.categoryMeta}>
                      <Text
                        style={{
                          fontWeight: "600",
                          color: total >= 0 ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {formatBRL(total)}
                      </Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>
                  {hasLimit && (
                    <View style={styles.limitRow}>
                      <View style={[styles.limitTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.limitFill,
                            { width: `${progressClamp * 100}%`, backgroundColor: progressBarColor },
                          ]}
                        />
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: "500", color: progressTextColor }}>
                        {formatBRL(Math.abs(total))}{" "}
                        {t("limits.ofLimit", { limit: formatBRL(monthlyBudget) })}
                        {progress >= 1
                          ? ` — ${t("limits.exceeded")}`
                          : ` (${Math.round(progress * 100)}%)`}
                      </Text>
                    </View>
                  )}
                </Pressable>
                {isOpen && (
                  <TransactionTableBody
                    statementType={statementType}
                    layout={categoryLayout}
                    rows={rows}
                    catConfig={catConfig}
                    accountNameMap={accountNameMap}
                    hasActions={hasActions}
                    onHide={onHide}
                    onOpenModal={setModalTarget}
                  />
                )}
              </Card>
            );
          })}
        </View>
      )}

      {modalTarget && onRecategorize && onRename && onIgnore && (
        <TransactionActionModal
          transaction={modalTarget.transaction}
          globalIndex={modalTarget.globalIndex}
          currentCategory={modalTarget.category}
          allCategories={allCategoryNames}
          catConfig={catConfig ?? null}
          onRecategorize={(payload) => {
            setModalTarget(null);
            onRecategorize(payload);
          }}
          onRename={(payload) => {
            setModalTarget(null);
            onRename(payload);
          }}
          onIgnore={(payload) => {
            setModalTarget(null);
            onIgnore(payload);
          }}
          onClose={() => setModalTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterToggle: { alignSelf: "flex-start", marginBottom: 8 },
  noResults: { textAlign: "center", paddingVertical: 24, fontSize: 14 },
  tableCard: { overflow: "hidden" },
  categoryList: { gap: 8 },
  categoryCard: { overflow: "hidden" },
  categoryHeader: { padding: 14, gap: 8 },
  categoryHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { fontSize: 15, fontWeight: "600" },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  limitRow: { gap: 6 },
  limitTrack: { height: 6, borderRadius: 999, overflow: "hidden" },
  limitFill: { height: 6, borderRadius: 999 },
});
