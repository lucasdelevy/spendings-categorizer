import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { api, clearToken, isAuthenticated, setToken, setUnauthorizedHandler } from "./api";
import type { FamilyRole } from "./permissions";
import { registerPushNotifications, unregisterPushNotifications } from "../notifications/registerPush";

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  familyId: string | null;
  familyRole: FamilyRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (googleIdToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    (async () => {
      if (!(await isAuthenticated())) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<{ user: AuthUser }>("/auth/me");
        setUser(res.user);
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    void registerPushNotifications(i18n.language).catch((err) => {
      console.warn("Push registration failed:", err);
    });
  }, [user, i18n.language]);

  const login = useCallback(async (googleIdToken: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/google", {
      idToken: googleIdToken,
    });
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const loginWithApple = useCallback(async (identityToken: string, fullName?: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/apple", {
      identityToken,
      fullName,
    });
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!(await isAuthenticated())) {
      setUser(null);
      return;
    }
    const res = await api.get<{ user: AuthUser }>("/auth/me");
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await unregisterPushNotifications();
      await api.post("/auth/logout");
    } finally {
      await clearToken();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await unregisterPushNotifications();
    } catch {
      // Continue deleting even if the device token cannot be unregistered.
    }
    await api.delete("/auth/me");
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithApple, logout, deleteAccount, refreshUser }),
    [user, loading, login, loginWithApple, logout, deleteAccount, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
