import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { PaymentReminder } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import { Button, Card, TextField } from "../components/ui";
import { useReminders } from "../hooks/useReminders";
import { useTheme } from "../theme/ThemeContext";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthOptions(from: string, count: number): string[] {
  const year = parseInt(from.slice(0, 4), 10);
  const month = parseInt(from.slice(4, 6), 10);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1 - i, 1);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function formatYearMonth(ym: string, locale: string): string {
  const date = new Date(parseInt(ym.slice(0, 4), 10), parseInt(ym.slice(4, 6), 10) - 1, 1);
  const text = date.toLocaleDateString(locale.startsWith("pt") ? "pt-BR" : "en-US", {
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function RemindersScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const [month, setMonth] = useState(currentYearMonth());
  const months = useMemo(() => monthOptions(currentYearMonth(), 12), []);
  const { reminders, notifyTime, loading, refresh, create, update, remove, setPaid, setNotifyTime } =
    useReminders(true, month);
  const [name, setName] = useState("");
  const [day, setDay] = useState("5");
  const [timeDraft, setTimeDraft] = useState(notifyTime);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState("5");
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimeDraft(notifyTime);
  }, [notifyTime]);

  const locale = i18n.language;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    const dayOfMonth = parseInt(day, 10);
    if (!name.trim() || !Number.isFinite(dayOfMonth)) return;
    setError(null);
    try {
      await create({ name: name.trim(), dayOfMonth });
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    }
  };

  const handleSaveEdit = async (reminder: PaymentReminder) => {
    const dayOfMonth = parseInt(editDay, 10);
    if (!editName.trim() || !Number.isFinite(dayOfMonth)) return;
    setError(null);
    try {
      await update(reminder.reminderId, { name: editName.trim(), dayOfMonth });
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    }
  };

  const handleDelete = (reminder: PaymentReminder) => {
    Alert.alert(t("reminders.delete"), t("reminders.deleteConfirm", { name: reminder.name }), [
      { text: t("reminders.cancel"), style: "cancel" },
      {
        text: t("reminders.delete"),
        style: "destructive",
        onPress: () => {
          void remove(reminder.reminderId).catch((e) => {
            setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
          });
        },
      },
    ]);
  };

  const handleSaveTime = async () => {
    setError(null);
    try {
      await setNotifyTime(timeDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <Text style={[styles.intro, { color: colors.textMuted }]}>{t("reminders.intro")}</Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Card style={styles.card}>
        <View style={styles.pad}>
          <TextField
            label={t("reminders.notifyTime")}
            value={timeDraft}
            onChangeText={setTimeDraft}
            placeholder="09:00"
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t("reminders.notifyTimeHint")}</Text>
          <Button label={t("reminders.saveTime")} compact onPress={() => void handleSaveTime()} />
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
        {months.map((ym) => {
          const selected = ym === month;
          return (
            <Pressable
              key={ym}
              onPress={() => setMonth(ym)}
              style={[
                styles.monthChip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryMutedBg : colors.surface,
                },
              ]}
            >
              <Text style={{ color: selected ? colors.primary : colors.text, fontSize: 12, fontWeight: "600" }}>
                {formatYearMonth(ym, locale)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && reminders.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t("reminders.loading")}</Text>
      ) : null}
      {!loading && reminders.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t("reminders.empty")}</Text>
      ) : null}

      {reminders.map((reminder) => (
        <Card key={reminder.reminderId} style={styles.card}>
          <View style={styles.pad}>
            {editingId === reminder.reminderId ? (
              <>
                <TextField label={t("reminders.newTitle")} value={editName} onChangeText={setEditName} />
                <TextField
                  label={t("reminders.dayOfMonth")}
                  value={editDay}
                  onChangeText={setEditDay}
                  keyboardType="number-pad"
                />
                <View style={styles.row}>
                  <Button label={t("reminders.save")} compact onPress={() => void handleSaveEdit(reminder)} />
                  <Button label={t("reminders.cancel")} variant="ghost" compact onPress={() => setEditingId(null)} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{reminder.name}</Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                      {t("reminders.dayLabel", { day: reminder.dayOfMonth })}
                    </Text>
                  </View>
                  <View style={styles.paidRow}>
                    <Text style={{ color: colors.text, marginRight: 8 }}>{t("reminders.paid")}</Text>
                    <Switch
                      value={reminder.paid}
                      onValueChange={(paid) => {
                        void setPaid(reminder.reminderId, paid).catch((e) => {
                          setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
                        });
                      }}
                    />
                  </View>
                </View>
                {canManage ? (
                  <View style={styles.row}>
                    <Button
                      label={t("reminders.edit")}
                      variant="ghost"
                      compact
                      onPress={() => {
                        setEditingId(reminder.reminderId);
                        setEditName(reminder.name);
                        setEditDay(String(reminder.dayOfMonth));
                      }}
                    />
                    <Button
                      label={t("reminders.delete")}
                      variant="ghost"
                      compact
                      onPress={() => handleDelete(reminder)}
                    />
                  </View>
                ) : null}
                <Pressable
                  onPress={() =>
                    setOpenHistory(openHistory === reminder.reminderId ? null : reminder.reminderId)
                  }
                >
                  <Text style={{ color: colors.primary, marginTop: 8, fontSize: 12, fontWeight: "600" }}>
                    {openHistory === reminder.reminderId ? t("reminders.hideHistory") : t("reminders.showHistory")}
                  </Text>
                </Pressable>
                {openHistory === reminder.reminderId
                  ? reminder.history.map((row) => (
                      <View key={row.yearMonth} style={styles.historyRow}>
                        <Text style={{ color: colors.text }}>{formatYearMonth(row.yearMonth, locale)}</Text>
                        <Text style={{ color: colors.textMuted }}>
                          {row.paid
                            ? t("reminders.paidOn", { who: row.paidByName || "—" })
                            : t("reminders.unpaid")}
                        </Text>
                      </View>
                    ))
                  : null}
              </>
            )}
          </View>
        </Card>
      ))}

      {canManage ? (
        <Card style={styles.card}>
          <View style={styles.pad}>
            <Text style={[styles.name, { color: colors.text }]}>{t("reminders.newTitle")}</Text>
            <TextField
              label={t("reminders.newTitle")}
              value={name}
              onChangeText={setName}
              placeholder={t("reminders.namePlaceholder")}
            />
            <TextField
              label={t("reminders.dayOfMonth")}
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
            />
            <Button label={t("reminders.create")} onPress={() => void handleCreate()} />
          </View>
        </Card>
      ) : (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("reminders.membersReadOnly")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13 },
  card: { overflow: "hidden" },
  pad: { padding: 14, gap: 10 },
  hint: { fontSize: 12 },
  months: { gap: 8, paddingVertical: 4 },
  monthChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  paidRow: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
});
