import { useState } from "react";
import { api } from "../auth/api";
import { extractYearMonth, formatYearMonth } from "../utils";
import type { StatementResult } from "../types";

interface Props {
  result: StatementResult;
  onSaved: (yearMonth: string) => void;
}

export default function SaveConfirmBar({ result, onSaved }: Props) {
  const detected = detectMonth(result);
  const [yearMonth, setYearMonth] = useState(detected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/statements", {
        yearMonth,
        type: result.type,
        fileName: "family-combined",
        summary: {
          type: result.type,
          totalIn: result.totalIn,
          totalOut: result.totalOut,
          balance: result.balance,
          categories: result.categories.map((c) => ({
            category: c.category,
            total: c.total,
            count: c.count,
          })),
        },
        transactions: result.transactions,
      });
      onSaved(yearMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
      <span className="text-sm font-medium text-indigo-800">Mês detectado:</span>
      <input
        type="month"
        value={`${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`}
        onChange={(e) => {
          const val = e.target.value.replace("-", "");
          if (/^\d{6}$/.test(val)) setYearMonth(val);
        }}
        className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <span className="text-sm text-indigo-600">{formatYearMonth(yearMonth)}</span>
      <button
        onClick={handleSave}
        disabled={saving}
        className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function detectMonth(result: StatementResult): string {
  const first = result.transactions[0];
  if (!first) {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return extractYearMonth(first.date);
}
