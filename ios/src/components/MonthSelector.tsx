import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { formatYearMonth } from "../utils";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  months: string[];
  selected: string;
  onChange: (ym: string) => void;
  allowNew?: boolean;
  loading?: boolean;
}

export default function MonthSelector({ months, selected, onChange, allowNew, loading }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const idx = months.indexOf(selected);
  const isNewMonth = allowNew && idx === -1;
  const hasPrev = !isNewMonth && idx < months.length - 1;
  const hasNext = !isNewMonth ? idx > 0 : true;

  const goPrev = () => {
    if (isNewMonth || idx >= months.length - 1) return;
    onChange(months[idx + 1]);
  };

  const goNext = () => {
    if (isNewMonth) {
      onChange(months[0]);
      return;
    }
    if (idx > 0) onChange(months[idx - 1]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={goPrev} disabled={!hasPrev} style={styles.arrow}>
          <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={[styles.label, { color: colors.text }]}>{formatYearMonth(selected)}</Text>
          {isNewMonth && (
            <Text style={[styles.newBadge, { color: colors.primary }]}>{t("month.new")}</Text>
          )}
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />}
        </View>
        <Pressable onPress={goNext} disabled={!hasNext} style={styles.arrow}>
          <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  arrow: { padding: 8 },
  center: { minWidth: 160, alignItems: "center" },
  label: { fontSize: 22, fontWeight: "600" },
  newBadge: { fontSize: 12, fontWeight: "500", marginTop: 2 },
});
