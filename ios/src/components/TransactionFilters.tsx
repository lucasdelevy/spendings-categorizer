import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { parseDateToNum } from "@aletheia/shared";
import type { Transaction } from "@aletheia/shared";
import { resolveLocale } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import { Button, Card, FilterChip, SegmentedControl, TextField } from "./ui";

export interface FilterState {
  amountMin: string;
  amountMax: string;
  dateStart: string;
  dateEnd: string;
  selectedOwners: Set<string>;
}

export const EMPTY_FILTERS: FilterState = {
  amountMin: "",
  amountMax: "",
  dateStart: "",
  dateEnd: "",
  selectedOwners: new Set(),
};

interface OwnerOption {
  userId: string;
  name: string;
  picture: string;
}

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  owners: OwnerOption[];
}

const DATE_PRESETS = [1, 2, 3, 5] as const;

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getActivePreset(dateStart: string, dateEnd: string): number | null {
  if (!dateStart || !dateEnd) return null;
  const today = isoDate(new Date());
  if (dateEnd !== today) return null;
  for (const n of DATE_PRESETS) {
    const start = new Date();
    start.setDate(start.getDate() - (n - 1));
    if (dateStart === isoDate(start)) return n;
  }
  return null;
}

export function filtersActive(f: FilterState): boolean {
  return (
    f.amountMin !== "" ||
    f.amountMax !== "" ||
    f.dateStart !== "" ||
    f.dateEnd !== "" ||
    f.selectedOwners.size > 0
  );
}

export function matchesFilters(t: Transaction, f: FilterState): boolean {
  const absAmount = Math.abs(t.amount);

  if (f.amountMin !== "") {
    const min = parseFloat(f.amountMin);
    if (!Number.isNaN(min) && absAmount < min) return false;
  }
  if (f.amountMax !== "") {
    const max = parseFloat(f.amountMax);
    if (!Number.isNaN(max) && absAmount > max) return false;
  }

  if (f.dateStart !== "" || f.dateEnd !== "") {
    const dn = parseDateToNum(t.date);
    if (dn !== null) {
      if (f.dateStart !== "") {
        const start = parseDateToNum(f.dateStart);
        if (start !== null && dn < start) return false;
      }
      if (f.dateEnd !== "") {
        const end = parseDateToNum(f.dateEnd);
        if (end !== null && dn > end) return false;
      }
    }
  }

  if (f.selectedOwners.size > 0) {
    const ownerId = t.uploadedBy?.userId ?? "__none__";
    if (!f.selectedOwners.has(ownerId)) return false;
  }

  return true;
}

