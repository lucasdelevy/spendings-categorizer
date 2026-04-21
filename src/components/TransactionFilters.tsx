import { useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function TransactionFilters({
  filters,
  onChange,
  owners,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = filtersActive(filters);

  const patch = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const toggleOwner = (userId: string) => {
    const next = new Set(filters.selectedOwners);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    patch({ selectedOwners: next });
  };

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          active
            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {t("filters.title")}
        {active && (
          <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {countActive(filters)}
          </span>
        )}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
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
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap gap-6">
            <div className="min-w-[180px] flex-1">
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

            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("filters.date")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateStart}
                  onChange={(e) => patch({ dateStart: e.target.value })}
                  className={inputClass}
                />
                <span className="text-gray-400">—</span>
                <input
                  type="date"
                  value={filters.dateEnd}
                  onChange={(e) => patch({ dateEnd: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {owners.length > 1 && (
              <div className="min-w-[180px] flex-1">
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
                onClick={() => onChange(EMPTY_FILTERS)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t("filters.clear")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function countActive(f: FilterState): number {
  let n = 0;
  if (f.amountMin !== "" || f.amountMax !== "") n++;
  if (f.dateStart !== "" || f.dateEnd !== "") n++;
  if (f.selectedOwners.size > 0) n++;
  return n;
}
