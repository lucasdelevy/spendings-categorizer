import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ptBR from "./pt-BR";
import en from "./en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
    },
    fallbackLng: "pt-BR",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng.startsWith("pt") ? "pt-BR" : "en";
});

export default i18n;

export function resolveLocale(): string {
  const lang = i18n.language;
  if (lang === "pt-BR" || lang?.startsWith("pt")) return "pt-BR";
  return "en-US";
}

export function formatBRL(value: number): string {
  return value.toLocaleString(resolveLocale(), {
    style: "currency",
    currency: "BRL",
  });
}
