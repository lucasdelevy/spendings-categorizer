import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEN = i18n.language === "en" || i18n.language.startsWith("en-");

  const toggle = () => {
    const next = isEN ? "pt-BR" : "en";
    i18n.changeLanguage(next);
    document.documentElement.lang = next === "en" ? "en" : "pt-BR";
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      title={isEN ? "Mudar para Português" : "Switch to English"}
    >
      {isEN ? "PT" : "EN"}
    </button>
  );
}
