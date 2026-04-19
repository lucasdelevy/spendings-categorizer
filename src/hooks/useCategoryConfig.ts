import { useState, useEffect, useCallback } from "react";
import { api } from "../auth/api";
import type { CategoryConfig } from "../types";

interface UseCategoryConfigResult {
  config: CategoryConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (config: CategoryConfig) => Promise<void>;
}

export function useCategoryConfig(authenticated: boolean): UseCategoryConfigResult {
  const [config, setConfig] = useState<CategoryConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CategoryConfig>("/categories");
      setConfig(data);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (updated: CategoryConfig) => {
    const data = await api.put<CategoryConfig>("/categories", updated);
    setConfig(data);
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchConfig();
    }
  }, [authenticated, fetchConfig]);

  return { config, loading, refresh: fetchConfig, save };
}
