import { useTranslation } from "react-i18next";
import type { Account } from "@aletheia/shared";
import { expiredApiKeyAccounts, openPierreApiKeyPage } from "../utils/pierre";

interface Props {
  accounts: Account[];
  onManageAccounts?: () => void;
}

export default function OpenFinanceExpiredBanner({ accounts, onManageAccounts }: Props) {
  const { t } = useTranslation();
  const expired = expiredApiKeyAccounts(accounts);
  if (expired.length === 0) return null;

  const names = expired.map((a) => a.name).join(", ");

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {t("accounts.apiKeyExpiredBanner")}
        </p>
        <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
          {t("accounts.apiKeyExpiredBody", { names })}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openPierreApiKeyPage}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            {t("accounts.getNewPierreKey")}
          </button>
          {onManageAccounts && (
            <button
              type="button"
              onClick={onManageAccounts}
              className="text-xs font-medium text-amber-900 underline hover:text-amber-700 dark:text-amber-200 dark:hover:text-amber-100"
            >
              {t("accounts.pasteKeyOnAccount")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
