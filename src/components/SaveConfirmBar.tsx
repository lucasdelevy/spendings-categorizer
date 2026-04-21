import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";
import { extractYearMonth, formatYearMonth } from "../utils";
import { parseCSV } from "../engine/csvParser";
import { processBankCSV } from "../engine/bankCategorizer";
import { processCardCSV } from "../engine/cardCategorizer";
import { toEngineConfig } from "../engine/categories";
import type { StatementResult, CategoryConfig } from "../types";
import type { DetectedFile } from "./FamilyUploader";

interface Props {
  result: StatementResult;
  files: DetectedFile[];
  catConfig: CategoryConfig | null;
  onSaved: (yearMonth: string) => void;
}

export default function SaveConfirmBar({ result, files, catConfig, onSaved }: Props) {
  const { t } = useTranslation();
  const detected = detectMonth(result);
  const [yearMonth, setYearMonth] = useState(detected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        return api.post("/statements", {
          yearMonth,
          type: f.type,
          fileName: f.name,
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
          transactions: fileResult.transactions,
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

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
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
