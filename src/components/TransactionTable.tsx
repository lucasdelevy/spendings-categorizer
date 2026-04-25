import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CategorySummary, StatementType, CategoryConfig, Transaction, TransactionOrigin, UploadedBy, Account } from "../types";
import { getCategoryColorFromConfig } from "../engine/categories";
import { formatBRL, resolveLocale } from "../i18n";
import { limitProgress, limitColor, effectiveMonthlyLimit } from "../utils/limits";
import { compareDatesDesc } from "../utils/dates";
import TransactionActionModal from "./TransactionActionModal";
import type { RecategorizePayload, RenamePayload, IgnorePayload } from "./TransactionActionModal";
import TransactionFilters, {
  EMPTY_FILTERS,
  filtersActive,
  matchesFilters,
  collectOwners,
} from "./TransactionFilters";
import type { FilterState } from "./TransactionFilters";

export interface HidePayload {
  globalIndex: number;
}

export type TransactionTableMode = "byCategory" | "all";

interface Props {
  categories: CategorySummary[];
  statementType: StatementType;
  catConfig?: CategoryConfig | null;
  yearMonth?: string;
  mode?: TransactionTableMode;
  accounts?: Account[];
  onRecategorize?: (payload: RecategorizePayload) => void;
  onRename?: (payload: RenamePayload) => void;
  onIgnore?: (payload: IgnorePayload) => void;
  onHide?: (payload: HidePayload) => void;
}

