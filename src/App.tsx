import { useState, useCallback } from "react";
import type { StatementType, StatementResult } from "./types";
import { parseCSV } from "./engine/csvParser";
import { processBankCSV } from "./engine/bankCategorizer";
import { processCardCSV } from "./engine/cardCategorizer";
import TabBar from "./components/TabBar";
import CSVUploader from "./components/CSVUploader";
import SummaryBar from "./components/SummaryBar";
import SpendingPieChart from "./components/SpendingPieChart";
import TransactionTable from "./components/TransactionTable";

export default function App() {
  const [activeTab, setActiveTab] = useState<StatementType>("bank");
  const [bankResult, setBankResult] = useState<StatementResult | null>(null);
  const [cardResult, setCardResult] = useState<StatementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoaded = useCallback(
    (text: string, _fileName: string) => {
      setError(null);
      try {
        const parsed = parseCSV(text);

        if (parsed.type === "bank") {
          const result = processBankCSV(parsed.headers, parsed.rows);
          setBankResult(result);
          setActiveTab("bank");
        } else {
          const result = processCardCSV(parsed.headers, parsed.rows);
          setCardResult(result);
          setActiveTab("card");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao processar CSV");
      }
    },
    [],
  );

  const currentResult = activeTab === "bank" ? bankResult : cardResult;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Meu Extrato
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Categorize seu extrato Nubank automaticamente
        </p>
      </header>

      <div className="mb-6">
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          bankCount={bankResult?.transactions.length ?? 0}
          cardCount={cardResult?.transactions.length ?? 0}
        />
      </div>

      <div className="mb-6">
        <CSVUploader onFileLoaded={handleFileLoaded} />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {currentResult && (
        <div className="space-y-6">
          <SummaryBar
            type={currentResult.type}
            totalIn={currentResult.totalIn}
            totalOut={currentResult.totalOut}
            balance={currentResult.balance}
            transactionCount={currentResult.transactions.length}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              {activeTab === "bank" ? "Gastos por Categoria" : "Gastos por Categoria"}
            </h2>
            <SpendingPieChart
              categories={currentResult.categories}
              showExpensesOnly={activeTab === "bank" ? true : false}
            />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
              Transações
            </h2>
            <TransactionTable
              categories={currentResult.categories}
              statementType={activeTab}
            />
          </div>
        </div>
      )}
    </div>
  );
}
