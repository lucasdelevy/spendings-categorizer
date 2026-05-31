import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";
import { extractYearMonth, formatYearMonth } from "../utils";
import { parseCSV, processBankCSV, processCardCSV, toEngineConfig } from "@aletheia/shared";
import type { StatementResult, CategoryConfig, Account } from "@aletheia/shared";
import type { DetectedFile } from "./FamilyUploader";
import { useTheme } from "../theme/ThemeContext";

function detectMonth(result: StatementResult): string {
  const dates = result.transactions.map((t) => t.date).filter(Boolean);
  if (dates.length === 0) return "";
  return extractYearMonth(dates[0]);
}

interface Props {
  result: StatementResult;
  files: DetectedFile[];
  catConfig: CategoryConfig | null;
  accounts: Account[];
  onSaved: (yearMonth: string) => void;
}

export default function SaveConfirmBar({ result, files, catConfig, accounts, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const detected = detectMonth(result);
  const [yearMonth] = useState(detected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountByFile, setAccountByFile] = useState<Record<string, string>>({});

  const fileEntries = useMemo(
    () =>
      files.map((f) => ({
        file: f,
        key: `${f.type}::${f.name}`,
        candidates: accounts.filter((a) => a.type === f.type),
      })),
    [files, accounts],
  );

  useEffect(() => {
    setAccountByFile((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { key, candidates } of fileEntries) {
        if (next[key] || candidates.length !== 1) continue;
        next[key] = candidates[0].accountId;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [fileEntries]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const engineConfig = catConfig ? toEngineConfig(catConfig) : undefined;
      const saves = files.map((f) => {
        const parsed = parseCSV(f.text);
        const fileResult =
          f.type === "bank"
            ? processBankCSV(parsed.headers, parsed.rows, engineConfig)
            : processCardCSV(parsed.headers, parsed.rows, engineConfig);
        const key = `${f.type}::${f.name}`;
        const accountId = accountByFile[key] || undefined;
        return api.post("/statements", {
          yearMonth,
          type: f.type,
          fileName: f.name,
          accountId,
          summary: {
            type: f.type,
            totalIn: fileResult.totalIn,
            totalOut: fileResult.totalOut,
            balance: fileResult.balance,
            categories: fileResult.categories.map((c) => ({
              category: c.category,
              total: c.total,
              count: c.count,
            })),
          },
          transactions: fileResult.transactions.map((tx) => ({
            ...tx,
            ...(accountId ? { accountId } : {}),
          })),
        });
      });
      await Promise.all(saves);
      onSaved(yearMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t("save.confirmTitle", "Save statement")} — {formatYearMonth(yearMonth)}
      </Text>
      {error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("save.confirm", "Save")}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 16, marginVertical: 12 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
