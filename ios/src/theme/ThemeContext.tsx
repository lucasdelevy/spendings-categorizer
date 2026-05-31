import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerBg: string;
}

const LIGHT: ThemeColors = {
  background: "#f9fafb",
  surface: "#ffffff",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  primary: "#4f46e5",
  primaryText: "#4338ca",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
};

const DARK: ThemeColors = {
  background: "#111827",
  surface: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  border: "#374151",
  primary: "#818cf8",
  primaryText: "#a5b4fc",
  danger: "#f87171",
  dangerBg: "#450a0a",
};

const STORAGE_KEY = "theme_mode";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(system === "dark" ? "dark" : "light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === "dark" ? DARK : LIGHT,
      toggle,
      isDark: mode === "dark",
    }),
    [mode, toggle],
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
