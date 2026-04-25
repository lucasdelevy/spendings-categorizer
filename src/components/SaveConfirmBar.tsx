import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";
import { extractYearMonth, formatYearMonth } from "../utils";
import { parseCSV } from "../engine/csvParser";
import { processBankCSV } from "../engine/bankCategorizer";
import { processCardCSV } from "../engine/cardCategorizer";
import { toEngineConfig } from "../engine/categories";
import type { StatementResult, CategoryConfig, Account } from "../types";
import type { DetectedFile } from "./FamilyUploader";

interface Props {
  result: StatementResult;
  files: DetectedFile[];
  catConfig: CategoryConfig | null;
  accounts: Account[];
  onSaved: (yearMonth: string) => void;
}

export default function SaveConfirmBar({ result, files, catConfig, accounts, onSaved }: Props) {
  const { t } = useTranslation();
  const detected = detectMonth(result);
  const [yearMonth, setYearMonth] = useState(detected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountByFile, setAccountByFile] = useState<Record<string, string>>({});

  const fileEntries = useMemo(
    () =>
      files.map((f) => ({
        file: f,
        key: `${f.type}::${f.name}`,
        candidates: accounts.filter((a) => a.type === f.type),
      })),
    [files, accounts],
  );

  useEffect(() => {
    setAccountByFile((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { key, candidates } of fileEntries) {
        if (next[key]) continue;
        if (candidates.length === 1) {
          next[key] = candidates[0].accountId;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [fileEntries]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const engineConfig = catConfig ? toEngineConfig(catConfig) : undefined;

      const saves = files.map((f) => {
        const parsed = parseCSV(f.text);
        const fileResult = f.type === "bank"
          ? processBankCSV(parsed.headers, parsed.rows, engineConfig)
          : processCardCSV(parsed.headers, parsed.rows, engineConfig);

        const key = `${f.type}::${f.name}`;
        const accountId = accountByFile[key] || undefined;

        return api.post("/statements", {
          yearMonth,
          type: f.type,
          fileName: f.name,
          accountId,
          summary: {
            type: f.type,
            totalIn: fileResult.totalIn,
            totalOut: fileResult.totalOut,
            balance: fileResult.balance,
            categories: fileResult.categories.map((c) => ({
              category: c.category,
              total: c.total,
              count: c.count,
            })),
          },
          transactions: fileResult.transactions.map((tx) => ({
            ...tx,
            ...(accountId ? { accountId } : {}),
          })),
        });
      });

      await Promise.all(saves);
      onSaved(yearMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.save"));
    } finally {
      setSaving(false);
    }
  };

  const showAccountPickers = accounts.length > 0;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{t("save.detectedMonth")}</span>
        <input
          type="month"
          value={`${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`}
          onChange={(e) => {
            const val = e.target.value.replace("-", "");
            if (/^\d{6}$/.test(val)) setYearMonth(val);
          }}
          className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-200"
        />
        <span className="text-sm text-indigo-600 dark:text-indigo-400">{formatYearMonth(yearMonth)}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? t("save.saving") : t("save.save")}
        </button>
      </div>
      <div className="mt-3 space-y-2 border-t border-indigo-200 pt-3 dark:border-indigo-800">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80">
            {t("save.assignAccounts")}
          </p>
          {!showAccountPickers && (
            <p className="text-[11px] italic text-indigo-700/60 dark:text-indigo-300/60">
              {t("save.noAccountsHint")}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          {fileEntries.map(({ file, key, candidates }, idx) => (
            <div key={`${key}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-indigo-900 dark:text-indigo-200">
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    file.type === "bank"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}
                >
                  {t(`accounts.type.${file.type}`)}
                </span>
                <span className="truncate">{file.name}</span>
              </span>
              {candidates.length === 0 ? (
                <span className="shrink-0 text-[11px] italic text-indigo-700/60 dark:text-indigo-300/60">
                  {t("save.noMatchingAccount", { type: t(`accounts.type.${file.type}`).toLowerCase() })}
                </span>
              ) : (
                <select
                  value={accountByFile[key] || ""}
                  onChange={(e) =>
                    setAccountByFile((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="shrink-0 rounded-lg border border-indigo-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">{t("save.noAccount")}</option>
                  {candidates.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.name}
                      {a.type === "card" && a.closingDay
                        ? ` (${t("save.closingDayShort", { day: a.closingDay })})`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
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
