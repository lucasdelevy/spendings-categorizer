import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";

interface User {
  email: string;
  name: string;
  picture: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCategories: () => void;
  onAccounts: () => void;
  onFamily: () => void;
  onManage: () => void;
  onAbout: () => void;
  user: User;
  onLogout: () => void;
}

export default function SideMenu({
  open,
  onClose,
  onCategories,
  onAccounts,
  onFamily,
  onManage,
  onAbout,
  user,
  onLogout,
}: Props) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const sectionHeader =
    "px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500";

  const navItem =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700";

  const handleNav = (cb: () => void) => {
    onClose();
    cb();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-gray-800 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex items-center justify-end px-3 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings section */}
        <p className={sectionHeader}>{t("sidebar.settings")}</p>
        <div className="space-y-1 px-3">
          <div className="flex items-center justify-between rounded-lg px-1 py-1">
            <LanguageSwitcher />
          </div>
          <DarkModeToggle labeled />
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-gray-200 dark:border-gray-700" />

        {/* Navigation section */}
        <p className={sectionHeader}>{t("sidebar.navigation")}</p>
        <nav className="space-y-0.5 px-3">
          <button onClick={() => handleNav(onCategories)} className={navItem}>
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {t("app.categories")}
          </button>
          <button onClick={() => handleNav(onAccounts)} className={navItem}>
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM7 15h2" />
            </svg>
            {t("app.accounts")}
          </button>
          <button onClick={() => handleNav(onFamily)} className={navItem}>
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t("app.family")}
          </button>
          <button onClick={() => handleNav(onManage)} className={navItem}>
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t("app.manageMonths")}
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* About */}
        <div className="px-3 pb-3">
          <button onClick={() => handleNav(onAbout)} className={navItem}>
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("app.about")}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src={user.picture}
              alt={user.name}
              className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-600"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("app.logout")}
          </button>
        </div>
      </div>
    </>
  );
}
