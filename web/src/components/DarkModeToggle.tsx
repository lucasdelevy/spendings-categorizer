import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  labeled?: boolean;
}

export default function DarkModeToggle({ labeled = false }: Props) {
  const { t } = useTranslation();
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  const icon = isDark ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );

  if (labeled) {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        {icon}
        {t("sidebar.darkMode")}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {icon}
    </button>
  );
}
