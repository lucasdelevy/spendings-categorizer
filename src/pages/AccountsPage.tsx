import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountType } from "../types";
import { useAccounts } from "../hooks/useAccounts";
import type { CreateAccountInput, UpdateAccountInput } from "../hooks/useAccounts";

interface Props {
  onBack: () => void;
}

interface FormState {
  name: string;
  type: AccountType;
  closingDay: string;
  apiKey: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "card",
  closingDay: "30",
  apiKey: "",
};

function formatDayLabel(day: number | undefined): string {
  if (!day) return "—";
  return String(day);
}

export default function AccountsPage({ onBack }: Props) {
  const { t } = useTranslation();
  const { accounts, loading, refresh, create, update, remove } = useAccounts(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editApiKeyTouched, setEditApiKeyTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startEdit = (account: Account) => {
    setEditing(account);
    setEditForm({
      name: account.name,
      type: account.type,
      closingDay: account.closingDay ? String(account.closingDay) : "",
      apiKey: "",
    });
    setEditApiKeyTouched(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditApiKeyTouched(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const input: CreateAccountInput = {
        name: form.name.trim(),
        type: form.type,
      };
      if (form.type === "card") {
        const cd = parseInt(form.closingDay || "30", 10);
        if (Number.isFinite(cd)) input.closingDay = cd;
      }
      if (form.apiKey.trim()) input.apiKey = form.apiKey.trim();
      await create(input);
      setForm(EMPTY_FORM);
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.createAccount"));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const input: UpdateAccountInput = {};
      if (editForm.name.trim() && editForm.name.trim() !== editing.name) {
        input.name = editForm.name.trim();
      }
      if (editing.type === "card") {
        const cd = parseInt(editForm.closingDay || "", 10);
        input.closingDay = Number.isFinite(cd) ? cd : null;
      }
      if (editApiKeyTouched) {
        const trimmed = editForm.apiKey.trim();
        input.apiKey = trimmed === "" ? null : trimmed;
      }
      await update(editing.accountId, input);
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.updateAccount"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!window.confirm(t("accounts.deleteConfirm", { name: account.name }))) return;
    setBusy(true);
    setError(null);
    try {
      await remove(account.accountId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.deleteAccount"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("accounts.back")}
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("accounts.title")}
        </h1>
      </div>

      <p className="mb-6 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        {t("accounts.intro")}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading && accounts.length === 0 && (
          <p className="text-sm text-gray-400">{t("accounts.loading")}</p>
        )}
        {!loading && accounts.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
            {t("accounts.empty")}
          </p>
        )}

        {accounts.map((account) => {
          const isEditing = editing?.accountId === account.accountId;
          return (
            <div
              key={account.accountId}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              {!isEditing ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        account.type === "bank"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      }`}
                    >
                      {t(`accounts.type.${account.type}`)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {account.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {account.type === "card" && (
                          <span>
                            {t("accounts.closingDayLabel")}:{" "}
                            <strong className="text-gray-700 dark:text-gray-300">
                              {formatDayLabel(account.closingDay)}
                            </strong>
                          </span>
                        )}
                        <span>
                          {t("accounts.apiKeyLabel")}:{" "}
                          {account.hasApiKey ? (
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {account.apiKeyHint || t("accounts.apiKeyConfigured")}
                            </strong>
                          ) : (
                            <span className="italic text-gray-400">
                              {t("accounts.apiKeyNotSet")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => startEdit(account)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t("accounts.edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(account)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {t("accounts.delete")}
                    </button>
                  </div>
                </div>
              ) : (
                <AccountForm
                  form={editForm}
                  setForm={setEditForm}
                  fixedType={account.type}
                  apiKeyPlaceholder={
                    account.hasApiKey
                      ? t("accounts.apiKeyKeepCurrent")
                      : t("accounts.apiKeyPlaceholder")
                  }
                  onApiKeyChange={() => setEditApiKeyTouched(true)}
                  onSubmit={handleUpdate}
                  onCancel={cancelEdit}
                  submitLabel={t("accounts.save")}
                  busy={busy}
                  showRemoveKey={account.hasApiKey}
                  onRemoveKey={() => {
                    setEditForm((s) => ({ ...s, apiKey: "" }));
                    setEditApiKeyTouched(true);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {creating ? (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t("accounts.newTitle")}
          </h3>
          <AccountForm
            form={form}
            setForm={setForm}
            apiKeyPlaceholder={t("accounts.apiKeyPlaceholder")}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreating(false);
              setForm(EMPTY_FORM);
            }}
            submitLabel={t("accounts.create")}
            busy={busy}
          />
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-6 w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-950"
        >
          + {t("accounts.addNew")}
        </button>
      )}
    </>
  );
}

interface AccountFormProps {
  form: FormState;
  setForm: (updater: (state: FormState) => FormState) => void;
  fixedType?: AccountType;
  apiKeyPlaceholder: string;
  onApiKeyChange?: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  busy: boolean;
  showRemoveKey?: boolean;
  onRemoveKey?: () => void;
}

function AccountForm({
  form,
  setForm,
  fixedType,
  apiKeyPlaceholder,
  onApiKeyChange,
  onSubmit,
  onCancel,
  submitLabel,
  busy,
  showRemoveKey,
  onRemoveKey,
}: AccountFormProps) {
  const { t } = useTranslation();
  const type = fixedType ?? form.type;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t("accounts.nameLabel")}>
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((s) => ({ ...s, name: e.target.value }))
            }
            placeholder={t("accounts.namePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500"
          />
        </Field>
        {!fixedType && (
          <Field label={t("accounts.typeLabel")}>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((s) => ({ ...s, type: e.target.value as AccountType }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="card">{t("accounts.type.card")}</option>
              <option value="bank">{t("accounts.type.bank")}</option>
            </select>
          </Field>
        )}
      </div>

      {type === "card" && (
        <Field
          label={t("accounts.closingDayLabel")}
          hint={t("accounts.closingDayHint")}
        >
          <input
            type="number"
            min={1}
            max={31}
            value={form.closingDay}
            onChange={(e) =>
              setForm((s) => ({ ...s, closingDay: e.target.value }))
            }
            placeholder="30"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
          />
        </Field>
      )}

      <Field
        label={t("accounts.apiKeyLabel")}
        hint={t("accounts.apiKeyHint")}
      >
        <div className="flex gap-2">
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => {
              setForm((s) => ({ ...s, apiKey: e.target.value }));
              onApiKeyChange?.();
            }}
            placeholder={apiKeyPlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500"
          />
          {showRemoveKey && (
            <button
              type="button"
              onClick={onRemoveKey}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              {t("accounts.apiKeyRemove")}
            </button>
          )}
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("accounts.cancel")}
        </button>
        <button
          onClick={onSubmit}
          disabled={busy || !form.name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
          {hint}
        </span>
      )}
    </label>
  );
}
