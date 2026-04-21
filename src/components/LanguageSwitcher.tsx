import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEN = i18n.language === "en" || i18n.language.startsWith("en-");

  const set = (lang: "en" | "pt-BR") => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  };

  const base =
    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition";
  const active =
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300";
  const inactive =
    "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700";

  return (
    <div className="flex gap-1">
      <button
        onClick={() => set("pt-BR")}
        className={`${base} ${!isEN ? active : inactive}`}
      >
        <span className="text-base leading-none">{"\u{1F1E7}\u{1F1F7}"}</span>
        PT
      </button>
      <button
        onClick={() => set("en")}
        className={`${base} ${isEN ? active : inactive}`}
      >
        <span className="text-base leading-none">{"\u{1F1FA}\u{1F1F8}"}</span>
        EN
      </button>
    </div>
  );
}
