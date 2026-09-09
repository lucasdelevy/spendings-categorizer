import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ReminderRecurrence, ReminderSeries } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import { useReminders } from "../hooks/useReminders";
import { formatYearMonth } from "../utils";
import { resolveLocale } from "../i18n";

interface Props {
  onBack: () => void;
}

type View = "list" | "form";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatIsoDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(resolveLocale(), {
    day: "numeric",
    month: "short",
    weekday: "short",
  });
}

export default function RemindersPage({ onBack }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const { months, series, notifyTime, loading, create, update, remove, setPaid, setNotifyTime } =
    useReminders(true);
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<ReminderSeries | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeDraft, setTimeDraft] = useState<string | null>(null);

  const timeValue = timeDraft ?? notifyTime;
  const hasOccurrences = months.some((month) => month.occurrences.length > 0);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setStartDate(todayIso());
    setRecurrence("monthly");
    setError(null);
    setView("form");
  };

  const openEdit = (reminderId: string) => {
    const item = series.find((s) => s.reminderId === reminderId);
    if (!item) return;
    setEditing(item);
    setName(item.name);
    setStartDate(item.startDate);
    setRecurrence(item.recurrence);
    setError(null);
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setEditing(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !startDate) return;
    setBusy(true);
    setError(null);
    try {
      const payload = { name: name.trim(), startDate, recurrence };
      if (editing) await update(editing.reminderId, payload);
      else await create(payload);
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (item: ReminderSeries) => {
    if (!window.confirm(t("reminders.deleteConfirm", { name: item.name }))) return;
    setBusy(true);
    setError(null);
    try {
      await remove(item.reminderId);
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handlePaid = async (reminderId: string, date: string, paid: boolean) => {
    setError(null);
    try {
      await setPaid(reminderId, paid, date);
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

  if (view === "form") {
    return (
      <div>
        <button
          onClick={closeForm}
          className="mb-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← {t("reminders.back")}
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {editing ? t("reminders.editTitle") : t("reminders.newTitle")}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("reminders.formIntro")}</p>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <form
          className="mt-6 max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("reminders.name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("reminders.namePlaceholder")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("reminders.startDate")}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <fieldset>
            <legend className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("reminders.recurrence")}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["once", "monthly", "yearly"] as ReminderRecurrence[]).map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    recurrence === value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200"
                      : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="recurrence"
                    value={value}
                    checked={recurrence === value}
                    onChange={() => setRecurrence(value)}
                    className="sr-only"
                  />
                  {t(`reminders.recurrence${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || !name.trim() || !startDate}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {editing ? t("reminders.save") : t("reminders.create")}
            </button>
            <button type="button" onClick={closeForm} className="text-sm text-gray-500">
              {t("reminders.cancel")}
            </button>
            {editing && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete(editing)}
                className="ml-auto text-sm text-red-600 dark:text-red-400"
              >
                {t("reminders.delete")}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← {t("reminders.back")}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("reminders.title")}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("reminders.intro")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            {t("reminders.create")}
          </button>
        )}
      </div>

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

      {loading && !hasOccurrences && (
        <p className="mt-6 text-sm text-gray-400">{t("reminders.loading")}</p>
      )}
      {!loading && !hasOccurrences && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t("reminders.empty")}</p>
      )}
      {!canManage && (
        <p className="mt-4 text-xs text-gray-400">{t("reminders.membersReadOnly")}</p>
      )}

      <div className="mt-6 space-y-8">
        {months.map((month) => (
          <section key={month.yearMonth}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {formatYearMonth(month.yearMonth)}
            </h3>
            <ul className="mt-3 space-y-3">
              {month.occurrences.map((occ) => (
                <li
                  key={`${occ.reminderId}-${occ.date}`}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{occ.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatIsoDate(occ.date)} · {t(`reminders.recurrence${occ.recurrence.charAt(0).toUpperCase()}${occ.recurrence.slice(1)}`)}
                      </p>
                      {occ.paid && occ.paidByName && (
                        <p className="mt-1 text-xs text-gray-400">
                          {t("reminders.paidOn", { who: occ.paidByName })}
                        </p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={occ.paid}
                        onChange={(e) => void handlePaid(occ.reminderId, occ.date, e.target.checked)}
                      />
                      {t("reminders.paid")}
                    </label>
                  </div>
                  {canManage && (
                    <div className="mt-3 flex gap-3 text-sm">
                      <button
                        type="button"
                        className="text-indigo-600 dark:text-indigo-400"
                        onClick={() => openEdit(occ.reminderId)}
                      >
                        {t("reminders.editSeries")}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
