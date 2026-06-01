import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import type { CategorySummary } from "@aletheia/shared";
import { getCategoryColor } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  categories: CategorySummary[];
  showExpensesOnly?: boolean;
}

interface Slice {
  name: string;
  value: number;
  color: string;
  pct: number;
  startAngle: number;
  endAngle: number;
}

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 95;
const INNER_R = 50;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  if (endAngle - startAngle >= 360) {
    return [
      `M ${cx} ${cy - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR}`,
      `L ${cx - 0.01} ${cy - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR}`,
      "Z",
    ].join(" ");
  }

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export default function SpendingPieChart({
  categories,
  showExpensesOnly = true,
}: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const slices = useMemo(() => {
    const data = categories
      .filter((c) => (showExpensesOnly ? c.total < 0 : c.total !== 0))
      .map((c) => ({
        name: c.category,
        value: Math.abs(c.total),
        color: getCategoryColor(c.category),
      }))
      .sort((a, b) => b.value - a.value);

    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let angle = 0;

    return data.map((entry): Slice => {
      const sweep = (entry.value / total) * 360;
      const slice: Slice = {
        ...entry,
        pct: (entry.value / total) * 100,
        startAngle: angle,
        endAngle: angle + sweep,
      };
      angle += sweep;
      return slice;
    });
  }, [categories, showExpensesOnly]);

  if (slices.length === 0) return null;

  const active = selected !== null ? slices[selected] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.chartArea}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            {slices.map((slice, i) => (
              <Path
                key={slice.name}
                d={describeDonutSlice(CX, CY, INNER_R, OUTER_R, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                opacity={selected === null || selected === i ? 1 : 0.35}
                onPress={() => setSelected((prev) => (prev === i ? null : i))}
              />
            ))}
          </G>
        </Svg>
        {active ? (
          <View style={styles.tooltip}>
            <Text style={[styles.tooltipName, { color: colors.text }]}>{active.name}</Text>
            <Text style={[styles.tooltipValue, { color: colors.textMuted }]}>
              {formatBRL(active.value)} ({active.pct.toFixed(1)}%)
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        {slices.map((slice, i) => (
          <Pressable key={slice.name} style={styles.legendRow} onPress={() => setSelected(i)}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
              {slice.name}{" "}
              <Text style={{ color: colors.textMuted }}>({slice.pct.toFixed(1)}%)</Text>
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 16 },
  chartArea: { alignItems: "center", justifyContent: "center" },
  tooltip: { position: "absolute", alignItems: "center" },
  tooltipName: { fontSize: 13, fontWeight: "600" },
  tooltipValue: { fontSize: 12, marginTop: 2 },
  legend: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "48%" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, flexShrink: 1 },
});
