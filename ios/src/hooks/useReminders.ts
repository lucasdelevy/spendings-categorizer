import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaymentReminder } from "@aletheia/shared";
import { api } from "../auth/api";

interface RemindersResponse {
  month: string;
  notifyTime: string;
  reminders: PaymentReminder[];
}

export function useReminders(authenticated: boolean, month: string) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [notifyTime, setNotifyTimeState] = useState("09:00");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<RemindersResponse>(`/reminders?month=${month}`);
      setReminders(data.reminders ?? []);
      setNotifyTimeState(data.notifyTime || "09:00");
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (authenticated) void refresh();
  }, [authenticated, refresh]);

  const create = useCallback(
    async (input: { name: string; dayOfMonth: number }) => {
      await api.post("/reminders", input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (reminderId: string, input: { name?: string; dayOfMonth?: number }) => {
      await api.put(`/reminders/${reminderId}`, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (reminderId: string) => {
      await api.delete(`/reminders/${reminderId}`);
      await refresh();
    },
    [refresh],
  );

  const setPaid = useCallback(
    async (reminderId: string, paid: boolean) => {
      await api.put(`/reminders/${reminderId}/paid`, { paid, yearMonth: month });
      await refresh();
    },
    [month, refresh],
  );

  const setNotifyTime = useCallback(async (time: string) => {
    const res = await api.put<{ notifyTime: string }>("/reminders/settings", { notifyTime: time });
    setNotifyTimeState(res.notifyTime);
  }, []);

  return useMemo(
    () => ({
      reminders,
      notifyTime,
      loading,
      refresh,
      create,
      update,
      remove,
      setPaid,
      setNotifyTime,
    }),
    [reminders, notifyTime, loading, refresh, create, update, remove, setPaid, setNotifyTime],
  );
}
