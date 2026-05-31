import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../auth/api";
import type {
  CategorySummary,
  StatementResult,
  StatementType,
} from "@aletheia/shared";
import { compareDatesDesc } from "@aletheia/shared";
import { currentYearMonth, type SavedStatementItem } from "../utils";

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

  for (const cat of catMap.values()) {
    cat.transactions.sort((a, b) => compareDatesDesc(a.date, b.date));
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

export function useDashboard(authenticated: boolean) {
  const [savedMonths, setSavedMonths] = useState<SavedStatementItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [result, setResult] = useState<StatementResult | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "remote" | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monthCache = useRef<Map<string, StatementResult>>(new Map());

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

  const loadMonthFromRemote = useCallback(async (ym: string, skipCache = false) => {
    if (!skipCache) {
      const cached = monthCache.current.get(ym);
      if (cached) {
        setResult(cached);
        setDataSource("remote");
        return;
      }
    }
    setLoadingData(true);
    setError(null);
    try {
      await api.post("/categories/apply", { yearMonth: ym }).catch(() => {});
      const remote = await api.get<RemoteStatement>(`/statements/${ym}%23family`);
      const parsed = remoteToResult(remote);
      monthCache.current.set(ym, parsed);
      setResult(parsed);
      setDataSource("remote");
    } catch {
      setResult(null);
      setDataSource(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadSavedMonths().then((items) => {
      if (items.length > 0) {
        const months = Array.from(
          new Set(items.map((s) => s.id.split("#")[0])),
        ).sort((a, b) => b.localeCompare(a));
        setSelectedMonth(months[0]);
      }
    });
  }, [authenticated, loadSavedMonths]);

  useEffect(() => {
    if (!authenticated || !monthHasData) {
      if (!monthHasData) {
        setResult(null);
        setDataSource(null);
      }
      return;
    }
    loadMonthFromRemote(selectedMonth);
  }, [authenticated, selectedMonth, monthHasData, loadMonthFromRemote]);

  const handleMonthChange = useCallback((ym: string) => {
    setSelectedMonth(ym);
    const cached = monthCache.current.get(ym);
    if (cached) {
      setResult(cached);
      setDataSource("remote");
    } else {
      setResult(null);
      setDataSource(null);
    }
  }, []);

  const selectorMonths = [
    ...availableMonths,
    ...(availableMonths.includes(currentYearMonth()) ? [] : [currentYearMonth()]),
  ].sort((a, b) => b.localeCompare(a));

  return {
    savedMonths,
    selectedMonth,
    result,
    dataSource,
    loadingData,
    error,
    setError,
    monthHasData,
    selectorMonths,
    loadSavedMonths,
    loadMonthFromRemote,
    handleMonthChange,
    setResult,
    setDataSource,
    monthCache,
    setSelectedMonth,
  };
}
