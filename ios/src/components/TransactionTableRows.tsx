import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type {
  CategoryConfig,
  StatementType,
  Transaction,
  TransactionOrigin,
} from "@aletheia/shared";
import { getCategoryColorFromConfig } from "@aletheia/shared";
import { formatBRL, resolveLocale } from "../i18n";
import { useTheme } from "../theme/ThemeContext";

const TABLE_MIN_WIDTH = 680;

const COL = {
  avatar: 36,
  date: 96,
  source: 72,
  merchant: 200,
  category: 120,
  amount: 96,
  installment: 88,
  actions: 72,
} as const;

function formatDate(raw: string): string {
  let date: Date;
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    return raw;
  }
  return date.toLocaleDateString(resolveLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SourceBadge({ source }: { source?: "bank" | "card" }) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  if (!source) return null;
  const isBank = source === "bank";
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isBank
            ? isDark ? "#312e81" : "#eef2ff"
            : isDark ? "#78350f" : "#fef3c7",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: isBank ? (isDark ? "#a5b4fc" : "#4338ca") : isDark ? "#fcd34d" : "#b45309",
        }}
      >
        {source === "bank" ? t("table.bank") : t("table.card")}
      </Text>
    </View>
  );
}

function OriginLabel({ origin }: { origin?: TransactionOrigin }) {
  const { colors } = useTheme();
  const label = origin === "openfinance" ? "API" : "CSV";
  return (
    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textMuted, opacity: 0.5 }}>
      {label}
    </Text>
  );
}

export interface TableLayout {
  showSource: boolean;
  showCategoryCell: boolean;
  showInstallmentCell: boolean;
  hasAvatars: boolean;
  hasActionsCell: boolean;
}

export function getTableLayout(
  statementType: StatementType,
  hasAvatars: boolean,
  hasActions: boolean,
  hasHide: boolean,
  showCategoryCell: boolean,
): TableLayout {
  return {
    showSource: statementType === "family",
    showCategoryCell,
    showInstallmentCell: statementType === "card" || statementType === "family",
    hasAvatars,
    hasActionsCell: hasActions || hasHide,
  };
}

interface HeaderProps extends TableLayout {
  statementType: StatementType;
}

export function TransactionTableHeader({ statementType, ...layout }: HeaderProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.headerRow, { backgroundColor: isDark ? "#111827" : "#f9fafb" }]}>
      {layout.hasAvatars && <View style={{ width: COL.avatar }} />}
      <Text style={[styles.headerCell, { width: COL.date, color: colors.textMuted }]}>
        {t("table.date")}
      </Text>
      {layout.showSource && (
        <Text style={[styles.headerCell, { width: COL.source, color: colors.textMuted }]}>
          {t("table.source")}
        </Text>
      )}
      <Text style={[styles.headerCell, { width: COL.merchant, color: colors.textMuted }]}>
        {statementType === "bank" ? t("table.payee") : t("table.merchant")}
      </Text>
      {layout.showCategoryCell && (
        <Text style={[styles.headerCell, { width: COL.category, color: colors.textMuted }]}>
          {t("table.category")}
        </Text>
      )}
      <Text
        style={[
          styles.headerCell,
          { width: COL.amount, color: colors.textMuted, textAlign: "right" },
        ]}
      >
        {t("table.amount")}
      </Text>
      {layout.showInstallmentCell && (
        <Text style={[styles.headerCell, { width: COL.installment, color: colors.textMuted }]}>
          {t("table.installment")}
        </Text>
      )}
      {layout.hasActionsCell && <View style={{ width: COL.actions }} />}
    </View>
  );
}

export interface RowProps {
  tx: Transaction;
  globalIdx: number;
  category: string;
  layout: TableLayout;
  catConfig?: CategoryConfig | null;
  accountNameMap?: Map<string, string>;
  hasActions: boolean;
  onHide?: (payload: { globalIndex: number }) => void;
  onOpenModal: (payload: { transaction: Transaction; globalIndex: number; category: string }) => void;
}

