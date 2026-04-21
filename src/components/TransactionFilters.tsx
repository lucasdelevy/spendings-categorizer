import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { resolveLocale } from "../i18n";
import type { Transaction } from "../types";

export interface FilterState {
  amountMin: string;
  amountMax: string;
  dateStart: string;
  dateEnd: string;
  selectedOwners: Set<string>;
}

export const EMPTY_FILTERS: FilterState = {
  amountMin: "",
  amountMax: "",
  dateStart: "",
  dateEnd: "",
  selectedOwners: new Set(),
};

interface OwnerOption {
  userId: string;
  name: string;
  picture: string;
}

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  owners: OwnerOption[];
}

export function filtersActive(f: FilterState): boolean {
  return (
    f.amountMin !== "" ||
    f.amountMax !== "" ||
    f.dateStart !== "" ||
    f.dateEnd !== "" ||
    f.selectedOwners.size > 0
  );
}

export function parseDateToNum(raw: string): number | null {
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    const n = Number(y) * 10000 + Number(m) * 100 + Number(d);
    return Number.isNaN(n) ? null : n;
  }
  if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    const n = Number(y) * 10000 + Number(m) * 100 + Number(d);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function matchesFilters(t: Transaction, f: FilterState): boolean {
  const absAmount = Math.abs(t.amount);

  if (f.amountMin !== "") {
    const min = parseFloat(f.amountMin);
    if (!Number.isNaN(min) && absAmount < min) return false;
  }
  if (f.amountMax !== "") {
    const max = parseFloat(f.amountMax);
    if (!Number.isNaN(max) && absAmount > max) return false;
  }

  if (f.dateStart !== "" || f.dateEnd !== "") {
    const dn = parseDateToNum(t.date);
    if (dn !== null) {
      if (f.dateStart !== "") {
        const start = parseDateToNum(f.dateStart);
        if (start !== null && dn < start) return false;
      }
      if (f.dateEnd !== "") {
        const end = parseDateToNum(f.dateEnd);
        if (end !== null && dn > end) return false;
      }
    }
  }

  if (f.selectedOwners.size > 0) {
    const ownerId = t.uploadedBy?.userId ?? "__none__";
    if (!f.selectedOwners.has(ownerId)) return false;
  }

  return true;
}

