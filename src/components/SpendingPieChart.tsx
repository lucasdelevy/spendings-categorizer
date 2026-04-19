import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategorySummary } from "../types";
import { getCategoryColor } from "../engine/categories";

interface Props {
  categories: CategorySummary[];
  showExpensesOnly?: boolean;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function SpendingPieChart({
  categories,
  showExpensesOnly = true,
}: Props) {
  const data = categories
    .filter((c) => {
      if (!showExpensesOnly) return c.total !== 0;
      return c.total < 0;
    })
    .map((c) => ({
      name: c.category,
      value: Math.abs(c.total),
      color: getCategoryColor(c.category),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="h-64 w-64 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBRL(value)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {data.map((entry) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700">
                {entry.name}{" "}
                <span className="text-gray-400">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
