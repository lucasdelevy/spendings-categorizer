import { useState } from "react";
import type { Transaction, CategoryConfig } from "../types";
import { getCategoryColorFromConfig } from "../engine/categories";

type Tab = "recategorize" | "rename" | "ignore";

export interface RecategorizePayload {
  globalIndex: number;
  newCategory: string;
  keyword: string;
  createCategory?: boolean;
  color?: string;
  applyToSimilar?: boolean;
}

export interface RenamePayload {
  globalIndex: number;
  newPayeeName: string;
}

export interface IgnorePayload {
  globalIndex: number;
}

interface Props {
  transaction: Transaction;
  globalIndex: number;
  currentCategory: string;
  allCategories: string[];
  catConfig: CategoryConfig | null;
  onRecategorize: (payload: RecategorizePayload) => void;
  onRename: (payload: RenamePayload) => void;
  onIgnore: (payload: IgnorePayload) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#f472b6", "#78716c", "#64748b",
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TransactionActionModal({
  transaction,
  globalIndex,
  currentCategory,
  allCategories,
  catConfig,
  onRecategorize,
  onRename,
  onIgnore,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("recategorize");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [applyToSimilar, setApplyToSimilar] = useState(true);
  const [renameName, setRenameName] = useState(transaction.payee);
  const [loading, setLoading] = useState(false);

  const handleRecategorize = (category: string) => {
    setLoading(true);
    onRecategorize({
      globalIndex,
      newCategory: category,
      keyword: transaction.originalDescription.toLowerCase(),
      applyToSimilar,
    });
  };

  const handleCreateAndRecategorize = () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    onRecategorize({
      globalIndex,
      newCategory: newCatName.trim(),
      keyword: transaction.originalDescription.toLowerCase(),
      createCategory: true,
      color: newCatColor,
      applyToSimilar,
    });
  };

  const handleRename = () => {
    if (!renameName.trim() || renameName === transaction.payee) return;
    setLoading(true);
    onRename({ globalIndex, newPayeeName: renameName.trim() });
  };

  const handleIgnore = () => {
    setLoading(true);
    onIgnore({ globalIndex });
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition ${
      tab === t
        ? "bg-white border border-b-0 border-gray-200 text-indigo-700"
        : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {transaction.payee}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500" title={transaction.originalDescription}>
              {transaction.originalDescription}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {transaction.date} &middot; {formatBRL(transaction.amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 px-5 pt-3">
          <button className={tabClass("recategorize")} onClick={() => setTab("recategorize")}>
            Recategorizar
          </button>
          <button className={tabClass("rename")} onClick={() => setTab("rename")}>
            Renomear
          </button>
          <button className={tabClass("ignore")} onClick={() => setTab("ignore")}>
            Ignorar
          </button>
        </div>

        {/* Tab Content */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {tab === "recategorize" && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={applyToSimilar}
                      onChange={(e) => setApplyToSimilar(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Aplicar a transações similares
                  </label>
                  <div className="max-h-48 overflow-y-auto">
                    {allCategories
                      .filter((c) => c !== currentCategory)
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => handleRecategorize(c)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: getCategoryColorFromConfig(c, catConfig) }}
                          />
                          {c}
                        </button>
                      ))}
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <p className="mb-2 text-xs font-medium text-gray-500">+ Criar nova categoria</p>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCatColor(color)}
                          className={`h-6 w-6 rounded-full border-2 transition ${
                            newCatColor === color ? "border-gray-800 scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreateAndRecategorize}
                      disabled={!newCatName.trim()}
                      className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Criar e mover
                    </button>
                  </div>
                </div>
              )}

              {tab === "rename" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Descrição original</label>
                    <p className="mt-0.5 text-sm text-gray-700">{transaction.originalDescription}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Novo nome de exibição</label>
                    <input
                      type="text"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Importações futuras com a mesma descrição usarão este nome.
                  </p>
                  <button
                    onClick={handleRename}
                    disabled={!renameName.trim() || renameName === transaction.payee}
                    className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Renomear
                  </button>
                </div>
              )}

              {tab === "ignore" && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      Ao ignorar, esta transação será removida do extrato salvo e a descrição
                      será adicionada à lista de ignorados. Importações futuras com a mesma
                      descrição serão automaticamente ignoradas.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Descrição a ignorar</label>
                    <p className="mt-0.5 text-sm font-medium text-gray-700">
                      {transaction.originalDescription}
                    </p>
                  </div>
                  <button
                    onClick={handleIgnore}
                    className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Confirmar e remover
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