export function collectOwners(transactions: Transaction[]): OwnerOption[] {
  const seen = new Map<string, OwnerOption>();
  for (const t of transactions) {
    if (t.uploadedBy && !seen.has(t.uploadedBy.userId)) {
      seen.set(t.uploadedBy.userId, {
        userId: t.uploadedBy.userId,
        name: t.uploadedBy.name,
        picture: t.uploadedBy.picture,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500";

const DATE_PRESETS = [1, 2, 3, 5] as const;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getActivePreset(dateStart: string, dateEnd: string): number | null {
  if (!dateStart || !dateEnd) return null;
  const today = isoDate(new Date());
  if (dateEnd !== today) return null;
  for (const n of DATE_PRESETS) {
    const start = new Date();
    start.setDate(start.getDate() - (n - 1));
    if (dateStart === isoDate(start)) return n;
  }
  return null;
}

const pillBase = "rounded-full border px-2.5 py-1 text-xs font-medium transition";
const pillActive =
  "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300";
const pillInactive =
  "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700";

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DateRangeCalendar({
  dateStart,
  dateEnd,
  onSelect,
}: {
  dateStart: string;
  dateEnd: string;
  onSelect: (start: string, end: string) => void;
}) {
  const locale = resolveLocale();
  const today = new Date();
  const initial = dateStart
    ? new Date(dateStart + "T00:00:00")
    : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [picking, setPicking] = useState<"start" | "end">(
    dateStart && !dateEnd ? "end" : "start",
  );

  const cells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const dayHeaders = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "narrow" });
    });
  }, [locale]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleClick = (day: number) => {
    const clicked = isoDate(new Date(viewYear, viewMonth, day));
    if (picking === "start") {
      onSelect(clicked, "");
      setPicking("end");
    } else {
      if (clicked < dateStart) {
        onSelect(clicked, "");
        setPicking("end");
      } else {
        onSelect(dateStart, clicked);
        setPicking("start");
      }
    }
  };

  const todayStr = isoDate(today);

  return (
    <div className="mt-2 w-full max-w-[280px]">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {dayHeaders.map((h, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500"
          >
            {h}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e${i}`} className="h-7" />;
          }

          const cellDate = isoDate(new Date(viewYear, viewMonth, day));
          const isStart = cellDate === dateStart;
          const isEnd = cellDate === dateEnd;
          const inRange =
            dateStart && dateEnd && cellDate > dateStart && cellDate < dateEnd;
          const isToday = cellDate === todayStr;

          let bg = "";
          if (isStart || isEnd) {
            bg = "bg-indigo-600 text-white";
          } else if (inRange) {
            bg = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";
          }

          const roundL = isStart || (inRange && i % 7 === 0) ? "rounded-l-full" : "";
          const roundR = isEnd || (inRange && i % 7 === 6) ? "rounded-r-full" : "";

          return (
            <button
              key={`d${day}`}
              onClick={() => handleClick(day)}
              className={`flex h-7 items-center justify-center text-xs transition
                ${bg || "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}
                ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}
                ${roundL} ${roundR}
                ${isToday && !isStart && !isEnd && !inRange ? "font-bold text-indigo-600 dark:text-indigo-400" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {(dateStart || dateEnd) && (
        <div className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
          {dateStart && new Date(dateStart + "T00:00:00").toLocaleDateString(locale, { day: "2-digit", month: "short" })}
          {dateStart && dateEnd && " — "}
          {dateEnd && new Date(dateEnd + "T00:00:00").toLocaleDateString(locale, { day: "2-digit", month: "short" })}
          {dateStart && !dateEnd && ` — ${picking === "end" ? "…" : ""}`}
        </div>
      )}
    </div>
  );
}

export default function TransactionFilters({
  filters,
  onChange,
  owners,
}: Props) {
  const { t } = useTranslation();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const active = filtersActive(filters);

  const patch = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const toggleOwner = (userId: string) => {
    const next = new Set(filters.selectedOwners);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    patch({ selectedOwners: next });
  };

  const activePreset = getActivePreset(filters.dateStart, filters.dateEnd);
  const hasCustomRange =
    (filters.dateStart !== "" || filters.dateEnd !== "") && activePreset === null;

  return (
    <div className="mb-3">
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("filters.amount")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t("filters.min")}
                  value={filters.amountMin}
                  onChange={(e) => patch({ amountMin: e.target.value })}
                  className={inputClass}
                  min={0}
                  step="0.01"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder={t("filters.max")}
                  value={filters.amountMax}
                  onChange={(e) => patch({ amountMax: e.target.value })}
                  className={inputClass}
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("filters.date")}
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {DATE_PRESETS.map((n) => {
                  const isActive = activePreset === n;
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        if (isActive) {
                          patch({ dateStart: "", dateEnd: "" });
                          setShowCustomDate(false);
                        } else {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - (n - 1));
                          patch({ dateStart: isoDate(start), dateEnd: isoDate(end) });
                          setShowCustomDate(false);
                        }
                      }}
                      className={`${pillBase} ${isActive ? pillActive : pillInactive}`}
                    >
                      {n}d
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowCustomDate((v) => !v)}
                  className={`${pillBase} ${showCustomDate || hasCustomRange ? pillActive : pillInactive}`}
                >
                  {t("filters.custom")}
                </button>
              </div>
              {showCustomDate && (
                <DateRangeCalendar
                  dateStart={filters.dateStart}
                  dateEnd={filters.dateEnd}
                  onSelect={(start, end) => patch({ dateStart: start, dateEnd: end })}
                />
              )}
            </div>

            {owners.length > 0 && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("filters.member")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {owners.map((o) => {
                    const selected =
                      filters.selectedOwners.size === 0 ||
                      filters.selectedOwners.has(o.userId);
                    return (
                      <button
                        key={o.userId}
                        onClick={() => toggleOwner(o.userId)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          selected
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-600 dark:bg-gray-800"
                        }`}
                      >
                        {o.picture && (
                          <img
                            src={o.picture}
                            alt={o.name}
                            className="h-4 w-4 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {o.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {active && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <button
                onClick={() => {
                  onChange(EMPTY_FILTERS);
                  setShowCustomDate(false);
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t("filters.clear")}
              </button>
            </div>
          )}
        </div>
    </div>
  );
}

