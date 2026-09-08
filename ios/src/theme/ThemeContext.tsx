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
import { StyleSheet, useColorScheme, View } from "react-native";
import BrandSplash from "../components/BrandSplash";

export type ThemeMode = "light" | "dark";

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  placeholder: string;
  border: string;
  primary: string;
  primaryText: string;
  primaryMutedBg: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  success: string;
  successBg: string;
  successBorder: string;
  chartBar: string;
  chartLine: string;
}

const LIGHT: ThemeColors = {
  background: "#f9fafb",
  surface: "#ffffff",
  text: "#111827",
  textMuted: "#6b7280",
  placeholder: "#9ca3af",
  border: "#e5e7eb",
  primary: "#4f46e5",
  primaryText: "#4338ca",
  primaryMutedBg: "#eef2ff",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  chartBar: "#6366f1",
  chartLine: "#f59e0b",
};

const DARK: ThemeColors = {
  background: "#111827",
  surface: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  placeholder: "#6b7280",
  border: "#374151",
  primary: "#818cf8",
  primaryText: "#a5b4fc",
  primaryMutedBg: "#312e81",
  danger: "#f87171",
  dangerBg: "#450a0a",
  dangerBorder: "#991b1b",
  success: "#34d399",
  successBg: "#064e3b",
  successBorder: "#065f46",
  chartBar: "#818cf8",
  chartLine: "#fbbf24",
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

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {!loaded && (
          <View style={StyleSheet.absoluteFillObject}>
            <BrandSplash />
          </View>
        )}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
