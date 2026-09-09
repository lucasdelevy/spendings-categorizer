import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFY_TIME,
  dueDateInMonth,
  dueDayInMonth,
  effectiveStartDate,
  expandOccurrenceDates,
  isAtOrAfterNotifyTime,
  matchesDueDate,
  monthsForward,
  normalizeDayOfMonth,
  normalizeReminderName,
  parseIsoDate,
  parseNotifyTime,
  parseRecurrence,
  shiftYearMonth,
  toUpcomingMonths,
} from "./reminderService.js";
import type { ReminderOccurrenceRecord, ReminderRecord } from "../types.js";

function reminder(partial: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    PK: "USER#u",
    SK: "REMINDER#r1",
    reminderId: "r1",
    name: "Rent",
    dayOfMonth: 5,
    createdBy: "u",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...partial,
  };
}

describe("reminder helpers", () => {
  it("normalizes day of month", () => {
    expect(normalizeDayOfMonth(5)).toBe(5);
    expect(normalizeDayOfMonth(1)).toBe(1);
    expect(normalizeDayOfMonth(31)).toBe(31);
    expect(normalizeDayOfMonth(0)).toBeNull();
    expect(normalizeDayOfMonth(32)).toBeNull();
    expect(normalizeDayOfMonth("12")).toBe(12);
  });

  it("parses notify time", () => {
    expect(parseNotifyTime("9:00")).toBe("09:00");
    expect(parseNotifyTime("21:30")).toBe("21:30");
    expect(parseNotifyTime("24:00")).toBeNull();
    expect(parseNotifyTime("09")).toBeNull();
    expect(DEFAULT_NOTIFY_TIME).toBe("09:00");
  });

  it("parses recurrence and ISO dates", () => {
    expect(parseRecurrence("once")).toBe("once");
    expect(parseRecurrence("monthly")).toBe("monthly");
    expect(parseRecurrence("yearly")).toBe("yearly");
    expect(parseRecurrence("weekly")).toBeNull();
    expect(parseIsoDate("2026-09-15")).toBe("2026-09-15");
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(parseIsoDate("09-15")).toBeNull();
  });

  it("clamps due day to the last day of short months", () => {
    expect(dueDayInMonth(31, "202602")).toBe(28);
    expect(dueDayInMonth(31, "202604")).toBe(30);
    expect(dueDayInMonth(15, "202609")).toBe(15);
    expect(dueDateInMonth(31, "202602")).toBe("2026-02-28");
  });

  it("compares clock time to the notify time", () => {
    expect(isAtOrAfterNotifyTime("09:00", 9, 0)).toBe(true);
    expect(isAtOrAfterNotifyTime("09:00", 8, 59)).toBe(false);
    expect(isAtOrAfterNotifyTime("21:15", 21, 14)).toBe(false);
    expect(isAtOrAfterNotifyTime("21:15", 21, 15)).toBe(true);
  });

  it("builds a forward month window", () => {
    expect(shiftYearMonth("202601", -1)).toBe("202512");
    expect(monthsForward("202609", 3)).toEqual(["202609", "202610", "202611"]);
  });

  it("rejects empty or oversized names", () => {
    expect(normalizeReminderName("  Rent  ")).toBe("Rent");
    expect(normalizeReminderName("")).toBeNull();
    expect(normalizeReminderName("x".repeat(81))).toBeNull();
  });

  it("treats legacy reminders as monthly from createdAt", () => {
    const legacy = reminder({ dayOfMonth: 31 });
    expect(effectiveStartDate(legacy)).toBe("2026-08-31");
    expect(matchesDueDate(legacy, "2026-09-30")).toBe(true);
    expect(matchesDueDate(legacy, "2026-09-29")).toBe(false);
    expect(expandOccurrenceDates(legacy, "2026-09-01", "202610")).toEqual([
      "2026-09-30",
      "2026-10-31",
    ]);
  });

  it("expands monthly, yearly, and once series", () => {
    const monthly = reminder({ startDate: "2026-09-15", recurrence: "monthly", dayOfMonth: 15 });
    expect(expandOccurrenceDates(monthly, "2026-09-01", "202611")).toEqual([
      "2026-09-15",
      "2026-10-15",
      "2026-11-15",
    ]);
    expect(expandOccurrenceDates(monthly, "2026-09-16", "202611")).toEqual([
      "2026-10-15",
      "2026-11-15",
    ]);

    const yearly = reminder({ startDate: "2026-09-15", recurrence: "yearly", dayOfMonth: 15 });
    expect(expandOccurrenceDates(yearly, "2026-09-01", "202808")).toEqual([
      "2026-09-15",
      "2027-09-15",
    ]);

    const once = reminder({ startDate: "2026-10-03", recurrence: "once", dayOfMonth: 3 });
    expect(expandOccurrenceDates(once, "2026-09-01", "202612")).toEqual(["2026-10-03"]);
    expect(expandOccurrenceDates(once, "2026-10-04", "202612")).toEqual([]);
    expect(matchesDueDate(once, "2026-10-03")).toBe(true);
    expect(matchesDueDate(once, "2026-11-03")).toBe(false);
  });

  it("groups upcoming occurrences and reads legacy paid rows", () => {
    const series = reminder({
      startDate: "2026-08-05",
      recurrence: "monthly",
      dayOfMonth: 5,
    });
    const occ: ReminderOccurrenceRecord = {
      PK: "USER#u",
      SK: "REMINDEROCC#202608#r1",
      reminderId: "r1",
      yearMonth: "202608",
      paid: true,
      paidAt: "2026-08-05T12:00:00.000Z",
      paidByName: "Ada",
    };
    const months = toUpcomingMonths([series], [occ], "2026-08-01", 2);
    expect(months.map((m) => m.yearMonth)).toEqual(["202608", "202609"]);
    expect(months[0].occurrences[0].paid).toBe(true);
    expect(months[0].occurrences[0].date).toBe("2026-08-05");
    expect(months[1].occurrences[0].paid).toBe(false);
  });
});
