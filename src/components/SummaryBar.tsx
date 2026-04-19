import type { StatementType } from "../types";

interface Props {
  type: StatementType;
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function SummaryBar({
  type,
  totalIn,
  totalOut,
  balance,
  transactionCount,
}: Props) {
  if (type === "card") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card
          label="Total Gastos"
          value={formatBRL(totalIn)}
          color="text-red-600"
        />
        <Card
          label="Créditos"
          value={formatBRL(totalOut)}
          color="text-green-600"
        />
        <Card
          label="Total Fatura"
          value={formatBRL(balance)}
          color="text-gray-900"
          badge={`${transactionCount} transações`}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card
        label="Entradas"
        value={formatBRL(totalIn)}
        color="text-green-600"
      />
      <Card
        label="Saídas"
        value={formatBRL(totalOut)}
        color="text-red-600"
      />
      <Card
        label="Saldo"
        value={formatBRL(balance)}
        color={balance >= 0 ? "text-green-600" : "text-red-600"}
      />
      <Card
        label="Transações"
        value={String(transactionCount)}
        color="text-gray-900"
      />
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
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      {badge && <p className="mt-0.5 text-xs text-gray-400">{badge}</p>}
    </div>
  );
}
