import { listMembers } from "./familyService.js";
import { listDevicesForUsers } from "./deviceService.js";
import { getUser } from "./userService.js";
import { isPushConfigured, sendReminderPushes } from "./pushService.js";
import {
  DEFAULT_NOTIFY_TIME,
  alreadyPushed,
  getOccurrence,
  isAtOrAfterNotifyTime,
  isDueOnDay,
  markPushed,
  parseOwnerPk,
  saoPauloParts,
  scanAllReminders,
} from "./reminderService.js";

async function recipientUserIds(userId: string, familyId?: string): Promise<string[]> {
  if (!familyId) return userId ? [userId] : [];
  const members = await listMembers(familyId);
  return members
    .filter((m) => m.status === "active" && m.SK.startsWith("MEMBER#"))
    .map((m) => m.SK.slice("MEMBER#".length));
}

export async function evaluateAndNotifyPaymentReminders(
  now = new Date(),
): Promise<{ due: number; sent: number }> {
  if (!isPushConfigured()) return { due: 0, sent: 0 };

  const clock = saoPauloParts(now);
  const reminders = await scanAllReminders();
  let due = 0;
  let sent = 0;

  for (const reminder of reminders) {
    if (!isDueOnDay(reminder.dayOfMonth, clock.yearMonth, clock.day)) continue;
    const occ = await getOccurrence(reminder.PK, clock.yearMonth, reminder.reminderId);
    if (occ?.paid) continue;
    due += 1;

    const owner = parseOwnerPk(reminder.PK);
    const userIds = await recipientUserIds(owner.userId, owner.familyId);
    for (const userId of userIds) {
      if (await alreadyPushed(reminder.PK, clock.yearMonth, reminder.reminderId, userId)) {
        continue;
      }
      const user = await getUser(userId);
      const notifyTime = user?.reminderNotifyTime || DEFAULT_NOTIFY_TIME;
      if (!isAtOrAfterNotifyTime(notifyTime, clock.hour, clock.minute)) continue;

      const devices = await listDevicesForUsers([userId]);
      if (devices.length === 0) continue;

      const pushed = await sendReminderPushes(devices, {
        reminderId: reminder.reminderId,
        name: reminder.name,
        yearMonth: clock.yearMonth,
      });
      if (pushed > 0) {
        await markPushed(reminder.PK, clock.yearMonth, reminder.reminderId, userId);
        sent += pushed;
      }
    }
  }

  return { due, sent };
}
