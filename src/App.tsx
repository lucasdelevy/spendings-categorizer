import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { StatementType, StatementResult, CategorySummary, CategoryConfig } from "./types";
import { parseCSV } from "./engine/csvParser";
import { processBankCSV } from "./engine/bankCategorizer";
import { processCardCSV } from "./engine/cardCategorizer";
import { processFamilyStatements } from "./engine/familyCategorizer";
import { toEngineConfig } from "./engine/categories";
import { useCategoryConfig } from "./hooks/useCategoryConfig";
import { useAuth } from "./auth/AuthContext";
import { api } from "./auth/api";
import { currentYearMonth } from "./utils";
import type { SavedStatementItem } from "./utils";
import LoginPage from "./pages/LoginPage";
import ManageMonths from "./pages/SavedStatements";
import FamilyPage from "./pages/FamilyPage";
import CategoriesPage from "./pages/CategoriesPage";
import AboutPage from "./pages/AboutPage";
import MonthSelector from "./components/MonthSelector";
import SaveConfirmBar from "./components/SaveConfirmBar";
import FamilyUploader from "./components/FamilyUploader";
import type { DetectedFile } from "./components/FamilyUploader";
import SummaryBar from "./components/SummaryBar";
import SpendingPieChart from "./components/SpendingPieChart";
import DailySpendingChart from "./components/DailySpendingChart";
import TransactionTable from "./components/TransactionTable";
import type { HidePayload } from "./components/TransactionTable";
import SideMenu from "./components/SideMenu";

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

function buildFamilyResult(
  files: DetectedFile[],
  catConfig: CategoryConfig | null,
): StatementResult | null {
  const engineConfig = catConfig ? toEngineConfig(catConfig) : undefined;

  const bankResults: StatementResult[] = [];
  const cardResults: StatementResult[] = [];

  for (const f of files) {
    const parsed = parseCSV(f.text);
    if (f.type === "bank") {
      bankResults.push(processBankCSV(parsed.headers, parsed.rows, engineConfig));
    } else {
      cardResults.push(processCardCSV(parsed.headers, parsed.rows, engineConfig));
    }
  }

  if (bankResults.length === 0 && cardResults.length === 0) return null;
  return processFamilyStatements(bankResults, cardResults);
}

function remoteToResult(remote: RemoteStatement): StatementResult {
  const catMap = new Map<string, CategorySummary>();
  for (let i = 0; i < remote.transactions.length; i++) {
    const t = { ...remote.transactions[i], _originalIndex: i };
    const existing = catMap.get(t.category);
    if (existing) {
      if (!t.hidden) {
        existing.total += t.amount;
        existing.count += 1;
      }
      existing.transactions.push(t);
    } else {
      catMap.set(t.category, {
        category: t.category,
        total: t.hidden ? 0 : t.amount,
        count: t.hidden ? 0 : 1,
        transactions: [t],
      });
    }
  }

  return {
    type: remote.summary.type,
    transactions: remote.transactions.map((t, i) => ({ ...t, _originalIndex: i })),
    categories: Array.from(catMap.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total),
    ),
    totalIn: remote.summary.totalIn,
    totalOut: remote.summary.totalOut,
    balance: remote.summary.balance,
  };
}

