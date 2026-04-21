import { useTranslation } from "react-i18next";
import type { StatementType } from "../types";
import { formatBRL } from "../i18n";

interface Props {
  type: StatementType;
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
  hiddenCount: number;
}

export default function SummaryBar({
  type,
  totalIn,
  totalOut,
  balance,
  transactionCount,
  hiddenCount,
}: Props) {
  const { t } = useTranslation();

  if (type === "card") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card
          label={t("summary.totalExpenses")}
          value={formatBRL(totalOut)}
          color="text-red-600"
        />
        <Card
          label={t("summary.credits")}
          value={formatBRL(totalIn)}
          color="text-green-600"
        />
        <Card
          label={t("summary.totalBill")}
          value={formatBRL(balance)}
          color="text-gray-900"
          badge={t("summary.transactionsCount", { count: transactionCount })}
        />
        {hiddenCount > 0 && (
          <Card
            label={t("summary.hidden")}
            value={String(hiddenCount)}
            color="text-gray-400"
          />
        )}
      </div>
    );
  }

  const cols = hiddenCount > 0 ? "grid-cols-2 gap-3 sm:grid-cols-5" : "grid-cols-2 gap-3 sm:grid-cols-4";

  return (
    <div className={`grid ${cols}`}>
      <Card
        label={t("summary.income")}
        value={formatBRL(totalIn)}
        color="text-green-600"
      />
      <Card
        label={t("summary.expenses")}
        value={formatBRL(totalOut)}
        color="text-red-600"
      />
      <Card
        label={t("summary.balance")}
        value={formatBRL(balance)}
        color={balance >= 0 ? "text-green-600" : "text-red-600"}
      />
      <Card
        label={t("summary.transactions")}
        value={String(transactionCount)}
        color="text-gray-900"
      />
      {hiddenCount > 0 && (
        <Card
          label={t("summary.hidden")}
          value={String(hiddenCount)}
          color="text-gray-400"
        />
      )}
    </div>
  );
}

function Card({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color: string;
  badge?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${color} ${color === "text-gray-900" ? "dark:text-gray-100" : ""}`}>
        {value}
      </p>
      {badge && <p className="mt-0.5 text-xs text-gray-400">{badge}</p>}
    </div>
  );
}
