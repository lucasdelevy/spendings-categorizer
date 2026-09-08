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

function normalizeAccount(account: Account): Account {
  return { ...account, apiKeyExpired: account.apiKeyExpired === true };
}

export function useAccounts(authenticated: boolean) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await api.get<{ accounts: Account[] }>("/accounts");
      setAccounts((data.accounts ?? []).map(normalizeAccount));
    } catch {
      /* keep the last known list */
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) void refresh();
  }, [authenticated, refresh]);

  const create = useCallback(async (input: CreateAccountInput) => {
    const res = await api.post<{ account: Account }>("/accounts", input);
    const account = normalizeAccount(res.account);
    setAccounts((prev) => [...prev, account]);
    return account;
  }, []);

  const update = useCallback(async (accountId: string, input: UpdateAccountInput) => {
    const res = await api.put<{ account: Account }>(`/accounts/${accountId}`, input);
    const account = normalizeAccount(res.account);
    setAccounts((prev) => prev.map((a) => (a.accountId === accountId ? account : a)));
    return account;
  }, []);

  const remove = useCallback(async (accountId: string) => {
    await api.delete(`/accounts/${accountId}`);
    setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
  }, []);

  return { accounts, loading, refresh, create, update, remove };
}