export function collectOwners(transactions: Transaction[]): OwnerOption[] {
  const seen = new Map<string, OwnerOption>();
  for (const tx of transactions) {
    if (tx.uploadedBy && !seen.has(tx.uploadedBy.userId)) {
      seen.set(tx.uploadedBy.userId, {
        userId: tx.uploadedBy.userId,
        name: tx.uploadedBy.name,
        picture: tx.uploadedBy.picture,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildCalendarDays(year: number, month: number) {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DateRangeCalendar({
  dateStart,
  dateEnd,
  onSelect,
}: {
  dateStart: string;
  dateEnd: string;
  onSelect: (start: string, end: string) => void;
}) {
  const locale = resolveLocale();
  const { colors } = useTheme();
  const today = new Date();
  const initial = dateStart ? new Date(`${dateStart}T00:00:00`) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [picking, setPicking] = useState<"start" | "end">(
    dateStart && !dateEnd ? "end" : "start",
  );

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const todayStr = isoDate(today);

  const handleClick = (day: number) => {
    const clicked = isoDate(new Date(viewYear, viewMonth, day));
    if (picking === "start") {
      onSelect(clicked, "");
      setPicking("end");
    } else if (clicked < dateStart) {
      onSelect(clicked, "");
      setPicking("end");
    } else {
      onSelect(dateStart, clicked);
      setPicking("start");
    }
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={() => {
            if (viewMonth === 0) {
              setViewYear((y) => y - 1);
              setViewMonth(11);
            } else {
              setViewMonth((m) => m - 1);
            }
          }}
        >
          <Text style={{ color: colors.textMuted }}>‹</Text>
        </Pressable>
        <Text style={[styles.calendarTitle, { color: colors.text }]}>{monthLabel}</Text>
        <Pressable
          onPress={() => {
            if (viewMonth === 11) {
              setViewYear((y) => y + 1);
              setViewMonth(0);
            } else {
              setViewMonth((m) => m + 1);
            }
          }}
        >
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Pressable>
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.dayCell} />;
          const cellDate = isoDate(new Date(viewYear, viewMonth, day));
          const isStart = cellDate === dateStart;
          const isEnd = cellDate === dateEnd;
          const inRange = dateStart && dateEnd && cellDate > dateStart && cellDate < dateEnd;
          const isToday = cellDate === todayStr;
          const active = isStart || isEnd;

          return (
            <Pressable
              key={`d${day}-${i}`}
              onPress={() => handleClick(day)}
              style={[
                styles.dayCell,
                active ? { backgroundColor: colors.primary } : inRange ? { backgroundColor: colors.primaryMutedBg } : null,
              ]}
            >
              <Text
                style={{
                  color: active ? "#fff" : isToday ? colors.primary : colors.text,
                  fontSize: 12,
                  fontWeight: isToday && !active ? "700" : "400",
                }}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TransactionFilters({ filters, onChange, owners }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const active = filtersActive(filters);
  const activePreset = getActivePreset(filters.dateStart, filters.dateEnd);
  const hasCustomRange =
    (filters.dateStart !== "" || filters.dateEnd !== "") && activePreset === null;

  const patch = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const toggleOwner = (userId: string) => {
    const next = new Set(filters.selectedOwners);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    patch({ selectedOwners: next });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.inner}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t("filters.amount")}</Text>
        <View style={styles.amountRow}>
          <TextField
            placeholder={t("filters.min")}
            value={filters.amountMin}
            onChangeText={(v) => patch({ amountMin: v })}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <Text style={{ color: colors.textMuted }}>—</Text>
          <TextField
            placeholder={t("filters.max")}
            value={filters.amountMax}
            onChangeText={(v) => patch({ amountMax: v })}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 16 }]}>
          {t("filters.date")}
        </Text>
        <View style={styles.presetRow}>
          {DATE_PRESETS.map((n) => {
            const isActive = activePreset === n;
            return (
              <FilterChip
                key={n}
                label={`${n}d`}
                active={isActive}
                onPress={() => {
                  if (isActive) {
                    patch({ dateStart: "", dateEnd: "" });
                    setShowCustomDate(false);
                  } else {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - (n - 1));
                    patch({ dateStart: isoDate(start), dateEnd: isoDate(end) });
                    setShowCustomDate(false);
                  }
                }}
              />
            );
          })}
          <FilterChip
            label={t("filters.custom")}
            active={showCustomDate || hasCustomRange}
            onPress={() => setShowCustomDate((v) => !v)}
          />
        </View>
        {showCustomDate && (
          <DateRangeCalendar
            dateStart={filters.dateStart}
            dateEnd={filters.dateEnd}
            onSelect={(start, end) => patch({ dateStart: start, dateEnd: end })}
          />
        )}

        {owners.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 16 }]}>
              {t("filters.member")}
            </Text>
            <View style={styles.presetRow}>
              {owners.map((o) => {
                const selected =
                  filters.selectedOwners.size === 0 || filters.selectedOwners.has(o.userId);
                return (
                  <FilterChip
                    key={o.userId}
                    label={o.name.split(" ")[0]}
                    imageUri={o.picture}
                    active={selected}
                    onPress={() => toggleOwner(o.userId)}
                  />
                );
              })}
            </View>
          </>
        )}

        {active && (
          <View style={[styles.clearRow, { borderTopColor: colors.border }]}>
            <Button
              label={t("filters.clear")}
              variant="ghost"
              compact
              onPress={() => {
                onChange(EMPTY_FILTERS);
                setShowCustomDate(false);
              }}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  inner: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  amountInput: { flex: 1 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  clearRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  calendar: { marginTop: 8 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  calendarTitle: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
});
