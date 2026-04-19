import { useState } from "react";
import { api } from "../auth/api";
import type { StatementResult } from "../types";

interface Props {
  result: StatementResult;
  fileName: string;
}

export default function SaveStatementButton({ result, fileName }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const firstTransaction = result.transactions[0];
      if (!firstTransaction) throw new Error("No transactions to save");

      const [year, month] = firstTransaction.date.split("-");
      const yearMonth = `${year}${month}`;

      await api.post("/statements", {
        yearMonth,
        type: result.type,
        fileName,
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

      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-green-600">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Salvo
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar Extrato"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
