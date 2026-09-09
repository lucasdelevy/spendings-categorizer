import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFY_TIME,
  dueDayInMonth,
  isAtOrAfterNotifyTime,
  isDueOnDay,
  monthsBack,
  normalizeDayOfMonth,
  normalizeReminderName,
  parseNotifyTime,
  shiftYearMonth,
  toPublicReminders,
} from "./reminderService.js";
import type { ReminderOccurrenceRecord, ReminderRecord } from "../types.js";

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

  it("clamps due day to the last day of short months", () => {
    expect(dueDayInMonth(31, "202602")).toBe(28);
    expect(dueDayInMonth(31, "202604")).toBe(30);
    expect(dueDayInMonth(15, "202609")).toBe(15);
    expect(isDueOnDay(31, "202609", 30)).toBe(true);
    expect(isDueOnDay(31, "202609", 29)).toBe(false);
  });

  it("compares clock time to the notify time", () => {
    expect(isAtOrAfterNotifyTime("09:00", 9, 0)).toBe(true);
    expect(isAtOrAfterNotifyTime("09:00", 8, 59)).toBe(false);
    expect(isAtOrAfterNotifyTime("21:15", 21, 14)).toBe(false);
    expect(isAtOrAfterNotifyTime("21:15", 21, 15)).toBe(true);
  });

  it("builds a month window newest first", () => {
    expect(shiftYearMonth("202601", -1)).toBe("202512");
    expect(monthsBack("202609", 3)).toEqual(["202609", "202608", "202607"]);
  });

  it("rejects empty or oversized names", () => {
    expect(normalizeReminderName("  Rent  ")).toBe("Rent");
    expect(normalizeReminderName("")).toBeNull();
    expect(normalizeReminderName("x".repeat(81))).toBeNull();
  });

  it("fills unpaid history for months without an occurrence", () => {
    const reminder: ReminderRecord = {
      PK: "USER#u",
      SK: "REMINDER#r1",
      reminderId: "r1",
      name: "Rent",
      dayOfMonth: 5,
      createdBy: "u",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };
    const occ: ReminderOccurrenceRecord = {
      PK: "USER#u",
      SK: "REMINDEROCC#202608#r1",
      reminderId: "r1",
      yearMonth: "202608",
      paid: true,
      paidAt: "2026-08-05T12:00:00.000Z",
      paidByName: "Ada",
    };
    const [publicReminder] = toPublicReminders([reminder], [occ], "202609");
    expect(publicReminder.paid).toBe(false);
    expect(publicReminder.history.find((h) => h.yearMonth === "202608")?.paid).toBe(true);
    expect(publicReminder.history.find((h) => h.yearMonth === "202609")?.paid).toBe(false);
    expect(publicReminder.history.every((h) => h.yearMonth >= "202608")).toBe(true);
  });
});