export function TransactionTableRow({
  tx,
  globalIdx,
  category,
  layout,
  catConfig,
  accountNameMap,
  hasActions,
  onHide,
  onOpenModal,
}: RowProps) {
  const { colors } = useTheme();
  const isHidden = !!tx.hidden;
  const categoryColor = getCategoryColorFromConfig(category, catConfig ?? null);
  const muted = isHidden ? 0.4 : 1;

  return (
    <View
      style={[
        styles.dataRow,
        { borderBottomColor: colors.border, opacity: muted },
      ]}
    >
      {layout.hasAvatars && (
        <View style={{ width: COL.avatar, alignItems: "center" }}>
          {tx.uploadedBy?.picture ? (
            <Image source={{ uri: tx.uploadedBy.picture }} style={styles.avatar} />
          ) : null}
        </View>
      )}
      <Text style={[styles.cell, { width: COL.date, color: colors.textMuted }]}>
        {formatDate(tx.date)}
      </Text>
      {layout.showSource && (
        <View style={{ width: COL.source }}>
          <SourceBadge source={tx.source} />
        </View>
      )}
      <View style={[styles.merchantCell, { width: COL.merchant }]}>
        <Text
          style={[
            styles.cell,
            {
              color: isHidden ? colors.textMuted : colors.text,
              textDecorationLine: isHidden ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {tx.payee}
        </Text>
        {tx.accountId && accountNameMap?.get(tx.accountId) ? (
          <View style={[styles.accountChip, { backgroundColor: colors.border }]}>
            <Text style={{ fontSize: 9, fontWeight: "600", color: colors.textMuted }}>
              {accountNameMap.get(tx.accountId)}
            </Text>
          </View>
        ) : null}
      </View>
      {layout.showCategoryCell && (
        <View style={[styles.categoryCell, { width: COL.category }]}>
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.cell, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
            {category}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.cell,
          {
            width: COL.amount,
            textAlign: "right",
            fontWeight: "600",
            color: isHidden
              ? colors.textMuted
              : tx.amount >= 0
                ? "#16a34a"
                : colors.text,
            textDecorationLine: isHidden ? "line-through" : "none",
          },
        ]}
      >
        {formatBRL(tx.amount)}
      </Text>
      {layout.showInstallmentCell && (
        <Text style={[styles.cell, { width: COL.installment, color: colors.textMuted }]}>
          {tx.installment || "—"}
        </Text>
      )}
      {layout.hasActionsCell && (
        <View style={[styles.actionsCell, { width: COL.actions }]}>
          <OriginLabel origin={tx.origin} />
          {onHide && (
            <Pressable
              onPress={() => onHide({ globalIndex: globalIdx })}
              hitSlop={6}
              style={styles.iconBtn}
            >
              <Ionicons
                name={isHidden ? "eye-outline" : "eye-off-outline"}
                size={18}
                color={isHidden ? colors.primary : colors.textMuted}
              />
            </Pressable>
          )}
          {hasActions && !isHidden && (
            <Pressable
              onPress={() => onOpenModal({ transaction: tx, globalIndex: globalIdx, category })}
              hitSlop={6}
              style={styles.iconBtn}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

interface TableProps {
  statementType: StatementType;
  layout: TableLayout;
  rows: { tx: Transaction; category: string; globalIndex: number }[];
  catConfig?: CategoryConfig | null;
  accountNameMap?: Map<string, string>;
  hasActions: boolean;
  onHide?: (payload: { globalIndex: number }) => void;
  onOpenModal: (payload: { transaction: Transaction; globalIndex: number; category: string }) => void;
}

export function TransactionTableBody({
  statementType,
  layout,
  rows,
  catConfig,
  accountNameMap,
  hasActions,
  onHide,
  onOpenModal,
}: TableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ minWidth: TABLE_MIN_WIDTH }}>
        <TransactionTableHeader statementType={statementType} {...layout} />
        {rows.map(({ tx, category, globalIndex }, idx) => (
          <TransactionTableRow
            key={`${globalIndex}-${idx}-${tx.date}`}
            tx={tx}
            globalIdx={globalIndex}
            category={category}
            layout={layout}
            catConfig={catConfig}
            accountNameMap={accountNameMap}
            hasActions={hasActions}
            onHide={onHide}
            onOpenModal={onOpenModal}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 },
  headerCell: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: { fontSize: 13 },
  merchantCell: { gap: 4 },
  categoryCell: { flexDirection: "row", alignItems: "center", gap: 6 },
  accountChip: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  actionsCell: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2 },
  iconBtn: { padding: 4 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  avatar: { width: 20, height: 20, borderRadius: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
