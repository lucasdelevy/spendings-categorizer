import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ptBR from "./pt-BR";

const LANGUAGE_KEY = "app_language";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      callback(stored);
      return;
    }
    const device = Localization.getLocales()[0]?.languageTag ?? "pt-BR";
    callback(device.startsWith("pt") ? "pt-BR" : "en");
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
    },
    fallbackLng: "pt-BR",
    interpolation: { escapeValue: false },
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

export async function setLanguage(lng: "en" | "pt-BR"): Promise<void> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
}
