import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { Account } from "@aletheia/shared";
import { api } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import OpenFinanceExpiredBanner, {
  openPierreApiKeyPage,
} from "../components/OpenFinanceExpiredBanner";
import { Button, TextField } from "../components/ui";
import { useAccounts } from "../hooks/useAccounts";
import { useTheme } from "../theme/ThemeContext";

const FIELD_SCREEN_TOP = 140;

function keyStatus(account: Account): "expired" | "active" | "none" {
  if (account.apiKeyExpired) return "expired";
  if (account.hasApiKey) return "active";
  return "none";
}

export default function AccountsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const { accounts, loading, refresh, update } = useAccounts(true);
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const pasteRefs = useRef<Record<string, View | null>>({});
  const focusedAccount = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh({ silent: true });
    }, [refresh]),
  );

  const syncAndRefresh = async () => {
    await api.post("/pierre/sync").catch(() => undefined);
    await refresh({ silent: true });
  };

  const onPullRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refresh({ silent: true });
      await syncAndRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const saveKey = async (accountId: string) => {
    const raw = (keyDrafts[accountId] ?? "").trim();
    if (!raw) return;
    setSavingId(accountId);
    setError(null);
    try {
      const targets = accounts.filter(
        (a) => a.accountId === accountId || a.apiKeyExpired,
      );
      for (const target of targets) {
        await update(target.accountId, { apiKey: raw });
        setKeyDrafts((prev) => ({ ...prev, [target.accountId]: "" }));
      }
      await syncAndRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.updateAccount"));
    } finally {
      setSavingId(null);
    }
  };

  const scrollPasteIntoView = (accountId: string) => {
    const node = pasteRefs.current[accountId];
    if (!node) return;
    node.measureInWindow((_x, y) => {
      const delta = y - FIELD_SCREEN_TOP;
      if (Math.abs(delta) < 8) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + delta),
        animated: true,
      });
    });
  };

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      const id = focusedAccount.current;
      if (id) scrollPasteIntoView(id);
    });
    return () => show.remove();
  }, []);

  const expiredCount = accounts.filter((a) => a.apiKeyExpired).length;

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      onScroll={(e) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onPullRefresh();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>{t("app.accounts")}</Text>
      </View>

      <OpenFinanceExpiredBanner accounts={accounts} />

      {error && (
        <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
      )}
      {loading && accounts.length === 0 && (
        <Text style={{ color: colors.textMuted }}>{t("app.loading", "Loading…")}</Text>
      )}
      {accounts.map((a) => {
        const status = keyStatus(a);
        const statusColor =
          status === "expired" ? colors.danger : status === "active" ? colors.success : colors.textMuted;
        const statusBg =
          status === "expired" ? colors.dangerBg : status === "active" ? colors.successBg : colors.surface;
        const statusBorder =
          status === "expired"
            ? colors.dangerBorder
            : status === "active"
              ? colors.successBorder
              : colors.border;
        return (
          <View
            key={a.accountId}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: status === "expired" ? colors.dangerBorder : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.name, { color: colors.text }]}>{a.name}</Text>
              <View style={[styles.statusChip, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {status === "expired"
                    ? t("accounts.apiKeyExpired")
                    : status === "active"
                      ? t("accounts.apiKeyActive")
                      : t("accounts.apiKeyNotSet")}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {a.type === "card" ? t("accounts.card", "Card") : t("accounts.bank", "Bank")}
              {a.closingDay ? ` · ${t("accounts.closingDay", "Closing")} ${a.closingDay}` : ""}
              {a.hasApiKey && a.apiKeyHint ? ` · ${a.apiKeyHint}` : ""}
            </Text>
            {a.apiKeyExpired && canManage && (
              <View style={styles.reconnect}>
                <Button
                  compact
                  label={t("accounts.getNewPierreKey")}
                  onPress={() => {
                    void openPierreApiKeyPage();
                  }}
                />
                {expiredCount > 1 && (
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {t("accounts.apiKeyAppliesToExpired")}
                  </Text>
                )}
                <View
                  collapsable={false}
                  ref={(el) => {
                    pasteRefs.current[a.accountId] = el;
                  }}
                  style={styles.paste}
                >
                  <TextField
                    label={t("accounts.apiKeyLabel")}
                    value={keyDrafts[a.accountId] ?? ""}
                    onChangeText={(value) =>
                      setKeyDrafts((prev) => ({ ...prev, [a.accountId]: value }))
                    }
                    placeholder={t("accounts.apiKeyPlaceholder")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onFocus={() => {
                      focusedAccount.current = a.accountId;
                      scrollPasteIntoView(a.accountId);
                    }}
                    onBlur={() => {
                      if (focusedAccount.current === a.accountId) {
                        focusedAccount.current = null;
                      }
                    }}
                    onSubmitEditing={() => {
                      void saveKey(a.accountId);
                    }}
                  />
                  <Button
                    compact
                    label={t("accounts.saveKey")}
                    disabled={savingId === a.accountId || !(keyDrafts[a.accountId] ?? "").trim()}
                    onPress={() => {
                      void saveKey(a.accountId);
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
      {accounts.length === 0 && !loading && (
        <Text style={{ color: colors.textMuted }}>{t("accounts.empty", "No accounts yet")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 160 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { fontWeight: "600", flex: 1 },
  statusChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  reconnect: { marginTop: 10, gap: 10 },
  paste: { gap: 10 },
});
