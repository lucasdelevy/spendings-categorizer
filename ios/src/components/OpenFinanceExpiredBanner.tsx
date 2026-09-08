import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import type { Account } from "@aletheia/shared";
import { useTheme } from "../theme/ThemeContext";
import { Button } from "./ui";

export const PIERRE_API_KEY_URL = "https://pierre.finance/api-key";

export function expiredApiKeyAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.apiKeyExpired);
}

export async function openPierreApiKeyPage(): Promise<void> {
  await WebBrowser.openBrowserAsync(PIERRE_API_KEY_URL);
}

interface Props {
  accounts: Account[];
  onManageAccounts?: () => void;
}

export default function OpenFinanceExpiredBanner({ accounts, onManageAccounts }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const expired = expiredApiKeyAccounts(accounts);
  if (expired.length === 0) return null;

  const names = expired.map((a) => a.name).join(", ");

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
      ]}
    >
      <Ionicons name="warning-outline" size={20} color={colors.danger} style={styles.icon} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.danger }]}>
          {t("accounts.apiKeyExpiredBanner")}
        </Text>
        <Text style={[styles.body, { color: colors.danger }]}>
          {t("accounts.apiKeyExpiredBody", { names })}
        </Text>
        <View style={styles.actions}>
          <Button
            compact
            label={t("accounts.getNewPierreKey")}
            onPress={() => {
              void openPierreApiKeyPage();
            }}
          />
          {onManageAccounts ? (
            <Pressable onPress={onManageAccounts} hitSlop={8}>
              <Text style={[styles.link, { color: colors.danger }]}>
                {t("accounts.pasteKeyOnAccount")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  icon: { marginTop: 1 },
  copy: { flex: 1, gap: 6 },
  title: { fontSize: 14, fontWeight: "600" },
  body: { fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 4 },
  link: { fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
});
