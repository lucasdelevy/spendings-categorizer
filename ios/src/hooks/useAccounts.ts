import { useState, useEffect, useCallback } from "react";
import { api } from "../auth/api";
import type { Account, AccountType } from "@aletheia/shared";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  closingDay?: number;
  apiKey?: string;
}

export interface UpdateAccountInput {
  name?: string;
  closingDay?: number | null;
  apiKey?: string | null;
}

export function useAccounts(authenticated: boolean) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ accounts: Account[] }>("/accounts");
      setAccounts(data.accounts);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) refresh();
  }, [authenticated, refresh]);

  const create = useCallback(async (input: CreateAccountInput) => {
    const res = await api.post<{ account: Account }>("/accounts", input);
    setAccounts((prev) => [...prev, res.account]);
    return res.account;
  }, []);

  const update = useCallback(async (accountId: string, input: UpdateAccountInput) => {
    const res = await api.put<{ account: Account }>(`/accounts/${accountId}`, input);
    setAccounts((prev) => prev.map((a) => (a.accountId === accountId ? res.account : a)));
    return res.account;
  }, []);

  const remove = useCallback(async (accountId: string) => {
    await api.delete(`/accounts/${accountId}`);
    setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
  }, []);

  return { accounts, loading, refresh, create, update, remove };
}
