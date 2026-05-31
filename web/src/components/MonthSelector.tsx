import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatYearMonth } from "../utils";

interface Props {
  months: string[];
  selected: string;
  onChange: (ym: string) => void;
  allowNew?: boolean;
  loading?: boolean;
}

export default function MonthSelector({ months, selected, onChange, allowNew, loading }: Props) {
  const { t } = useTranslation();

  const idx = months.indexOf(selected);
  const isNewMonth = allowNew && idx === -1;
  const hasPrev = !isNewMonth && idx < months.length - 1;
  const hasNext = !isNewMonth ? idx > 0 : true;

  const goPrev = useCallback(() => {
    if (isNewMonth) return;
    if (idx < months.length - 1) onChange(months[idx + 1]);
  }, [months, idx, onChange, isNewMonth]);

  const goNext = useCallback(() => {
    if (isNewMonth) {
      onChange(months[0]);
      return;
    }
    if (idx > 0) onChange(months[idx - 1]);
  }, [months, idx, onChange, isNewMonth]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowLeft" && hasPrev) { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight" && hasNext) { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, hasPrev, hasNext]);

  const label = formatYearMonth(selected);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label="Previous month"
          className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-0 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex min-w-[10rem] flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {label}
          </h2>
          {isNewMonth && (
            <span className="mt-0.5 text-xs font-medium text-indigo-500 dark:text-indigo-400">
              {t("month.new")}
            </span>
          )}
          {loading && (
            <div className="mt-1.5 h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          )}
        </div>

        <button
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Next month"
          className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-0 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {months.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5">
          {months.map((ym) => (
            <button
              key={ym}
              onClick={() => onChange(ym)}
              aria-label={formatYearMonth(ym)}
              className={`h-1.5 rounded-full transition-all ${
                ym === selected
                  ? "w-4 bg-indigo-500 dark:bg-indigo-400"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
