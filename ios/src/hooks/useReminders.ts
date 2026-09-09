import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReminderMonth, ReminderRecurrence, ReminderSeries } from "@aletheia/shared";
import { api } from "../auth/api";

interface RemindersResponse {
  notifyTime: string;
  months: ReminderMonth[];
  series: ReminderSeries[];
}

export interface ReminderWriteInput {
  name: string;
  startDate: string;
  recurrence: ReminderRecurrence;
}

export function useReminders(authenticated: boolean) {
  const [months, setMonths] = useState<ReminderMonth[]>([]);
  const [series, setSeries] = useState<ReminderSeries[]>([]);
  const [notifyTime, setNotifyTimeState] = useState("09:00");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<RemindersResponse>("/reminders");
      setMonths(data.months ?? []);
      setSeries(data.series ?? []);
      setNotifyTimeState(data.notifyTime || "09:00");
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) void refresh();
  }, [authenticated, refresh]);

  const create = useCallback(
    async (input: ReminderWriteInput) => {
      await api.post("/reminders", input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (reminderId: string, input: Partial<ReminderWriteInput>) => {
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
    async (reminderId: string, paid: boolean, date: string) => {
      await api.put(`/reminders/${reminderId}/paid`, { paid, date });
      await refresh();
    },
    [refresh],
  );

  const setNotifyTime = useCallback(async (time: string) => {
    const res = await api.put<{ notifyTime: string }>("/reminders/settings", { notifyTime: time });
    setNotifyTimeState(res.notifyTime);
  }, []);

  return useMemo(
    () => ({
      months,
      series,
      notifyTime,
      loading,
      refresh,
      create,
      update,
      remove,
      setPaid,
      setNotifyTime,
    }),
    [months, series, notifyTime, loading, refresh, create, update, remove, setPaid, setNotifyTime],
  );
}
