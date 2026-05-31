import type { StatementType } from "../types";

interface Props {
  active: StatementType;
  onChange: (tab: StatementType) => void;
  counts: Record<StatementType, number>;
}

const tabs: { key: StatementType; label: string }[] = [
  { key: "family", label: "Gasto Familiar" },
  { key: "bank", label: "Extrato Bancário" },
  { key: "card", label: "Fatura Cartão" },
];

export default function TabBar({ active, onChange, counts }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all
            ${
              active === key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }
          `}
        >
          {label}
          {counts[key] > 0 && (
            <span
              className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                active === key
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
