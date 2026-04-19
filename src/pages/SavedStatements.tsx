import { useState, useEffect, useCallback } from "react";
import { api } from "../auth/api";

interface StatementListItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  type: "bank" | "card" | "family";
  totalOut: number;
  categoryCount: number;
  transactionCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  bank: "Banco",
  card: "Cartão",
  family: "Familiar",
};

export default function SavedStatements() {
  const [statements, setStatements] = useState<StatementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ statements: StatementListItem[] }>("/statements");
      setStatements(res.statements);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/statements/${id}`);
      setStatements((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nenhum extrato salvo ainda. Processe um CSV e clique em "Salvar Extrato".
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Período</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Arquivo</th>
            <th className="px-4 py-3 text-right">Gastos</th>
            <th className="px-4 py-3 text-right">Transações</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {statements.map((s) => {
            const [yearMonth] = s.id.split("#");
            const year = yearMonth.slice(0, 4);
            const month = yearMonth.slice(4, 6);
            return (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{month}/{year}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {TYPE_LABELS[s.type] || s.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.fileName}</td>
                <td className="px-4 py-3 text-right font-mono">
                  R$ {Math.abs(s.totalOut).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">{s.transactionCount}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-400 transition hover:text-red-600"
                    title="Excluir"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
