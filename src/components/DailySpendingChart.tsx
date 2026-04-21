import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Transaction } from "../types";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "react-i18next";

interface Props {
  transactions: Transaction[];
}

/** Normalises any recognised date string to "YYYY-MM-DD" for sorting/grouping. */
function normaliseDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

/** Formats "YYYY-MM-DD" as "DD/MM" for axis labels. */
function shortLabel(iso: string): string {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

export default function DailySpendingChart({ transactions }: Props) {
  const { t } = useTranslation();
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const dailyMap = new Map<string, number>();

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const date = normaliseDate(t.date);
    if (!date) continue;
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + Math.abs(t.amount));
  }

  let cumulative = 0;
  const data = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => {
      cumulative += total;
      return {
        date,
        label: shortLabel(date),
        amount: +total.toFixed(2),
        cumulative: +cumulative.toFixed(2),
      };
    });

  if (data.length === 0) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 48, bottom: 24, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#374151" : "#e5e7eb"}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: isDark ? "#9ca3af" : "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis
            yAxisId="daily"
            tick={{ fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
            width={48}
          />
          <YAxis
            yAxisId="cumulative"
            orientation="right"
            tick={{ fontSize: 11, fill: isDark ? "#7c8db5" : "#9683ae" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
            width={48}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatBRL(value),
              name === "cumulative" ? t("app.cumulative") : t("app.dailySpending"),
            ]}
            labelFormatter={(_: string, payload: Array<{ payload?: { date?: string } }>) => {
              const iso = payload[0]?.payload?.date;
              if (!iso) return "";
              const [y, m, d] = iso.split("-");
              return `${d}/${m}/${y}`;
            }}
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              fontSize: "13px",
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#111827",
            }}
            itemStyle={{ color: isDark ? "#d1d5db" : "#374151" }}
            cursor={{ fill: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)" }}
          />
          <Bar
            yAxisId="daily"
            dataKey="amount"
            fill="#6366f1"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
          <Line
            yAxisId="cumulative"
            dataKey="cumulative"
            type="monotone"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