export default function App() {
  const { t } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const { config: catConfig, refresh: refreshConfig, save: saveCatConfig } = useCategoryConfig(!!user);

  const [savedMonths, setSavedMonths] = useState<SavedStatementItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth());
  const [result, setResult] = useState<StatementResult | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "remote" | null>(null);
  const [familyFiles, setFamilyFiles] = useState<DetectedFile[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [showFamily, setShowFamily] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [chartTab, setChartTab] = useState<"category" | "daily">("category");

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
      await api.post("/categories/apply", { yearMonth: ym }).catch(() => {});
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
      const built = buildFamilyResult(files, catConfig);
      setResult(built);
      setDataSource(built ? "local" : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.processCsv"));
    }
  }, [catConfig]);

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
      await api.delete(`/statements/${id.replace(/#/g, "%23")}`);
      const items = await loadSavedMonths();
      const deletedYM = id.split("#")[0];
      const remainingMonths = Array.from(
        new Set(items.map((s) => s.id.split("#")[0])),
      ).sort((a, b) => b.localeCompare(a));

      if (deletedYM === selectedMonth) {
        if (remainingMonths.includes(selectedMonth)) {
          await loadMonthFromRemote(selectedMonth);
        } else {
          setSelectedMonth(remainingMonths[0] ?? currentYearMonth());
          setResult(null);
          setDataSource(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.delete"));
    }
  }, [selectedMonth, loadSavedMonths, loadMonthFromRemote]);

  const applyConfigToMonth = useCallback(async (ym: string) => {
    try {
      await api.post("/categories/apply", { yearMonth: ym });
    } catch {
      // non-critical, ignore
    }
  }, []);

  const handleRecategorize = useCallback(async (payload: {
    globalIndex: number;
    newCategory: string;
    keyword: string;
    createCategory?: boolean;
    color?: string;
    applyToSimilar?: boolean;
  }) => {
    if (!result || dataSource !== "remote") return;
    try {
      await api.post("/categories/recategorize", {
        statementId: `${selectedMonth}#family`,
        transactionIndex: payload.globalIndex,
        newCategory: payload.newCategory,
        keyword: payload.keyword,
        createCategory: payload.createCategory,
        color: payload.color,
        applyToSimilar: payload.applyToSimilar,
      });
      await refreshConfig();
      await loadMonthFromRemote(selectedMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.recategorize"));
    }
  }, [result, dataSource, selectedMonth, refreshConfig, loadMonthFromRemote]);

  const handleRename = useCallback(async (payload: {
    globalIndex: number;
    newPayeeName: string;
  }) => {
    if (!result || dataSource !== "remote") return;
    try {
      await api.post("/categories/rename", {
        statementId: `${selectedMonth}#family`,
        transactionIndex: payload.globalIndex,
        newPayeeName: payload.newPayeeName,
      });
      await refreshConfig();
      await loadMonthFromRemote(selectedMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.rename"));
    }
  }, [result, dataSource, selectedMonth, refreshConfig, loadMonthFromRemote]);

  const handleIgnore = useCallback(async (payload: {
    globalIndex: number;
  }) => {
    if (!result || dataSource !== "remote") return;
    try {
      await api.post("/categories/ignore", {
        statementId: `${selectedMonth}#family`,
        transactionIndex: payload.globalIndex,
      });
      await refreshConfig();
      await loadMonthFromRemote(selectedMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.ignoreTransaction"));
    }
  }, [result, dataSource, selectedMonth, refreshConfig, loadMonthFromRemote]);

  const handleHide = useCallback(async (payload: HidePayload) => {
    if (!result || dataSource !== "remote") return;
    try {
      await api.post("/categories/hide", {
        statementId: `${selectedMonth}#family`,
        transactionIndex: payload.globalIndex,
      });
      await loadMonthFromRemote(selectedMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.hideTransaction"));
    }
  }, [result, dataSource, selectedMonth, loadMonthFromRemote]);

  const handleMonthChange = useCallback((ym: string) => {
    setSelectedMonth(ym);
    setFamilyFiles([]);
    setResult(null);
    setDataSource(null);
    setShowUploadOverlay(false);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const activePage = showCategories
    ? "categories"
    : showFamily
      ? "family"
      : showManage
        ? "manage"
        : showAbout
          ? "about"
          : "dashboard";

  const showUploader = activePage === "dashboard" && ((!monthHasData && dataSource !== "local") || showUploadOverlay);
  const showConfirmBar = activePage === "dashboard" && dataSource === "local" && result !== null;
  const showResults = activePage === "dashboard" && result !== null && !showUploadOverlay;
  const canAddFiles = activePage === "dashboard" && user.familyId && monthHasData && dataSource === "remote" && !showUploadOverlay;

  const selectorMonths = [
    ...availableMonths,
    ...(availableMonths.includes(currentYearMonth()) ? [] : [currentYearMonth()]),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SideMenu
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        onCategories={() => { setShowFamily(false); setShowManage(false); setShowAbout(false); setShowCategories(true); }}
        onFamily={() => { setShowCategories(false); setShowManage(false); setShowAbout(false); setShowFamily(true); }}
        onManage={() => { setShowCategories(false); setShowFamily(false); setShowAbout(false); setShowManage(true); }}
        onAbout={() => { setShowCategories(false); setShowFamily(false); setShowManage(false); setShowAbout(true); }}
        user={user}
        onLogout={logout}
      />

      <header className="mb-8 flex items-center gap-4">
        <button
          onClick={() => setSideMenuOpen(true)}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="flex items-baseline gap-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t("app.title")}
            <span className="inline-block scale-x-[-1] text-2xl font-light tracking-wide opacity-10">Ἀλήθεια</span>
          </h1>
          <p className="mt-1 text-sm italic text-gray-400 dark:text-gray-500">
            {t("app.subtitle")}
          </p>
        </div>
      </header>

      {activePage === "categories" && (
        <CategoriesPage
          config={catConfig}
          onSave={async (updated) => {
            await saveCatConfig(updated);
            await applyConfigToMonth(selectedMonth);
          }}
          onBack={() => {
            setShowCategories(false);
            if (monthHasData) loadMonthFromRemote(selectedMonth);
          }}
        />
      )}

      {activePage === "family" && (
        <FamilyPage onBack={() => setShowFamily(false)} />
      )}

      {activePage === "manage" && (
        <ManageMonths
          items={savedMonths}
          onBack={() => setShowManage(false)}
          onView={(ym) => { setShowManage(false); handleMonthChange(ym); }}
          onDelete={handleDeleteMonth}
        />
      )}

      {activePage === "about" && (
        <AboutPage onBack={() => setShowAbout(false)} />
      )}

      {activePage === "dashboard" && (
        <>
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
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("app.uploadStatements")}
              </button>
            </div>
          )}

          {showUploader && (
            <div className="mb-6">
              {showUploadOverlay && (
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("app.uploadOverlayDescription")}
                  </p>
                  <button
                    onClick={() => { setShowUploadOverlay(false); setFamilyFiles([]); setDataSource(null); }}
                    className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t("app.cancel")}
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
              <SaveConfirmBar result={result} files={familyFiles} catConfig={catConfig} onSaved={handleSaved} />
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
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
                transactionCount={result.transactions.filter((t) => !t.hidden).length}
                hiddenCount={result.transactions.filter((t) => t.hidden).length}
              />

              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setChartTab("category")}
                    className={`px-5 py-3 text-sm font-medium transition ${
                      chartTab === "category"
                        ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {t("app.tabCategory")}
                  </button>
                  <button
                    onClick={() => setChartTab("daily")}
                    className={`px-5 py-3 text-sm font-medium transition ${
                      chartTab === "daily"
                        ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {t("app.tabDaily")}
                  </button>
                </div>
                <div className="p-6">
                  {chartTab === "category" ? (
                    <SpendingPieChart
                      categories={result.categories}
                      showExpensesOnly
                    />
                  ) : (
                    <DailySpendingChart
                      transactions={result.transactions.filter((t) => !t.hidden)}
                    />
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("app.transactions")}
                </h2>
                <TransactionTable
                  categories={result.categories}
                  statementType={result.type}
                  catConfig={catConfig}
                  onRecategorize={dataSource === "remote" ? handleRecategorize : undefined}
                  onRename={dataSource === "remote" ? handleRename : undefined}
                  onIgnore={dataSource === "remote" ? handleIgnore : undefined}
                  onHide={dataSource === "remote" ? handleHide : undefined}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
