import type { StatementType } from "../types";

interface Props {
  active: StatementType;
  onChange: (tab: StatementType) => void;
  counts: Record<StatementType, number>;
}

const tabs: { key: StatementType; label: string }[] = [
  { key: "bank", label: "Extrato Bancário" },
  { key: "card", label: "Fatura Cartão" },
  { key: "family", label: "Gasto Familiar" },
];

export default function TabBar({ active, onChange, counts }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all
            ${
              active === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          {label}
          {counts[key] > 0 && (
            <span
              className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                active === key
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-gray-200 text-gray-500"
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
