import { useEffect, useState } from "react";
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
import type { ReminderRecurrence, ReminderSeries } from "@aletheia/shared";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily } from "../auth/permissions";
import { Button, Card, SegmentedControl, TextField } from "../components/ui";
import { useReminders } from "../hooks/useReminders";
import { useTheme } from "../theme/ThemeContext";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatYearMonth(ym: string, locale: string): string {
  const date = new Date(parseInt(ym.slice(0, 4), 10), parseInt(ym.slice(4, 6), 10) - 1, 1);
  const text = date.toLocaleDateString(locale.startsWith("pt") ? "pt-BR" : "en-US", {
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatIsoDate(date: string, locale: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale.startsWith("pt") ? "pt-BR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function recurrenceKey(value: ReminderRecurrence): string {
  return `reminders.recurrence${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default function RemindersScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const canManage = canManageFamily(user);
  const { months, series, notifyTime, loading, refresh, create, update, remove, setPaid, setNotifyTime } =
    useReminders(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<ReminderSeries | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>("monthly");
  const [timeDraft, setTimeDraft] = useState(notifyTime);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const locale = i18n.language;
  const hasOccurrences = months.some((month) => month.occurrences.length > 0);

  useEffect(() => {
    setTimeDraft(notifyTime);
  }, [notifyTime]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setStartDate(todayIso());
    setRecurrence("monthly");
    setError(null);
    setView("form");
  };

  const openEdit = (reminderId: string) => {
    const item = series.find((s) => s.reminderId === reminderId);
    if (!item) return;
    setEditing(item);
    setName(item.name);
    setStartDate(item.startDate);
    setRecurrence(item.recurrence);
    setError(null);
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setEditing(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !startDate) return;
    setError(null);
    try {
      const payload = { name: name.trim(), startDate, recurrence };
      if (editing) await update(editing.reminderId, payload);
      else await create(payload);
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
    }
  };

  const handleDelete = (item: ReminderSeries) => {
    Alert.alert(t("reminders.delete"), t("reminders.deleteConfirm", { name: item.name }), [
      { text: t("reminders.cancel"), style: "cancel" },
      {
        text: t("reminders.delete"),
        style: "destructive",
        onPress: () => {
          void remove(item.reminderId)
            .then(() => closeForm())
            .catch((e) => {
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

  if (view === "form") {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={closeForm}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>← {t("reminders.back")}</Text>
        </Pressable>
        <Text style={[styles.name, { color: colors.text }]}>
          {editing ? t("reminders.editTitle") : t("reminders.newTitle")}
        </Text>
        <Text style={[styles.intro, { color: colors.textMuted }]}>{t("reminders.formIntro")}</Text>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Card style={styles.card}>
          <View style={styles.pad}>
            <TextField
              label={t("reminders.name")}
              value={name}
              onChangeText={setName}
              placeholder={t("reminders.namePlaceholder")}
            />
            <TextField
              label={t("reminders.startDate")}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>{t("reminders.recurrence")}</Text>
            <SegmentedControl
              value={recurrence}
              onChange={setRecurrence}
              options={[
                { value: "once", label: t("reminders.recurrenceOnce") },
                { value: "monthly", label: t("reminders.recurrenceMonthly") },
                { value: "yearly", label: t("reminders.recurrenceYearly") },
              ]}
            />
            <Button
              label={editing ? t("reminders.save") : t("reminders.create")}
              onPress={() => void handleSave()}
            />
            {editing ? (
              <Button
                label={t("reminders.delete")}
                variant="ghost"
                onPress={() => handleDelete(editing)}
              />
            ) : null}
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.intro, { color: colors.textMuted, flex: 1 }]}>{t("reminders.intro")}</Text>
      </View>
      {canManage ? (
        <Button label={t("reminders.create")} onPress={openCreate} />
      ) : (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("reminders.membersReadOnly")}</Text>
      )}
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

      {loading && !hasOccurrences ? (
        <Text style={{ color: colors.textMuted }}>{t("reminders.loading")}</Text>
      ) : null}
      {!loading && !hasOccurrences ? (
        <Text style={{ color: colors.textMuted }}>{t("reminders.empty")}</Text>
      ) : null}

      {months.map((month) => (
        <View key={month.yearMonth} style={{ gap: 8 }}>
          <Text style={[styles.monthTitle, { color: colors.textMuted }]}>
            {formatYearMonth(month.yearMonth, locale)}
          </Text>
          {month.occurrences.map((occ) => (
            <Card key={`${occ.reminderId}-${occ.date}`} style={styles.card}>
              <View style={styles.pad}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{occ.name}</Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                      {formatIsoDate(occ.date, locale)} · {t(recurrenceKey(occ.recurrence))}
                    </Text>
                    {occ.paid && occ.paidByName ? (
                      <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                        {t("reminders.paidOn", { who: occ.paidByName })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.paidRow}>
                    <Text style={{ color: colors.text, marginRight: 8 }}>{t("reminders.paid")}</Text>
                    <Switch
                      value={occ.paid}
                      onValueChange={(paid) => {
                        void setPaid(occ.reminderId, paid, occ.date).catch((e) => {
                          setError(e instanceof Error ? e.message : t("reminders.saveFailed"));
                        });
                      }}
                    />
                  </View>
                </View>
                {canManage ? (
                  <Button
                    label={t("reminders.editSeries")}
                    variant="ghost"
                    compact
                    onPress={() => openEdit(occ.reminderId)}
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      ))}
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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  paidRow: { flexDirection: "row", alignItems: "center" },
  monthTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
});
