import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaymentReminder } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import { useReminders } from "../hooks/useReminders";
import { currentYearMonth, formatYearMonth } from "../utils";

interface Props {
  onBack: () => void;
}

function monthOptions(from: string, count: number): string[] {
  const year = parseInt(from.slice(0, 4), 10);
  const month = parseInt(from.slice(4, 6), 10);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1 - i, 1);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

export default function RemindersPage({ onBack }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const [month, setMonth] = useState(currentYearMonth());
  const { reminders, notifyTime, loading, create, update, remove, setPaid, setNotifyTime } =
    useReminders(true, month);
  const [name, setName] = useState("");
  const [day, setDay] = useState("5");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState("5");
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeDraft, setTimeDraft] = useState<string | null>(null);

  const months = useMemo(() => monthOptions(currentYearMonth(), 12), []);
  const timeValue = timeDraft ?? notifyTime;

  const handleCreate = async () => {
    const dayOfMonth = parseInt(day, 10);
    if (!name.trim() || !Number.isFinite(dayOfMonth)) return;
    setBusy(true);
    setError(null);
    try {
      await create({ name: name.trim(), dayOfMonth });
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (reminder: PaymentReminder) => {
    const dayOfMonth = parseInt(editDay, 10);
    if (!editName.trim() || !Number.isFinite(dayOfMonth)) return;
    setBusy(true);
    setError(null);
    try {
      await update(reminder.reminderId, { name: editName.trim(), dayOfMonth });
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (reminder: PaymentReminder) => {
    if (!window.confirm(t("reminders.deleteConfirm", { name: reminder.name }))) return;
    setBusy(true);
    setError(null);
    try {
      await remove(reminder.reminderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handlePaid = async (reminder: PaymentReminder, paid: boolean) => {
    setError(null);
    try {
      await setPaid(reminder.reminderId, paid, month);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    }
  };

  const handleNotifyTime = async () => {
    setBusy(true);
    setError(null);
    try {
      await setNotifyTime(timeValue);
      setTimeDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← {t("reminders.back")}
      </button>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("reminders.title")}</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("reminders.intro")}</p>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("reminders.notifyTime")}
          <input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeDraft(e.target.value)}
            className="mt-1 block w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <p className="mt-1 text-xs text-gray-400">{t("reminders.notifyTimeHint")}</p>
        <button
          type="button"
          disabled={busy || timeDraft === null}
          onClick={() => void handleNotifyTime()}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {t("reminders.saveTime")}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          {t("reminders.month")}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            {months.map((ym) => (
              <option key={ym} value={ym}>
                {formatYearMonth(ym)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && reminders.length === 0 && (
        <p className="mt-6 text-sm text-gray-400">{t("reminders.loading")}</p>
      )}
      {!loading && reminders.length === 0 && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t("reminders.empty")}</p>
      )}

      <ul className="mt-4 space-y-3">
        {reminders.map((reminder) => (
          <li
            key={reminder.reminderId}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            {editingId === reminder.reminderId ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editDay}
                  onChange={(e) => setEditDay(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSaveEdit(reminder)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white"
                  >
                    {t("reminders.save")}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500">
                    {t("reminders.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{reminder.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("reminders.dayLabel", { day: reminder.dayOfMonth })}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={reminder.paid}
                      onChange={(e) => void handlePaid(reminder, e.target.checked)}
                    />
                    {t("reminders.paid")}
                  </label>
                </div>
                {canManage && (
                  <div className="mt-3 flex gap-3 text-sm">
                    <button
                      type="button"
                      className="text-indigo-600 dark:text-indigo-400"
                      onClick={() => {
                        setEditingId(reminder.reminderId);
                        setEditName(reminder.name);
                        setEditDay(String(reminder.dayOfMonth));
                      }}
                    >
                      {t("reminders.edit")}
                    </button>
                    <button
                      type="button"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => void handleDelete(reminder)}
                    >
                      {t("reminders.delete")}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-gray-400"
                  onClick={() =>
                    setOpenHistory(openHistory === reminder.reminderId ? null : reminder.reminderId)
                  }
                >
                  {openHistory === reminder.reminderId ? t("reminders.hideHistory") : t("reminders.showHistory")}
                </button>
                {openHistory === reminder.reminderId && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {reminder.history.map((row) => (
                      <li key={row.yearMonth} className="flex justify-between">
                        <span>{formatYearMonth(row.yearMonth)}</span>
                        <span>
                          {row.paid
                            ? t("reminders.paidOn", { who: row.paidByName || "—" })
                            : t("reminders.unpaid")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <form
          className="mt-8 space-y-3 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-600"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("reminders.newTitle")}</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("reminders.namePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <label className="block text-xs text-gray-500">
            {t("reminders.dayOfMonth")}
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("reminders.create")}
          </button>
        </form>
      )}
    </div>
  );
}
