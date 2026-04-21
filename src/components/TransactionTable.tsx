import { useState, useMemo } from "react";
import type { CategorySummary, StatementType, CategoryConfig, Transaction, UploadedBy } from "../types";
import { getCategoryColorFromConfig } from "../engine/categories";
import TransactionActionModal from "./TransactionActionModal";
import type { RecategorizePayload, RenamePayload, IgnorePayload } from "./TransactionActionModal";
import TransactionFilters, {
  EMPTY_FILTERS,
  filtersActive,
  matchesFilters,
  collectOwners,
} from "./TransactionFilters";
import type { FilterState } from "./TransactionFilters";

interface Props {
  categories: CategorySummary[];
  statementType: StatementType;
  catConfig?: CategoryConfig | null;
  onRecategorize?: (payload: RecategorizePayload) => void;
  onRename?: (payload: RenamePayload) => void;
  onIgnore?: (payload: IgnorePayload) => void;
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

function UploaderAvatar({ uploadedBy }: { uploadedBy?: UploadedBy }) {
  if (!uploadedBy) return null;
  return (
    <div className="h-5 w-5 shrink-0" style={{ minWidth: 20, minHeight: 20 }}>
      <img
        src={uploadedBy.picture}
        alt={uploadedBy.name}
        title={uploadedBy.name}
        className="h-5 w-5 rounded-full border border-gray-200 object-cover"
        style={{ aspectRatio: "1 / 1" }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

interface ModalTarget {
  transaction: Transaction;
  globalIndex: number;
  category: string;
}

export default function TransactionTable({
  categories,
  statementType,
  catConfig,
  onRecategorize,
  onRename,
  onIgnore,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const showSource = statementType === "family";
  const hasActions = !!(onRecategorize || onRename || onIgnore);

  const allTransactions = useMemo(
    () => categories.flatMap((c) => c.transactions),
    [categories],
  );
  const owners = useMemo(() => collectOwners(allTransactions), [allTransactions]);

  const isFiltering = filtersActive(filters);

  const filteredCategories = useMemo(() => {
    if (!isFiltering) return categories;
    return categories
      .map((cat) => {
        const txs = cat.transactions.filter((t) => matchesFilters(t, filters));
        return {
          ...cat,
          transactions: txs,
          count: txs.length,
          total: txs.reduce((sum, t) => sum + t.amount, 0),
        };
      })
      .filter((cat) => cat.transactions.length > 0);
  }, [categories, filters, isFiltering]);

  const hasAvatars = filteredCategories.some((c) =>
    c.transactions.some((t) => t.uploadedBy?.picture),
  );

  const visibleCategoryNames = categories.map((c) => c.category);
  const configCategoryNames = catConfig
    ? Object.keys(catConfig.categories)
    : [];
  const allCategoryNames = Array.from(
    new Set([...visibleCategoryNames, ...configCategoryNames]),
  );

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (categories.length === 0) return null;

  return (
    <>
      <TransactionFilters
        filters={filters}
        onChange={setFilters}
        owners={owners}
      />

      {isFiltering && filteredCategories.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          Nenhuma transação encontrada com os filtros selecionados.
        </p>
      )}

      <div className="space-y-2">
        {filteredCategories.map(({ category, total, count, transactions }) => {
          const isOpen = expanded.has(category);
          const color = getCategoryColorFromConfig(category, catConfig ?? null);

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
                <div className="overflow-x-auto border-t border-gray-100">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {hasAvatars && <th className="w-8 min-w-[36px] px-2 py-2" />}
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
                        {hasActions && <th className="w-8 px-2 py-2" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((t, txIdx) => {
                        const globalIdx = t._originalIndex ?? txIdx;

                        return (
                          <tr key={txIdx} className="hover:bg-gray-50">
                            {hasAvatars && (
                              <td className="px-2 py-2">
                                <UploaderAvatar uploadedBy={t.uploadedBy} />
                              </td>
                            )}
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
                            {hasActions && (
                              <td className="px-2 py-2">
                                <button
                                  onClick={() =>
                                    setModalTarget({
                                      transaction: t,
                                      globalIndex: globalIdx,
                                      category,
                                    })
                                  }
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                  title="Ações"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalTarget && onRecategorize && onRename && onIgnore && (
        <TransactionActionModal
          transaction={modalTarget.transaction}
          globalIndex={modalTarget.globalIndex}
          currentCategory={modalTarget.category}
          allCategories={allCategoryNames}
          catConfig={catConfig ?? null}
          onRecategorize={(payload) => {
            setModalTarget(null);
            onRecategorize(payload);
          }}
          onRename={(payload) => {
            setModalTarget(null);
            onRename(payload);
          }}
          onIgnore={(payload) => {
            setModalTarget(null);
            onIgnore(payload);
          }}
          onClose={() => setModalTarget(null)}
        />
      )}
    </>
  );
}
