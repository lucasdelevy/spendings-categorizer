import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { CategoryConfig, LimitPeriod } from "@aletheia/shared";
import { clampLimitAlertPercent } from "@aletheia/shared";
import { Button, Card, SegmentedControl, TextField } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import { useCategoryConfig } from "../hooks/useCategoryConfig";
import { useTheme } from "../theme/ThemeContext";

type Section = "categories" | "ignore" | "rename";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#111827",
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.primaryMutedBg }]}>
      <Text style={{ color: colors.text, fontSize: 12, flexShrink: 1 }}>{label}</Text>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button">
        <Ionicons name="close" size={14} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function CategoryEditor({
  color,
  keywords,
  limit,
  onColor,
  onAddKeyword,
  onRemoveKeyword,
  onSetLimit,
  onRemoveLimit,
  onChangeLimitAmount,
  onChangeLimitPeriod,
  onRename,
  onDelete,
}: {
  color: string;
  keywords: string[];
  limit?: { amount: number; period: LimitPeriod };
  onColor: (color: string) => void;
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onSetLimit: () => void;
  onRemoveLimit: () => void;
  onChangeLimitAmount: (raw: string) => void;
  onChangeLimitPeriod: (period: LimitPeriod) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showPalette, setShowPalette] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const swatches = PALETTE.includes(color) ? PALETTE : [color, ...PALETTE];

  return (
    <View style={[styles.catBody, { borderTopColor: colors.border }]}>
      <Pressable
        onPress={() => setShowPalette((open) => !open)}
        style={[
          styles.disclosure,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: showPalette }}
        accessibilityLabel={t("categories.color")}
      >
        <View style={[styles.dotLg, { backgroundColor: color }]} />
        <Text style={[styles.disclosureLabel, { color: colors.text }]}>{t("categories.color")}</Text>
        <Ionicons
          name={showPalette ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
      {showPalette ? (
        <View style={styles.swatches}>
          {swatches.map((swatch) => (
            <Pressable
              key={swatch}
              onPress={() => {
                onColor(swatch);
                setShowPalette(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={swatch}
              style={[
                styles.swatch,
                { backgroundColor: swatch },
                color === swatch ? { borderColor: colors.text, borderWidth: 2 } : null,
              ]}
            />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => setShowKeywords((open) => !open)}
        style={[
          styles.disclosure,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: showKeywords }}
        accessibilityLabel={t("categories.keywordsCount", { count: keywords.length })}
      >
        <Text style={[styles.disclosureLabel, { color: colors.text }]}>
          {t("categories.keywordsCount", { count: keywords.length })}
        </Text>
        <Ionicons
          name={showKeywords ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
      {showKeywords ? (
        <View style={styles.keywordsBody}>
          <View style={styles.chipWrap}>
            {keywords.map((kw) => (
              <RemovableChip key={kw} label={kw} onRemove={() => onRemoveKeyword(kw)} />
            ))}
            {keywords.length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("categories.noKeywords")}</Text>
            )}
          </View>
          <AddRow
            placeholder={t("categories.newKeyword")}
            onAdd={(keyword) => onAddKeyword(keyword.toLowerCase())}
          />
        </View>
      ) : null}

      {limit ? (
        <View style={styles.limitBlock}>
          <TextField
            label={t("categories.limitAmount")}
            value={limit.amount ? String(limit.amount) : ""}
            onChangeText={onChangeLimitAmount}
            keyboardType="decimal-pad"
          />
          <SegmentedControl
            options={[
              { value: "daily", label: t("categories.limitDaily") },
              { value: "weekly", label: t("categories.limitWeekly") },
              { value: "monthly", label: t("categories.limitMonthly") },
            ]}
            value={limit.period}
            onChange={onChangeLimitPeriod}
          />
          <Button compact variant="ghost" label={t("categories.removeLimit")} onPress={onRemoveLimit} />
        </View>
      ) : (
        <Button compact variant="secondary" label={t("categories.setLimit")} onPress={onSetLimit} />
      )}

      <View style={styles.catActions}>
        <Button compact variant="secondary" label={t("categories.renameTitle")} onPress={onRename} />
        <Button compact variant="ghost" label={t("categories.deleteTitle")} onPress={onDelete} />
      </View>
    </View>
  );
}

function AddRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <View style={styles.addRow}>
      <View style={styles.addField}>
        <TextField
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>
      <Button compact label={t("categories.add")} onPress={submit} />
    </View>
  );
}

export default function CategoriesScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const { config, loading, save } = useCategoryConfig(true);
  const [draft, setDraft] = useState<CategoryConfig | null>(null);
  const [section, setSection] = useState<Section>("categories");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renameRaw, setRenameRaw] = useState("");
  const [renameDisplay, setRenameDisplay] = useState("");
  const [thresholdText, setThresholdText] = useState("80");

  useEffect(() => {
    if (config) {
      setDraft(deepClone(config));
      setThresholdText(String(config.limitAlertPercent ?? 80));
      setDirty(false);
    }
  }, [config]);

  const sortLocale = i18n.language.startsWith("pt") ? "pt-BR" : "en";
  const categoryNames = useMemo(() => {
    if (!draft) return [];
    return Object.keys(draft.categories).sort((a, b) => a.localeCompare(b, sortLocale));
  }, [draft, sortLocale]);

  const updateDraft = (fn: (d: CategoryConfig) => void) => {
    if (!canManage) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const next = deepClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const commitThreshold = (raw: string) => {
    const next = clampLimitAlertPercent(raw === "" ? 80 : raw);
    setThresholdText(String(next));
    updateDraft((d) => {
      d.limitAlertPercent = next;
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    const percent = clampLimitAlertPercent(thresholdText === "" ? 80 : thresholdText);
    const toSave = { ...draft, limitAlertPercent: percent };
    setDraft(toSave);
    setThresholdText(String(percent));
    setSaving(true);
    setError(null);
    try {
      await save(toSave);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.save"));
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    updateDraft((d) => {
      if (!d.categories[name]) {
        d.categories[name] = { keywords: [], color: "#6b7280" };
      }
    });
    setNewCategoryName("");
    setExpanded(name);
  };

  const renameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    updateDraft((d) => {
      if (d.categories[trimmed]) return;
      d.categories[trimmed] = d.categories[oldName];
      delete d.categories[oldName];
    });
    if (expanded === oldName) setExpanded(trimmed);
  };

  const promptRename = (name: string) => {
    Alert.prompt(
      t("categories.renameTitle"),
      t("categories.renamePrompt"),
      [
        { text: t("categories.deleteCancel"), style: "cancel" },
        {
          text: t("categories.renameTitle"),
          onPress: (value) => {
            if (value) renameCategory(name, value);
          },
        },
      ],
      "plain-text",
      name,
    );
  };

  const confirmDelete = (name: string) => {
    Alert.alert(
      t("categories.deleteConfirmTitle", { name }),
      `${t("categories.deleteConfirmBody")}\n\n${t("categories.deleteConfirmRecategorize")}`,
      [
        { text: t("categories.deleteCancel"), style: "cancel" },
        {
          text: t("categories.deleteConfirmAction"),
          style: "destructive",
          onPress: () => {
            updateDraft((d) => {
              delete d.categories[name];
            });
            if (expanded === name) setExpanded(null);
          },
        },
      ],
    );
  };

  if (loading || !draft) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>{t("app.loading", "Loading…")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t("categories.title")}</Text>
          {dirty && canManage ? (
            <Button
              compact
              label={saving ? t("categories.saving") : t("categories.saveChanges")}
              disabled={saving}
              onPress={() => {
                void handleSave();
              }}
            />
          ) : null}
        </View>

        {error ? (
          <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
        ) : null}

        {!canManage ? (
          <Text style={{ color: colors.textMuted, marginBottom: 12 }}>{t("family.managersOnly")}</Text>
        ) : null}

        <SegmentedControl
          options={[
            { value: "categories", label: t("categories.sectionCategories") },
            { value: "ignore", label: t("categories.sectionIgnore") },
            { value: "rename", label: t("categories.sectionRename") },
          ]}
          value={section}
          onChange={setSection}
        />

        {section === "categories" && (
          <Card style={styles.panel}>
            <TextField
              label={t("categories.alertThreshold")}
              value={thresholdText}
              onChangeText={(raw) => {
                setThresholdText(raw.replace(/\D/g, "").slice(0, 3));
                setDirty(true);
              }}
              onBlur={() => commitThreshold(thresholdText)}
              keyboardType="number-pad"
              placeholder="80"
            />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              {t("categories.alertThresholdHint")}
            </Text>
          </Card>
        )}

        {section === "categories" && (
          <View style={styles.sectionBody}>
            {categoryNames.map((name) => {
              const entry = draft.categories[name];
              const isOpen = expanded === name;
              return (
                <Card key={name}>
                  <Pressable
                    onPress={() => setExpanded(isOpen ? null : name)}
                    style={styles.catHeader}
                  >
                    <View style={[styles.dot, { backgroundColor: entry.color }]} />
                    <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {isOpen ? (
                    <CategoryEditor
                      color={entry.color}
                      keywords={entry.keywords}
                      limit={entry.limit}
                      onColor={(color) =>
                        updateDraft((d) => {
                          if (d.categories[name]) d.categories[name].color = color;
                        })
                      }
                      onAddKeyword={(keyword) =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat && !cat.keywords.includes(keyword)) cat.keywords.push(keyword);
                        })
                      }
                      onRemoveKeyword={(keyword) =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat) cat.keywords = cat.keywords.filter((k) => k !== keyword);
                        })
                      }
                      onSetLimit={() =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat) cat.limit = { amount: 0, period: "monthly" };
                        })
                      }
                      onRemoveLimit={() =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat) delete cat.limit;
                        })
                      }
                      onChangeLimitAmount={(raw) =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat?.limit) {
                            cat.limit.amount = raw === "" ? 0 : Math.max(0, parseFloat(raw) || 0);
                          }
                        })
                      }
                      onChangeLimitPeriod={(period) =>
                        updateDraft((d) => {
                          const cat = d.categories[name];
                          if (cat?.limit) cat.limit.period = period;
                        })
                      }
                      onRename={() => promptRename(name)}
                      onDelete={() => confirmDelete(name)}
                    />
                  ) : null}
                </Card>
              );
            })}

            <View style={styles.addRow}>
              <View style={styles.addField}>
                <TextField
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder={t("categories.newCategory")}
                  returnKeyType="done"
                  onSubmitEditing={addCategory}
                />
              </View>
              <Button compact label={t("categories.createCategory")} onPress={addCategory} />
            </View>
          </View>
        )}

        {section === "ignore" && (
          <Card style={styles.panel}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
              {t("categories.ignoreDescription")}
            </Text>
            <View style={styles.chipWrap}>
              {draft.ignore.map((pattern) => (
                <RemovableChip
                  key={pattern}
                  label={pattern}
                  onRemove={() =>
                    updateDraft((d) => {
                      d.ignore = d.ignore.filter((p) => p !== pattern);
                    })
                  }
                />
              ))}
              {draft.ignore.length === 0 && (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {t("categories.noIgnoreFilters")}
                </Text>
              )}
            </View>
            <AddRow
              placeholder={t("categories.newIgnorePattern")}
              onAdd={(pattern) => {
                const lower = pattern.toLowerCase();
                updateDraft((d) => {
                  if (!d.ignore.includes(lower)) d.ignore.push(lower);
                });
              }}
            />
          </Card>
        )}

        {section === "rename" && (
          <Card style={styles.panel}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
              {t("categories.renameDescription")}
            </Text>
            {Object.entries(draft.rename).map(([raw, display]) => (
              <View
                key={raw}
                style={[styles.mapping, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Text style={{ color: colors.textMuted, flex: 1 }} numberOfLines={1}>
                  {raw}
                </Text>
                <Text style={{ color: colors.textMuted }}>→</Text>
                <Text style={{ color: colors.text, flex: 1, fontWeight: "600" }} numberOfLines={1}>
                  {display}
                </Text>
                <Pressable
                  onPress={() =>
                    updateDraft((d) => {
                      delete d.rename[raw];
                    })
                  }
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
            {Object.keys(draft.rename).length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                {t("categories.noMappings")}
              </Text>
            )}
            <TextField
              value={renameRaw}
              onChangeText={setRenameRaw}
              placeholder={t("categories.originalName")}
              autoCapitalize="none"
            />
            <TextField
              value={renameDisplay}
              onChangeText={setRenameDisplay}
              placeholder={t("categories.displayName")}
              autoCapitalize="none"
            />
            <Button
              compact
              label={t("categories.add")}
              onPress={() => {
                if (!renameRaw.trim() || !renameDisplay.trim()) return;
                const key = renameRaw.trim().toLowerCase();
                const display = renameDisplay.trim();
                updateDraft((d) => {
                  d.rename[key] = display;
                });
                setRenameRaw("");
                setRenameDisplay("");
              }}
            />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: { fontSize: 22, fontWeight: "700" },
  sectionBody: { gap: 8 },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  catName: { flex: 1, fontWeight: "600", fontSize: 15 },
  catBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  disclosure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  disclosureLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  dotLg: { width: 22, height: 22, borderRadius: 11 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 2 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "transparent" },
  keywordsBody: { gap: 10 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  addField: { flex: 1 },
  limitBlock: { gap: 10 },
  catActions: { flexDirection: "row", gap: 8 },
  panel: { padding: 12, gap: 10 },
  mapping: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
});
