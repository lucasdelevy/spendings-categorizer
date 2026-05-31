import { useCallback } from "react";
import { api } from "../auth/api";
import type { RecategorizePayload } from "../components/TransactionTable";

export function useTransactionActions(
  selectedMonth: string,
  dataSource: "local" | "remote" | null,
  refreshConfig: () => Promise<void>,
  reloadMonth: () => Promise<void>,
) {
  const statementId = `${selectedMonth}#family`;
  const enabled = dataSource === "remote";

  const handleRecategorize = useCallback(
    async (payload: RecategorizePayload) => {
      if (!enabled) return;
      await api.post("/categories/recategorize", {
        statementId,
        transactionIndex: payload.globalIndex,
        newCategory: payload.newCategory,
        keyword: payload.keyword,
        createCategory: payload.createCategory,
        color: payload.color,
        applyToSimilar: payload.applyToSimilar,
      });
      await refreshConfig();
      await reloadMonth();
    },
    [enabled, statementId, refreshConfig, reloadMonth],
  );

  const handleRename = useCallback(
    async (payload: { globalIndex: number; newPayeeName: string }) => {
      if (!enabled) return;
      await api.post("/categories/rename", {
        statementId,
        transactionIndex: payload.globalIndex,
        newPayeeName: payload.newPayeeName,
      });
      await refreshConfig();
      await reloadMonth();
    },
    [enabled, statementId, refreshConfig, reloadMonth],
  );

  const handleIgnore = useCallback(
    async (payload: { globalIndex: number }) => {
      if (!enabled) return;
      await api.post("/categories/ignore", { statementId, transactionIndex: payload.globalIndex });
      await refreshConfig();
      await reloadMonth();
    },
    [enabled, statementId, refreshConfig, reloadMonth],
  );

  const handleHide = useCallback(
    async (payload: { globalIndex: number }) => {
      if (!enabled) return;
      await api.post("/categories/hide", { statementId, transactionIndex: payload.globalIndex });
      await reloadMonth();
    },
    [enabled, statementId, reloadMonth],
  );

  return {
    onRecategorize: enabled ? handleRecategorize : undefined,
    onRename: enabled ? handleRename : undefined,
    onIgnore: enabled ? handleIgnore : undefined,
    onHide: enabled ? handleHide : undefined,
  };
}
