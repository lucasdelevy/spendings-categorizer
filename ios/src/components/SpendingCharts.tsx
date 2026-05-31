import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { CategorySummary, Transaction } from "@aletheia/shared";
import { getCategoryColor } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  mode: "category" | "daily";
  categories: CategorySummary[];
  transactions: Transaction[];
}

export default function SpendingCharts({ mode, categories, transactions }: Props) {
  const { colors } = useTheme();

  if (mode === "category") {
    const total = categories.reduce((s, c) => s + Math.abs(c.total), 0) || 1;
    return (
      <View style={styles.wrap}>
        {categories.slice(0, 8).map((cat) => {
          const pct = Math.round((Math.abs(cat.total) / total) * 100);
          return (
            <View key={cat.category} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: getCategoryColor(cat.category) }]} />
              <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                {cat.category}
              </Text>
              <Text style={[styles.value, { color: colors.textMuted }]}>{pct}%</Text>
              <Text style={[styles.amount, { color: colors.text }]}>{formatBRL(cat.total)}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  const byDay = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.hidden || tx.amount >= 0) continue;
    byDay.set(tx.date, (byDay.get(tx.date) ?? 0) + Math.abs(tx.amount));
  }
  const days = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const max = Math.max(...days.map((d) => d[1]), 1);

  return (
    <View style={styles.wrap}>
      {days.map(([date, amount]) => (
        <View key={date} style={styles.barRow}>
          <Text style={[styles.barDate, { color: colors.textMuted }]}>{date.slice(0, 5)}</Text>
          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            <View
              style={[styles.barFill, { width: `${(amount / max) * 100}%`, backgroundColor: colors.primary }]}
            />
          </View>
          <Text style={[styles.barAmount, { color: colors.text }]}>{formatBRL(-amount)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 14 },
  value: { width: 36, textAlign: "right", fontSize: 12 },
  amount: { width: 90, textAlign: "right", fontSize: 13, fontWeight: "600" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barDate: { width: 48, fontSize: 11 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barAmount: { width: 80, textAlign: "right", fontSize: 12 },
});
