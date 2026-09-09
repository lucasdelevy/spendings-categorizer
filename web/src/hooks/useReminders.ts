import { useCallback, useEffect, useState } from "react";
import type { PaymentReminder } from "@aletheia/shared";
import { api } from "../auth/api";

interface RemindersResponse {
  month: string;
  notifyTime: string;
  reminders: PaymentReminder[];
}

interface UseRemindersResult {
  reminders: PaymentReminder[];
  notifyTime: string;
  month: string;
  loading: boolean;
  refresh: (month?: string) => Promise<void>;
  create: (input: { name: string; dayOfMonth: number }) => Promise<void>;
  update: (reminderId: string, input: { name?: string; dayOfMonth?: number }) => Promise<void>;
  remove: (reminderId: string) => Promise<void>;
  setPaid: (reminderId: string, paid: boolean, yearMonth: string) => Promise<void>;
  setNotifyTime: (notifyTime: string) => Promise<void>;
}

export function useReminders(authenticated: boolean, month: string): UseRemindersResult {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [notifyTime, setNotifyTimeState] = useState("09:00");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (ym?: string) => {
    setLoading(true);
    try {
      const data = await api.get<RemindersResponse>(`/reminders?month=${ym ?? month}`);
      setReminders(data.reminders ?? []);
      setNotifyTimeState(data.notifyTime || "09:00");
    } catch {
      /* keep last known list */
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (authenticated) void refresh(month);
  }, [authenticated, month, refresh]);

  const create = useCallback(async (input: { name: string; dayOfMonth: number }) => {
    await api.post("/reminders", input);
    await refresh(month);
  }, [month, refresh]);

  const update = useCallback(async (reminderId: string, input: { name?: string; dayOfMonth?: number }) => {
    await api.put(`/reminders/${reminderId}`, input);
    await refresh(month);
  }, [month, refresh]);

  const remove = useCallback(async (reminderId: string) => {
    await api.delete(`/reminders/${reminderId}`);
    await refresh(month);
  }, [month, refresh]);

  const setPaid = useCallback(async (reminderId: string, paid: boolean, yearMonth: string) => {
    await api.put(`/reminders/${reminderId}/paid`, { paid, yearMonth });
    await refresh(yearMonth);
  }, [refresh]);

  const setNotifyTime = useCallback(async (time: string) => {
    const res = await api.put<{ notifyTime: string }>("/reminders/settings", { notifyTime: time });
    setNotifyTimeState(res.notifyTime);
  }, []);

  return {
    reminders,
    notifyTime,
    month,
    loading,
    refresh,
    create,
    update,
    remove,
    setPaid,
    setNotifyTime,
  };
}
