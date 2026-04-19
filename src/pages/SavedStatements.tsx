import { formatYearMonth } from "../utils";
import type { SavedStatementItem } from "../utils";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Props {
  items: SavedStatementItem[];
  onBack: () => void;
  onView: (yearMonth: string) => void;
  onDelete: (id: string) => void;
}

export default function ManageMonths({ items, onBack, onView, onDelete }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Gerenciar Meses
        </h1>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Voltar
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhum extrato salvo ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Dono</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Gastos</th>
                <th className="px-4 py-3 text-right">Transações</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => {
                const yearMonth = s.id.split("#")[0];
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{formatYearMonth(yearMonth)}</td>
                    <td className="px-4 py-3">
                      {s.uploadedBy ? (
                        <div className="flex items-center gap-2">
                          {s.uploadedBy.picture && (
                            <img
                              src={s.uploadedBy.picture}
                              alt={s.uploadedBy.name}
                              className="h-6 w-6 shrink-0 rounded-full border border-gray-200 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-xs text-gray-700">{s.uploadedBy.name.split(" ")[0]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatDate(s.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      R$ {Math.abs(s.totalOut).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">{s.transactionCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(yearMonth)}
                          className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Visualizar
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-red-400 transition hover:text-red-600"
                          title="Excluir"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
