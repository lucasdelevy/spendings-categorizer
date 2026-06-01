import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import type { Transaction } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "react-i18next";

interface Props {
  transactions: Transaction[];
}

interface DayPoint {
  date: string;
  label: string;
  amount: number;
  cumulative: number;
}

function normaliseDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function shortLabel(iso: string): string {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

function formatAxis(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

const PLOT_HEIGHT = 200;
const BAR_WIDTH = 20;
const MIN_SLOT_WIDTH = 28;
const PAD_LEFT = 44;
const PAD_RIGHT = 44;
const PAD_TOP = 12;
const PAD_BOTTOM = 36;

export default function DailySpendingChart({ transactions }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const data = useMemo(() => {
    const dailyMap = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.amount >= 0) continue;
      const date = normaliseDate(tx.date);
      if (!date) continue;
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + Math.abs(tx.amount));
    }

    let cumulative = 0;
    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]): DayPoint => {
        cumulative += total;
        return {
          date,
          label: shortLabel(date),
          amount: +total.toFixed(2),
          cumulative: +cumulative.toFixed(2),
        };
      });
  }, [transactions]);

  if (data.length === 0) return null;

  const maxDaily = niceMax(Math.max(...data.map((d) => d.amount)));
  const maxCumulative = niceMax(Math.max(...data.map((d) => d.cumulative)));
  const minPlotWidth = data.length * MIN_SLOT_WIDTH;
  const plotWidth =
    containerWidth > 0
      ? Math.max(minPlotWidth, containerWidth - PAD_LEFT - PAD_RIGHT)
      : minPlotWidth;
  const chartWidth = PAD_LEFT + plotWidth + PAD_RIGHT;
  const chartHeight = PAD_TOP + PLOT_HEIGHT + PAD_BOTTOM;
  const slotWidth = plotWidth / data.length;
  const scrollable = containerWidth > 0 && chartWidth > containerWidth;
  const svgWidth = scrollable ? chartWidth : Math.max(chartWidth, containerWidth);
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const axisColor = colors.textMuted;

  const linePoints = data
    .map((point, i) => {
      const x = PAD_LEFT + (i + 0.5) * slotWidth;
      const y = PAD_TOP + PLOT_HEIGHT - (point.cumulative / maxCumulative) * PLOT_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    fraction: f,
    daily: maxDaily * f,
    cumulative: maxCumulative * f,
  }));

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        scrollEnabled={scrollable}
        showsHorizontalScrollIndicator={scrollable}
      >
        <Svg width={svgWidth} height={chartHeight}>
          <G>
            {yTicks.map((tick) => {
              const y = PAD_TOP + PLOT_HEIGHT - tick.fraction * PLOT_HEIGHT;
              return (
                <G key={tick.fraction}>
                  <Line
                    x1={PAD_LEFT}
                    y1={y}
                    x2={PAD_LEFT + plotWidth}
                    y2={y}
                    stroke={gridColor}
                    strokeDasharray="3 3"
                  />
                  <SvgText x={PAD_LEFT - 6} y={y + 4} fontSize={10} fill={axisColor} textAnchor="end">
                    {formatAxis(tick.daily)}
                  </SvgText>
                  <SvgText
                    x={PAD_LEFT + plotWidth + 6}
                    y={y + 4}
                    fontSize={10}
                    fill={colors.chartLine}
                    textAnchor="start"
                  >
                    {formatAxis(tick.cumulative)}
                  </SvgText>
                </G>
              );
            })}

            {data.map((point, i) => {
              const centerX = PAD_LEFT + (i + 0.5) * slotWidth;
              const x = centerX - BAR_WIDTH / 2;
              const barHeight = (point.amount / maxDaily) * PLOT_HEIGHT;
              const y = PAD_TOP + PLOT_HEIGHT - barHeight;
              return (
                <G key={point.date}>
                  <Rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={barHeight}
                    rx={3}
                    fill={colors.chartBar}
                  />
                  <SvgText
                    x={centerX}
                    y={chartHeight - 8}
                    fontSize={10}
                    fill={axisColor}
                    textAnchor="middle"
                    rotation={-45}
                    origin={`${centerX}, ${chartHeight - 8}`}
                  >
                    {point.label}
                  </SvgText>
                </G>
              );
            })}

            <Path
              d={`M ${linePoints.replace(/ /g, " L ")}`}
              stroke={colors.chartLine}
              strokeWidth={2}
              fill="none"
            />
          </G>
        </Svg>
      </ScrollView>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {t("app.dailySpending")} · {t("app.cumulative")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  hint: { fontSize: 11, textAlign: "center", marginTop: 4 },
});