function formatDate(raw: string): string {
  let date: Date;
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    return raw;
  }
  return date.toLocaleDateString(resolveLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SourceBadge({ source, label }: { source?: "bank" | "card"; label: string }) {
  if (!source) return null;
  const isBank = source === "bank";
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
        isBank
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
      }`}
    >
      {label}
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
        className="h-5 w-5 rounded-full border border-gray-200 object-cover dark:border-gray-600"
        style={{ aspectRatio: "1 / 1" }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function OriginLabel({ origin }: { origin?: TransactionOrigin }) {
  const label = origin === "openfinance" ? "API" : "CSV";
  return (
    <span className="select-none text-[10px] font-medium uppercase leading-none text-gray-400/40 dark:text-gray-500/40">
      {label}
    </span>
  );
}

interface ModalTarget {
  transaction: Transaction;
  globalIndex: number;
  category: string;
}

interface RowProps {
  tx: Transaction;
  globalIdx: number;
  category: string;
  showSource: boolean;
  showCategoryCell: boolean;
  showInstallmentCell: boolean;
  hasAvatars: boolean;
  hasActions: boolean;
  catConfig?: CategoryConfig | null;
  accountNameMap?: Map<string, string>;
  onHide?: (payload: HidePayload) => void;
  onOpenModal: (target: ModalTarget) => void;
}

function TransactionRow({
  tx,
  globalIdx,
  category,
  showSource,
  showCategoryCell,
  showInstallmentCell,
  hasAvatars,
  hasActions,
  catConfig,
  accountNameMap,
  onHide,
  onOpenModal,
}: RowProps) {
  const { t } = useTranslation();
  const isHidden = !!tx.hidden;
  const categoryColor = getCategoryColorFromConfig(category, catConfig ?? null);

  return (
    <tr className={`${isHidden ? "opacity-40" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
      {hasAvatars && (
        <td className="px-2 py-2">
          <UploaderAvatar uploadedBy={tx.uploadedBy} />
        </td>
      )}
      <td className="whitespace-nowrap px-4 py-2 text-gray-500 dark:text-gray-400">
        {formatDate(tx.date)}
      </td>
      {showSource && (
        <td className="px-4 py-2">
          <SourceBadge
            source={tx.source}
            label={tx.source === "bank" ? t("table.bank") : t("table.card")}
          />
        </td>
      )}
      <td
        className={`max-w-xs truncate px-4 py-2 ${isHidden ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}
        title={tx.originalDescription}
      >
        <div className="flex items-center gap-2">
          <span className="truncate">{tx.payee}</span>
          {tx.accountId && accountNameMap?.get(tx.accountId) && (
            <span
              className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              title={accountNameMap.get(tx.accountId)}
            >
              {accountNameMap.get(tx.accountId)}
            </span>
          )}
        </div>
      </td>
      {showCategoryCell && (
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="truncate">{category}</span>
          </span>
        </td>
      )}
      {showInstallmentCell && (
        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
          {tx.installment || "—"}
        </td>
      )}
      <td
        className={`whitespace-nowrap px-4 py-2 text-right tabular-nums ${isHidden ? "line-through text-gray-400 dark:text-gray-500" : tx.amount >= 0 ? "text-green-600" : "text-gray-800 dark:text-gray-200"}`}
      >
        {formatBRL(tx.amount)}
      </td>
      {(hasActions || onHide) && (
        <td className="px-2 py-2">
          <div className="flex items-center gap-0.5">
            <OriginLabel origin={tx.origin} />
            {onHide && (
              <button
                onClick={() => onHide({ globalIndex: globalIdx })}
                className={`rounded p-1 transition ${isHidden ? "text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600"}`}
                title={isHidden ? t("table.unhide") : t("table.hide")}
              >
                {isHidden ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            )}
            {hasActions && !isHidden && (
              <button
                onClick={() =>
                  onOpenModal({
                    transaction: tx,
                    globalIndex: globalIdx,
                    category,
                  })
                }
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-600"
                title={t("table.actions")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

interface HeaderRowProps {
  statementType: StatementType;
  showSource: boolean;
  showCategoryCell: boolean;
  showInstallmentCell: boolean;
  hasAvatars: boolean;
  hasActionsCell: boolean;
}

function TableHeaderRow({
  statementType,
  showSource,
  showCategoryCell,
  showInstallmentCell,
  hasAvatars,
  hasActionsCell,
}: HeaderRowProps) {
  const { t } = useTranslation();
  return (
    <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
      {hasAvatars && <th className="w-8 min-w-[36px] px-2 py-2" />}
      <th className="px-4 py-2">{t("table.date")}</th>
      {showSource && <th className="px-4 py-2">{t("table.source")}</th>}
      <th className="px-4 py-2">
        {statementType === "bank" ? t("table.payee") : t("table.merchant")}
      </th>
      {showCategoryCell && <th className="px-4 py-2">{t("table.category")}</th>}
      {showInstallmentCell && <th className="px-4 py-2">{t("table.installment")}</th>}
      <th className="px-4 py-2 text-right">{t("table.amount")}</th>
      {hasActionsCell && <th className="w-8 px-2 py-2" />}
    </tr>
  );
}

export default function TransactionTable({
  categories,
  statementType,
  catConfig,
  yearMonth,
  mode = "byCategory",
  accounts,
  onRecategorize,
  onRename,
  onIgnore,
  onHide,
}: Props) {
  const { t } = useTranslation();
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
    const base = isFiltering
      ? categories
          .map((cat) => {
            const txs = cat.transactions.filter((t) => matchesFilters(t, filters));
            return { ...cat, transactions: txs, count: txs.length };
          })
          .filter((cat) => cat.transactions.length > 0)
      : categories;

    return base.map((cat) => ({
      ...cat,
      total: cat.transactions.reduce(
        (sum, t) => (t.hidden ? sum : sum + t.amount),
        0,
      ),
      count: cat.transactions.filter((t) => !t.hidden).length,
    }));
  }, [categories, filters, isFiltering]);

  const hasAvatars = filteredCategories.some((c) =>
    c.transactions.some((t) => t.uploadedBy?.picture),
  );

  const showInstallmentCell = statementType === "card" || statementType === "family";
  const hasActionsCell = hasActions || !!onHide;

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts ?? []) map.set(a.accountId, a.name);
    return map;
  }, [accounts]);

  const flatRows = useMemo(() => {
    if (mode !== "all") return [];
    const rows: { tx: Transaction; category: string; globalIndex: number }[] = [];
    for (const cat of filteredCategories) {
      for (const tx of cat.transactions) {
        rows.push({
          tx,
          category: cat.category,
          globalIndex: tx._originalIndex ?? rows.length,
        });
      }
    }
    rows.sort((a, b) => compareDatesDesc(a.tx.date, b.tx.date));
    return rows;
  }, [mode, filteredCategories]);

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

      {((mode === "byCategory" && isFiltering && filteredCategories.length === 0) ||
        (mode === "all" && flatRows.length === 0)) && (
        <p className="py-6 text-center text-sm text-gray-400">
          {t("table.noResults")}
        </p>
      )}

      {mode === "all" && flatRows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <TableHeaderRow
                  statementType={statementType}
                  showSource={showSource}
                  showCategoryCell={true}
                  showInstallmentCell={showInstallmentCell}
                  hasAvatars={hasAvatars}
                  hasActionsCell={hasActionsCell}
                />
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {flatRows.map(({ tx, category, globalIndex }, idx) => (
                  <TransactionRow
                    key={`${globalIndex}-${idx}`}
                    tx={tx}
                    globalIdx={globalIndex}
                    category={category}
                    showSource={showSource}
                    showCategoryCell={true}
                    showInstallmentCell={showInstallmentCell}
                    hasAvatars={hasAvatars}
                    hasActions={hasActions}
                    catConfig={catConfig}
                    accountNameMap={accountNameMap}
                    onHide={onHide}
                    onOpenModal={setModalTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === "byCategory" && (
      <div className="space-y-2">
        {filteredCategories.map(({ category, total, count, transactions }) => {
          const isOpen = expanded.has(category);
          const color = getCategoryColorFromConfig(category, catConfig ?? null);
          const hiddenCount = transactions.filter((t) => t.hidden).length;
          const catLimit = catConfig?.categories[category]?.limit;
          const hasLimit = !!(catLimit && catLimit.amount > 0 && yearMonth);
          const progress = hasLimit ? limitProgress(total, catLimit, yearMonth!) : 0;
          const progressClamp = Math.min(progress, 1);
          const progressColor = hasLimit ? limitColor(progress) : "green";
          const monthlyBudget = hasLimit ? effectiveMonthlyLimit(catLimit, yearMonth!) : 0;

          return (
            <div
              key={category}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                onClick={() => toggle(category)}
                className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{category}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {count}x
                    </span>
                    {hiddenCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                        {hiddenCount}
                      </span>
                    )}
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
                </div>
                {hasLimit && (
                  <div className="mt-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progressColor === "red"
                              ? "bg-red-500"
                              : progressColor === "amber"
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${progressClamp * 100}%` }}
                        />
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-medium tabular-nums ${
                          progressColor === "red"
                            ? "text-red-600 dark:text-red-400"
                            : progressColor === "amber"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatBRL(Math.abs(total))} {t("limits.ofLimit", { limit: formatBRL(monthlyBudget) })}
                        {progress >= 1 ? ` — ${t("limits.exceeded")}` : ` (${Math.round(progress * 100)}%)`}
                      </span>
                    </div>
                  </div>
                )}
              </button>

              {isOpen && (
                <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <TableHeaderRow
                        statementType={statementType}
                        showSource={showSource}
                        showCategoryCell={false}
                        showInstallmentCell={showInstallmentCell}
                        hasAvatars={hasAvatars}
                        hasActionsCell={hasActionsCell}
                      />
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {transactions.map((tx, txIdx) => (
                        <TransactionRow
                          key={txIdx}
                          tx={tx}
                          globalIdx={tx._originalIndex ?? txIdx}
                          category={category}
                          showSource={showSource}
                          showCategoryCell={false}
                          showInstallmentCell={showInstallmentCell}
                          hasAvatars={hasAvatars}
                          hasActions={hasActions}
                          catConfig={catConfig}
                          accountNameMap={accountNameMap}
                          onHide={onHide}
                          onOpenModal={setModalTarget}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

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
