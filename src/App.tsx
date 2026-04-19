import { useState, useCallback, useEffect } from "react";
import type { StatementType, StatementResult, CategorySummary } from "./types";
import { parseCSV } from "./engine/csvParser";
import { processBankCSV } from "./engine/bankCategorizer";
import { processCardCSV } from "./engine/cardCategorizer";
import { processFamilyStatements } from "./engine/familyCategorizer";
import { useAuth } from "./auth/AuthContext";
import { api } from "./auth/api";
import { currentYearMonth } from "./utils";
import type { SavedStatementItem } from "./utils";
import LoginPage from "./pages/LoginPage";
import ManageMonths from "./pages/SavedStatements";
import FamilyPage from "./pages/FamilyPage";
import MonthSelector from "./components/MonthSelector";
import SaveConfirmBar from "./components/SaveConfirmBar";
import FamilyUploader from "./components/FamilyUploader";
import type { DetectedFile } from "./components/FamilyUploader";
import SummaryBar from "./components/SummaryBar";
import SpendingPieChart from "./components/SpendingPieChart";
import TransactionTable from "./components/TransactionTable";

interface RemoteStatement {
  id: string;
  fileName: string;
  uploadedAt: string;
  summary: {
    type: StatementType;
    totalIn: number;
    totalOut: number;
    balance: number;
    categories: { category: string; total: number; count: number }[];
  };
  transactions: StatementResult["transactions"];
}

function buildFamilyResult(files: DetectedFile[]): StatementResult | null {
  const bankResults: StatementResult[] = [];
  const cardResults: StatementResult[] = [];

  for (const f of files) {
    const parsed = parseCSV(f.text);
    if (f.type === "bank") {
      bankResults.push(processBankCSV(parsed.headers, parsed.rows));
    } else {
      cardResults.push(processCardCSV(parsed.headers, parsed.rows));
    }
  }

  if (bankResults.length === 0 && cardResults.length === 0) return null;
  return processFamilyStatements(bankResults, cardResults);
}

