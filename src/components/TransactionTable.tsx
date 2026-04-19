import { useState } from "react";
import type { CategorySummary, StatementType } from "../types";
import { getCategoryColor } from "../engine/categories";

interface Props {
  categories: CategorySummary[];
  statementType: StatementType;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(raw: string): string {
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    return `${d}/${m}/${y}`;
  }
  return raw;
}

function SourceBadge({ source }: { source?: "bank" | "card" }) {
  if (!source) return null;
  const isBank = source === "bank";
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
        isBank
          ? "bg-indigo-100 text-indigo-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isBank ? "Banco" : "Cartão"}
    </span>
  );
}

export default function TransactionTable({ categories, statementType }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const showSource = statementType === "family";

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (categories.length === 0) return null;

  return (
    <div className="space-y-2">
      {categories.map(({ category, total, count, transactions }) => {
        const isOpen = expanded.has(category);
        const color = getCategoryColor(category);

        return (
          <div
            key={category}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <button
              onClick={() => toggle(category)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-gray-900">{category}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {count}x
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold tabular-nums ${total >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatBRL(total)}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-2">Data</th>
                      {showSource && (
                        <th className="px-4 py-2">Origem</th>
                      )}
                      <th className="px-4 py-2">
                        {statementType === "bank"
                          ? "Beneficiário"
                          : "Estabelecimento"}
                      </th>
                      {(statementType === "card" || statementType === "family") && (
                        <th className="px-4 py-2">Parcela</th>
                      )}
                      <th className="px-4 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                          {formatDate(t.date)}
                        </td>
                        {showSource && (
                          <td className="px-4 py-2">
                            <SourceBadge source={t.source} />
                          </td>
                        )}
                        <td
                          className="max-w-xs truncate px-4 py-2 text-gray-800"
                          title={t.originalDescription}
                        >
                          {t.payee}
                        </td>
                        {(statementType === "card" || statementType === "family") && (
                          <td className="px-4 py-2 text-gray-500">
                            {t.installment || "—"}
                          </td>
                        )}
                        <td
                          className={`whitespace-nowrap px-4 py-2 text-right tabular-nums ${t.amount >= 0 ? "text-green-600" : "text-gray-800"}`}
                        >
                          {formatBRL(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
