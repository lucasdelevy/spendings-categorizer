import { useState, useCallback } from "react";
import type { StatementType, StatementResult } from "./types";
import { parseCSV } from "./engine/csvParser";
import { processBankCSV } from "./engine/bankCategorizer";
import { processCardCSV } from "./engine/cardCategorizer";
import { processFamilyStatements } from "./engine/familyCategorizer";
import TabBar from "./components/TabBar";
import CSVUploader from "./components/CSVUploader";
import FamilyUploader from "./components/FamilyUploader";
import SummaryBar from "./components/SummaryBar";
import SpendingPieChart from "./components/SpendingPieChart";
import TransactionTable from "./components/TransactionTable";

interface FamilyFiles {
  bank1: { text: string; name: string } | null;
  bank2: { text: string; name: string } | null;
  card1: { text: string; name: string } | null;
  card2: { text: string; name: string } | null;
}

function buildFamilyResult(files: FamilyFiles): StatementResult | null {
  const bankResults: StatementResult[] = [];
  const cardResults: StatementResult[] = [];

  for (const f of [files.bank1, files.bank2]) {
    if (!f) continue;
    const parsed = parseCSV(f.text);
    bankResults.push(processBankCSV(parsed.headers, parsed.rows));
  }

  for (const f of [files.card1, files.card2]) {
    if (!f) continue;
    const parsed = parseCSV(f.text);
    cardResults.push(processCardCSV(parsed.headers, parsed.rows));
  }

  if (bankResults.length === 0 && cardResults.length === 0) return null;
  return processFamilyStatements(bankResults, cardResults);
}

const FAMILY_SLOTS = [
  { id: "bank1", label: "Extrato Bancário 1" },
  { id: "bank2", label: "Extrato Bancário 2" },
  { id: "card1", label: "Fatura Cartão 1" },
  { id: "card2", label: "Fatura Cartão 2" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StatementType>("bank");
  const [bankResult, setBankResult] = useState<StatementResult | null>(null);
  const [cardResult, setCardResult] = useState<StatementResult | null>(null);
  const [familyResult, setFamilyResult] = useState<StatementResult | null>(null);
  const [familyFiles, setFamilyFiles] = useState<FamilyFiles>({
    bank1: null, bank2: null, card1: null, card2: null,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSingleFile = useCallback(
    (text: string, _fileName: string) => {
      setError(null);
      try {
        const parsed = parseCSV(text);
        if (parsed.type === "bank") {
          setBankResult(processBankCSV(parsed.headers, parsed.rows));
          setActiveTab("bank");
        } else {
          setCardResult(processCardCSV(parsed.headers, parsed.rows));
          setActiveTab("card");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao processar CSV");
      }
    },
    [],
  );

  const handleFamilyFile = useCallback(
    (slotId: string, text: string, fileName: string) => {
      setError(null);
      try {
        parseCSV(text);

        setFamilyFiles((prev) => {
          const next = {
            ...prev,
            [slotId]: { text, name: fileName },
          };
          const result = buildFamilyResult(next);
          setFamilyResult(result);
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao processar CSV");
      }
    },
    [],
  );

  const currentResult =
    activeTab === "bank"
      ? bankResult
      : activeTab === "card"
        ? cardResult
        : familyResult;

  const familySlots = FAMILY_SLOTS.map((s) => ({
    ...s,
    fileName: familyFiles[s.id as keyof FamilyFiles]?.name ?? null,
  }));

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
          counts={{
            bank: bankResult?.transactions.length ?? 0,
            card: cardResult?.transactions.length ?? 0,
            family: familyResult?.transactions.length ?? 0,
          }}
        />
      </div>

      <div className="mb-6">
        {activeTab === "family" ? (
          <FamilyUploader
            slots={familySlots}
            onFileLoaded={handleFamilyFile}
          />
        ) : (
          <CSVUploader onFileLoaded={handleSingleFile} />
        )}
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
              Gastos por Categoria
            </h2>
            <SpendingPieChart
              categories={currentResult.categories}
              showExpensesOnly={activeTab === "bank" || activeTab === "family"}
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