function remoteToResult(remote: RemoteStatement): StatementResult {
  const catMap = new Map<string, CategorySummary>();
  for (const t of remote.transactions) {
    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
      existing.transactions.push(t);
    } else {
      catMap.set(t.category, {
        category: t.category,
        total: t.amount,
        count: 1,
        transactions: [t],
      });
    }
  }

  return {
    type: remote.summary.type,
    transactions: remote.transactions,
    categories: Array.from(catMap.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total),
    ),
    totalIn: remote.summary.totalIn,
    totalOut: remote.summary.totalOut,
    balance: remote.summary.balance,
  };
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [savedMonths, setSavedMonths] = useState<SavedStatementItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth());
  const [result, setResult] = useState<StatementResult | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "remote" | null>(null);
  const [familyFiles, setFamilyFiles] = useState<DetectedFile[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [showFamily, setShowFamily] = useState(false);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);

  const availableMonths = Array.from(
    new Set(savedMonths.map((s) => s.id.split("#")[0])),
  ).sort((a, b) => b.localeCompare(a));

  const monthHasData = availableMonths.includes(selectedMonth);

  const loadSavedMonths = useCallback(async () => {
    try {
      const res = await api.get<{ statements: SavedStatementItem[] }>("/statements");
      setSavedMonths(res.statements);
      return res.statements;
    } catch {
      return [];
    }
  }, []);

  const loadMonthFromRemote = useCallback(async (ym: string) => {
    setLoadingData(true);
    setError(null);
    try {
      const remote = await api.get<RemoteStatement>(`/statements/${ym}%23family`);
      setResult(remoteToResult(remote));
      setDataSource("remote");
    } catch {
      setResult(null);
      setDataSource(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSavedMonths().then((items) => {
      if (items.length > 0) {
        const months = Array.from(
          new Set(items.map((s) => s.id.split("#")[0])),
        ).sort((a, b) => b.localeCompare(a));
        setSelectedMonth(months[0]);
      }
    });
  }, [user, loadSavedMonths]);

  useEffect(() => {
    if (!user || !monthHasData) {
      if (!monthHasData) {
        setResult(null);
        setDataSource(null);
        setFamilyFiles([]);
      }
      return;
    }
    loadMonthFromRemote(selectedMonth);
  }, [user, selectedMonth, monthHasData, loadMonthFromRemote]);

  const handleFamilyFiles = useCallback((files: DetectedFile[]) => {
    setError(null);
    try {
      setFamilyFiles(files);
      const built = buildFamilyResult(files);
      setResult(built);
      setDataSource(built ? "local" : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar CSV");
    }
  }, []);

  const handleSaved = useCallback(async (ym: string) => {
    setSelectedMonth(ym);
    setFamilyFiles([]);
    setShowUploadOverlay(false);
    const items = await loadSavedMonths();
    const months = Array.from(new Set(items.map((s) => s.id.split("#")[0])));
    if (months.includes(ym)) {
      await loadMonthFromRemote(ym);
    }
  }, [loadSavedMonths, loadMonthFromRemote]);

  const handleDeleteMonth = useCallback(async (id: string) => {
    try {
      await api.delete(`/statements/${id.replace("#", "%23")}`);
      const items = await loadSavedMonths();
      const deletedYM = id.split("#")[0];
      if (deletedYM === selectedMonth) {
        const remaining = Array.from(
          new Set(items.map((s) => s.id.split("#")[0])),
        ).sort((a, b) => b.localeCompare(a));
        setSelectedMonth(remaining[0] ?? currentYearMonth());
        setResult(null);
        setDataSource(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }, [selectedMonth, loadSavedMonths]);

  const handleMonthChange = useCallback((ym: string) => {
    setSelectedMonth(ym);
    setFamilyFiles([]);
    setResult(null);
    setDataSource(null);
    setShowUploadOverlay(false);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (showFamily) {
    return <FamilyPage onBack={() => setShowFamily(false)} />;
  }

  if (showManage) {
    return (
      <ManageMonths
        items={savedMonths}
        onBack={() => setShowManage(false)}
        onView={(ym) => { setShowManage(false); handleMonthChange(ym); }}
        onDelete={handleDeleteMonth}
      />
    );
  }

  const showUploader = (!monthHasData && dataSource !== "local") || showUploadOverlay;
  const showConfirmBar = dataSource === "local" && result !== null;
  const showResults = result !== null && !showUploadOverlay;
  const canAddFiles = user.familyId && monthHasData && dataSource === "remote" && !showUploadOverlay;

  const selectorMonths = [
    ...availableMonths,
    ...(availableMonths.includes(currentYearMonth()) ? [] : [currentYearMonth()]),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Spendings Categorizer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Categorize seu extrato Nubank automaticamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFamily(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Família
          </button>
          <button
            onClick={() => setShowManage(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Gerenciar Meses
          </button>
          <img
            src={user.picture}
            alt={user.name}
            className="h-9 w-9 rounded-full border border-gray-200"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={logout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <MonthSelector
          months={selectorMonths}
          selected={selectedMonth}
          onChange={handleMonthChange}
          allowNew
        />
        {loadingData && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        )}
      </div>

      {canAddFiles && (
        <div className="mb-6">
          <button
            onClick={() => setShowUploadOverlay(true)}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enviar meus extratos
          </button>
        </div>
      )}

      {showUploader && (
        <div className="mb-6">
          {showUploadOverlay && (
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Envie seus extratos para este mês. Eles serão combinados com os dos outros membros.
              </p>
              <button
                onClick={() => { setShowUploadOverlay(false); setFamilyFiles([]); setDataSource(null); }}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          )}
          <FamilyUploader
            files={familyFiles}
            onFilesLoaded={handleFamilyFiles}
          />
        </div>
      )}

      {showConfirmBar && result && (
        <div className="mb-6">
          <SaveConfirmBar result={result} onSaved={handleSaved} />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showResults && result && (
        <div className="space-y-6">
          <SummaryBar
            type={result.type}
            totalIn={result.totalIn}
            totalOut={result.totalOut}
            balance={result.balance}
            transactionCount={result.transactions.length}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Gastos por Categoria
            </h2>
            <SpendingPieChart
              categories={result.categories}
              showExpensesOnly
            />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
              Transações
            </h2>
            <TransactionTable
              categories={result.categories}
              statementType={result.type}
            />
          </div>
        </div>
      )}
    </div>
  );
}
