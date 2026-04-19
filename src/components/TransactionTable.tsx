import { useState, useRef, useEffect } from "react";
import type { CategorySummary, StatementType, CategoryConfig, UploadedBy } from "../types";
import { getCategoryColorFromConfig } from "../engine/categories";

interface Props {
  categories: CategorySummary[];
  statementType: StatementType;
  catConfig?: CategoryConfig | null;
  onRecategorize?: (globalIndex: number, newCategory: string, keyword: string) => void;
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

function CategoryPicker({
  allCategories,
  currentCategory,
  onPick,
  onClose,
  catConfig,
}: {
  allCategories: string[];
  currentCategory: string;
  onPick: (category: string) => void;
  onClose: () => void;
  catConfig?: CategoryConfig | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      {allCategories
        .filter((c) => c !== currentCategory)
        .map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getCategoryColorFromConfig(c, catConfig ?? null) }}
            />
            {c}
          </button>
        ))}
    </div>
  );
}

export default function TransactionTable({
  categories,
  statementType,
  catConfig,
  onRecategorize,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pickerTarget, setPickerTarget] = useState<{
    catIndex: number;
    txIndex: number;
    globalIndex: number;
  } | null>(null);
  const showSource = statementType === "family";
  const hasAvatars = categories.some((c) =>
    c.transactions.some((t) => t.uploadedBy?.picture),
  );

  const allCategoryNames = categories.map((c) => c.category);

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (categories.length === 0) return null;

  let runningGlobalIndex = 0;
  const globalIndexOffset: number[] = [];
  for (const cat of categories) {
    globalIndexOffset.push(runningGlobalIndex);
    runningGlobalIndex += cat.transactions.length;
  }

  return (
    <div className="space-y-2">
      {categories.map(({ category, total, count, transactions }, catIdx) => {
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
                      {onRecategorize && <th className="w-8 px-2 py-2" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((t, txIdx) => {
                      const globalIdx = globalIndexOffset[catIdx] + txIdx;
                      const isPickerOpen =
                        pickerTarget?.catIndex === catIdx &&
                        pickerTarget?.txIndex === txIdx;

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
                          {onRecategorize && (
                            <td className="relative px-2 py-2">
                              <button
                                onClick={() =>
                                  setPickerTarget(
                                    isPickerOpen
                                      ? null
                                      : { catIndex: catIdx, txIndex: txIdx, globalIndex: globalIdx },
                                  )
                                }
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                title="Recategorizar"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </button>
                              {isPickerOpen && (
                                <CategoryPicker
                                  allCategories={allCategoryNames}
                                  currentCategory={category}
                                  catConfig={catConfig}
                                  onPick={(newCat) => {
                                    setPickerTarget(null);
                                    onRecategorize(globalIdx, newCat, t.originalDescription.toLowerCase());
                                  }}
                                  onClose={() => setPickerTarget(null)}
                                />
                              )}
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
  );
}
