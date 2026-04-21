import { useTranslation } from "react-i18next";
import { formatYearMonth } from "../utils";

interface Props {
  months: string[];
  selected: string;
  onChange: (ym: string) => void;
  allowNew?: boolean;
}

export default function MonthSelector({ months, selected, onChange, allowNew }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
      >
        {months.map((ym) => (
          <option key={ym} value={ym}>
            {formatYearMonth(ym)}
          </option>
        ))}
        {allowNew && !months.includes(selected) && (
          <option value={selected}>{formatYearMonth(selected)} {t("month.new")}</option>
        )}
      </select>
    </div>
  );
}
