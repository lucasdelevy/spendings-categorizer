import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { CategoryConfig, Transaction } from "@aletheia/shared";
import { getCategoryColorFromConfig, cleanPayeeName } from "@aletheia/shared";
import { formatBRL } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import { Button, TextField } from "./ui";

type Tab = "recategorize" | "rename" | "ignore";

export interface RecategorizePayload {
  globalIndex: number;
  newCategory: string;
  keyword: string;
  createCategory?: boolean;
  color?: string;
  applyToSimilar?: boolean;
}

export interface RenamePayload {
  globalIndex: number;
  newPayeeName: string;
}

export interface IgnorePayload {
  globalIndex: number;
}

interface Props {
  transaction: Transaction;
  globalIndex: number;
  currentCategory: string;
  allCategories: string[];
  catConfig: CategoryConfig | null;
  onRecategorize: (payload: RecategorizePayload) => void;
  onRename: (payload: RenamePayload) => void;
  onIgnore: (payload: IgnorePayload) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#f472b6", "#78716c", "#64748b",
];

export default function TransactionActionModal({
  transaction,
  globalIndex,
  currentCategory,
  allCategories,
  catConfig,
  onRecategorize,
  onRename,
  onIgnore,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("recategorize");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [applyToSimilar, setApplyToSimilar] = useState(true);
  const [renameName, setRenameName] = useState(transaction.payee);
  const [loading, setLoading] = useState(false);

  const handleRecategorize = (category: string) => {
    setLoading(true);
    onRecategorize({
      globalIndex,
      newCategory: category,
      keyword: transaction.originalDescription.toLowerCase(),
      applyToSimilar,
    });
  };

  const handleCreateAndRecategorize = () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    onRecategorize({
      globalIndex,
      newCategory: newCatName.trim(),
      keyword: transaction.originalDescription.toLowerCase(),
      createCategory: true,
      color: newCatColor,
      applyToSimilar,
    });
  };

  const handleRename = () => {
    if (!renameName.trim() || renameName === transaction.payee) return;
    setLoading(true);
    onRename({ globalIndex, newPayeeName: renameName.trim() });
  };

  const handleIgnore = () => {
    setLoading(true);
    onIgnore({ globalIndex });
  };

  const tabs: Tab[] = ["recategorize", "rename", "ignore"];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerCopy}>
              <Text style={[styles.payee, { color: colors.text }]} numberOfLines={1}>
                {cleanPayeeName(transaction.payee)}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                {transaction.originalDescription}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                {transaction.date} · {formatBRL(transaction.amount)}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>×</Text>
            </Pressable>
          </View>

          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
            {tabs.map((tabKey) => (
              <Pressable
                key={tabKey}
                onPress={() => setTab(tabKey)}
                style={[
                  styles.tab,
                  tab === tabKey ? { borderBottomColor: colors.primary, borderBottomWidth: 2 } : null,
                ]}
              >
                <Text
                  style={{
                    color: tab === tabKey ? colors.primary : colors.textMuted,
                    fontWeight: tab === tabKey ? "600" : "500",
                    fontSize: 13,
                  }}
                >
                  {t(`modal.${tabKey}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
            ) : tab === "recategorize" ? (
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <Switch value={applyToSimilar} onValueChange={setApplyToSimilar} />
                  <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>
                    {t("modal.applyToSimilar")}
                  </Text>
                </View>
                {allCategories
                  .filter((c) => c !== currentCategory)
                  .map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => handleRecategorize(c)}
                      style={[styles.categoryOption, { borderColor: colors.border }]}
                    >
                      <View
                        style={[styles.dot, { backgroundColor: getCategoryColorFromConfig(c, catConfig) }]}
                      />
                      <Text style={{ color: colors.text }}>{c}</Text>
                    </Pressable>
                  ))}
                <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 12 }]}>
                  {t("modal.createNewCategory")}
                </Text>
                <TextField
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder={t("modal.categoryName")}
                />
                <View style={styles.colorRow}>
                  {PRESET_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setNewCatColor(color)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        newCatColor === color ? styles.colorSelected : null,
                      ]}
                    />
                  ))}
                </View>
                <Button
                  label={t("modal.createAndMove")}
                  onPress={handleCreateAndRecategorize}
                  disabled={!newCatName.trim()}
                />
              </View>
            ) : tab === "rename" ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  {t("modal.originalDescription")}
                </Text>
                <Text style={{ color: colors.text, marginBottom: 12 }}>{transaction.originalDescription}</Text>
                <TextField
                  label={t("modal.newDisplayName")}
                  value={renameName}
                  onChangeText={setRenameName}
                />
                <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                  {t("modal.renameHint")}
                </Text>
                <Button
                  label={t("modal.renameButton")}
                  onPress={handleRename}
                  disabled={!renameName.trim() || renameName === transaction.payee}
                />
              </View>
            ) : (
              <View style={styles.section}>
                <View style={[styles.warningBox, { backgroundColor: colors.dangerBg }]}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>{t("modal.ignoreWarning")}</Text>
                </View>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  {t("modal.descriptionToIgnore")}
                </Text>
                <Text style={{ color: colors.text, marginBottom: 12, fontWeight: "500" }}>
                  {transaction.originalDescription}
                </Text>
                <Button label={t("modal.confirmAndRemove")} onPress={handleIgnore} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: "85%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCopy: { flex: 1 },
  payee: { fontSize: 15, fontWeight: "600" },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  body: { maxHeight: 400 },
  section: { padding: 16, gap: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  sectionLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 2, borderColor: "#111827" },
  warningBox: { padding: 12, borderRadius: 8 },
});
