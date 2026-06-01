import { useMemo, useState } from "react";
import { Modal, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  Account,
  CategoryConfig,
  CategorySummary,
  StatementType,
  Transaction,
} from "@aletheia/shared";
import { getCategoryColorFromConfig, limitProgress } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import TransactionFilters, {
  EMPTY_FILTERS,
  collectOwners,
  matchesFilters,
  type FilterState,
} from "./TransactionFilters";
import { Button, TextField } from "./ui";

export type TransactionTableMode = "all" | "byCategory";

export interface RecategorizePayload {
  globalIndex: number;
  newCategory: string;
  keyword: string;
  createCategory?: boolean;
  color?: string;
  applyToSimilar?: boolean;
}

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

export default function TransactionTable({
  categories,
  catConfig,
  yearMonth,
  mode = "all",
  onRecategorize,
  onRename,
  onIgnore,
  onHide,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const owners = useMemo(
    () => collectOwners(categories.flatMap((c) => c.transactions)),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        transactions: cat.transactions.filter(
          (tx) => !tx.hidden && matchesFilters(tx, filters),
        ),
      }))
      .filter((cat) => cat.transactions.length > 0)
      .map((cat) => ({
        ...cat,
        total: cat.transactions.reduce((s, tx) => s + tx.amount, 0),
        count: cat.transactions.length,
      }));
  }, [categories, filters]);

  const flatRows = useMemo(
    () => filteredCategories.flatMap((c) => c.transactions),
    [filteredCategories],
  );

  const sections =
    mode === "all"
      ? [{ title: t("app.tabAllTransactions"), data: flatRows }]
      : filteredCategories.map((c) => ({ title: c.category, data: c.transactions, summary: c }));

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

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item._originalIndex ?? index}-${item.date}-${item.amount}`}
        scrollEnabled={false}
        renderSectionHeader={({ section }) => {
          const summary = (section as { summary?: CategorySummary }).summary;
          const limit = summary && catConfig ? catConfig.categories[summary.category]?.limit : undefined;
          const progress =
            summary && limit && yearMonth
              ? limitProgress(summary.total, limit, yearMonth)
              : 0;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              {summary && (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {formatBRL(summary.total)} · {summary.count}
                  {limit && limit.amount > 0 ? ` · ${Math.round(progress * 100)}%` : ""}
                </Text>
              )}
            </View>
          );
        }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderColor: colors.border }]}
            onPress={() => {
              setActiveTx(item);
              setNewCategory(item.category);
              setRenameValue(item.payee);
            }}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: getCategoryColorFromConfig(item.category, catConfig ?? null) },
              ]}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.payee, { color: colors.text }]} numberOfLines={1}>
                {item.payee}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.date}</Text>
            </View>
            <Text style={[styles.amount, { color: item.amount < 0 ? "#dc2626" : "#16a34a" }]}>
              {formatBRL(item.amount)}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={!!activeTx} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{activeTx?.payee}</Text>
            {onRecategorize && (
              <>
                <TextField
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder={t("actions.newCategory", "Category")}
                />
                <Button
                  label={t("actions.recategorize", "Recategorize")}
                  onPress={() => {
                    if (!activeTx) return;
                    onRecategorize({
                      globalIndex: activeTx._originalIndex ?? 0,
                      newCategory,
                      keyword: activeTx.payee,
                    });
                    setActiveTx(null);
                  }}
                />
              </>
            )}
            {onRename && (
              <>
                <TextField value={renameValue} onChangeText={setRenameValue} />
                <Button
                  label={t("actions.rename", "Rename")}
                  onPress={() => {
                    if (!activeTx) return;
                    onRename({ globalIndex: activeTx._originalIndex ?? 0, newPayeeName: renameValue });
                    setActiveTx(null);
                  }}
                />
              </>
            )}
            {onIgnore && (
              <Button
                label={t("actions.ignore", "Ignore")}
                variant="secondary"
                onPress={() => {
                  if (!activeTx) return;
                  onIgnore({ globalIndex: activeTx._originalIndex ?? 0 });
                  setActiveTx(null);
                }}
              />
            )}
            {onHide && (
              <Button
                label={t("actions.hide", "Hide")}
                variant="secondary"
                onPress={() => {
                  if (!activeTx) return;
                  onHide({ globalIndex: activeTx._originalIndex ?? 0 });
                  setActiveTx(null);
                }}
              />
            )}
            <Button label={t("app.cancel")} variant="ghost" onPress={() => setActiveTx(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterToggle: { alignSelf: "flex-start", marginBottom: 8 },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 4 },
  sectionTitle: { fontWeight: "700", fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1 },
  payee: { fontSize: 14, fontWeight: "500" },
  amount: { fontSize: 14, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modal: { padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
});
