import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { StatementType } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  type: StatementType;
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
  hiddenCount: number;
  limitsExceeded?: number;
}

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.cardValue, { color: tone ?? colors.text }]}>{value}</Text>
    </View>
  );
}

export default function SummaryBar({
  type,
  totalIn,
  totalOut,
  balance,
  transactionCount,
  hiddenCount,
  limitsExceeded = 0,
}: Props) {
  const { t } = useTranslation();

  if (type === "card") {
    return (
      <View style={styles.grid}>
        <Card label={t("summary.totalExpenses")} value={formatBRL(totalOut)} tone="#dc2626" />
        <Card label={t("summary.credits")} value={formatBRL(totalIn)} tone="#16a34a" />
        <Card label={t("summary.totalBill")} value={formatBRL(balance)} />
        {hiddenCount > 0 && <Card label={t("summary.hidden")} value={String(hiddenCount)} />}
        {limitsExceeded > 0 && (
          <Card label={t("summary.limitsExceeded")} value={String(limitsExceeded)} tone="#dc2626" />
        )}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      <Card label={t("summary.income")} value={formatBRL(totalIn)} tone="#16a34a" />
      <Card label={t("summary.expenses")} value={formatBRL(totalOut)} tone="#dc2626" />
      <Card
        label={t("summary.balance")}
        value={formatBRL(balance)}
        tone={balance >= 0 ? "#16a34a" : "#dc2626"}
      />
      <Card label={t("summary.transactions")} value={String(transactionCount)} />
      {hiddenCount > 0 && <Card label={t("summary.hidden")} value={String(hiddenCount)} />}
      {limitsExceeded > 0 && (
        <Card label={t("summary.limitsExceeded")} value={String(limitsExceeded)} tone="#dc2626" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  cardLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  cardValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
});
