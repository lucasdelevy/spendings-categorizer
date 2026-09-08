import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api, setToken, clearToken, isAuthenticated } from "./api";
import type { FamilyRole } from "./permissions";

interface User {
  email: string;
  name: string;
  picture: string;
  familyId: string | null;
  familyRole: FamilyRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (googleIdToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    api
      .get<{ user: User }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (googleIdToken: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/google", {
      idToken: googleIdToken,
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/email", {
      email,
      password,
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      return;
    }
    const res = await api.get<{ user: User }>("/auth/me");
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.delete("/auth/me");
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, logout, deleteAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
