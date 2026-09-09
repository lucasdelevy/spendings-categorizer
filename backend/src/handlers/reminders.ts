import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { extractBearerToken, verifyJWT } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser, setReminderNotifyTime } from "../services/userService.js";
import { requireFamilyManager } from "../services/familyAuth.js";
import {
  DEFAULT_NOTIFY_TIME,
  UPCOMING_MONTHS,
  createReminder,
  deleteReminder,
  dueDateInMonth,
  getReminder,
  listOccurrences,
  listReminders,
  normalizeReminderName,
  parseIsoDate,
  parseNotifyTime,
  parseRecurrence,
  recurrenceDayOfMonth,
  saoPauloParts,
  setReminderPaid,
  toPublicSeries,
  toUpcomingMonths,
  updateReminder,
} from "../services/reminderService.js";
import type { JWTPayload } from "../types.js";

function respond(statusCode: number, body: unknown, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

async function authenticate(event: APIGatewayProxyEventV2): Promise<JWTPayload | null> {
  const token = extractBearerToken(event.headers?.authorization);
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;
  const session = await getSession(payload.userId, payload.sessionId);
  if (!session) return null;
  return payload;
}

async function handleList(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;
  const clock = saoPauloParts();
  const fromYmd = `${clock.date.slice(0, 8)}01`;
  const [reminders, occurrences] = await Promise.all([
    listReminders(user.userId, familyId),
    listOccurrences(user.userId, familyId),
  ]);
  return respond(
    200,
    {
      notifyTime: parseNotifyTime(userRecord?.reminderNotifyTime) ?? DEFAULT_NOTIFY_TIME,
      months: toUpcomingMonths(reminders, occurrences, fromYmd, UPCOMING_MONTHS),
      series: reminders.map(toPublicSeries),
    },
    origin,
  );
}

async function handleCreate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const name = normalizeReminderName(body.name);
  const startDate = parseIsoDate(body.startDate);
  const recurrence = parseRecurrence(body.recurrence);
  if (!name) return respond(400, { error: "name is required" }, origin);
  if (!startDate) return respond(400, { error: "startDate must be YYYY-MM-DD" }, origin);
  if (!recurrence) return respond(400, { error: "recurrence must be once, monthly, or yearly" }, origin);

  const userRecord = await getUser(user.userId);
  const created = await createReminder({
    userId: user.userId,
    familyId: userRecord?.familyId,
    name,
    startDate,
    recurrence,
  });
  return respond(201, { reminder: toPublicSeries(created) }, origin);
}

async function handleUpdate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const reminderId = event.pathParameters?.id;
  if (!reminderId) return respond(400, { error: "Missing reminder id" }, origin);

  const body = JSON.parse(event.body || "{}");
  const name = body.name !== undefined ? normalizeReminderName(body.name) : undefined;
  const startDate = body.startDate !== undefined ? parseIsoDate(body.startDate) : undefined;
  const recurrence = body.recurrence !== undefined ? parseRecurrence(body.recurrence) : undefined;
  if (body.name !== undefined && !name) {
    return respond(400, { error: "name is required" }, origin);
  }
  if (body.startDate !== undefined && !startDate) {
    return respond(400, { error: "startDate must be YYYY-MM-DD" }, origin);
  }
  if (body.recurrence !== undefined && !recurrence) {
    return respond(400, { error: "recurrence must be once, monthly, or yearly" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const updated = await updateReminder(user.userId, userRecord?.familyId, reminderId, {
    name: name ?? undefined,
    startDate: startDate ?? undefined,
    recurrence: recurrence ?? undefined,
  });
  if (!updated) return respond(404, { error: "Reminder not found" }, origin);
  return respond(200, { reminder: toPublicSeries(updated) }, origin);
}

async function handleDelete(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const reminderId = event.pathParameters?.id;
  if (!reminderId) return respond(400, { error: "Missing reminder id" }, origin);
  const userRecord = await getUser(user.userId);
  await deleteReminder(user.userId, userRecord?.familyId, reminderId);
  return respond(200, { message: "Deleted" }, origin);
}

async function handlePaid(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const reminderId = event.pathParameters?.id;
  if (!reminderId) return respond(400, { error: "Missing reminder id" }, origin);
  const body = JSON.parse(event.body || "{}");
  const paid = body.paid === true;

  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(404, { error: "User not found" }, origin);
  const reminder = await getReminder(user.userId, userRecord.familyId, reminderId);
  if (!reminder) return respond(404, { error: "Reminder not found" }, origin);

  const dateFromBody = parseIsoDate(body.date);
  const yearMonth =
    typeof body.yearMonth === "string" && /^\d{6}$/.test(body.yearMonth) ? body.yearMonth : null;
  const date =
    dateFromBody ??
    (yearMonth ? dueDateInMonth(recurrenceDayOfMonth(reminder), yearMonth) : null);
  if (!date) return respond(400, { error: "date must be YYYY-MM-DD" }, origin);

  const occ = await setReminderPaid({
    userId: user.userId,
    familyId: userRecord.familyId,
    reminderId,
    date,
    paid,
    paidByName: userRecord.name || userRecord.email,
  });
  if (!occ) return respond(404, { error: "Reminder not found" }, origin);
  return respond(200, {
    occurrence: {
      reminderId,
      date,
      yearMonth: occ.yearMonth,
      paid: occ.paid,
      paidAt: occ.paidAt,
      paidByName: occ.paidByName,
    },
  }, origin);
}

async function handleSettings(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const notifyTime = parseNotifyTime(body.notifyTime);
  if (!notifyTime) return respond(400, { error: "notifyTime must be HH:mm" }, origin);
  await setReminderNotifyTime(user.userId, notifyTime);
  return respond(200, { notifyTime }, origin);
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  if (event.requestContext.http.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  const user = await authenticate(event);
  if (!user) return respond(401, { error: "Unauthorized" }, origin);

  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  if (method === "GET" && path === "/reminders") return handleList(event, user);
  if (method === "PUT" && path === "/reminders/settings") return handleSettings(event, user);
  if (method === "PUT" && path.endsWith("/paid") && path.startsWith("/reminders/")) {
    return handlePaid(event, user);
  }

  const gate = await requireFamilyManager(user.userId);
  if (!gate.ok) return respond(gate.status, { error: gate.error }, origin);

  if (method === "POST" && path === "/reminders") return handleCreate(event, user);
  if (method === "PUT" && path.startsWith("/reminders/")) return handleUpdate(event, user);
  if (method === "DELETE" && path.startsWith("/reminders/")) return handleDelete(event, user);

  return respond(404, { error: "Not found" }, origin);
}
