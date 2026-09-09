import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { extractBearerToken, verifyJWT } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser, setReminderNotifyTime } from "../services/userService.js";
import { requireFamilyManager } from "../services/familyAuth.js";
import {
  DEFAULT_NOTIFY_TIME,
  createReminder,
  deleteReminder,
  listOccurrences,
  listReminders,
  normalizeDayOfMonth,
  normalizeReminderName,
  parseNotifyTime,
  saoPauloParts,
  setReminderPaid,
  toPublicReminders,
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

function requestedMonth(event: APIGatewayProxyEventV2): string {
  const fromQuery = event.queryStringParameters?.month;
  if (fromQuery && /^\d{6}$/.test(fromQuery)) return fromQuery;
  return saoPauloParts().yearMonth;
}

async function handleList(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;
  const month = requestedMonth(event);
  const [reminders, occurrences] = await Promise.all([
    listReminders(user.userId, familyId),
    listOccurrences(user.userId, familyId),
  ]);
  return respond(
    200,
    {
      month,
      notifyTime: parseNotifyTime(userRecord?.reminderNotifyTime) ?? DEFAULT_NOTIFY_TIME,
      reminders: toPublicReminders(reminders, occurrences, month),
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
  const dayOfMonth = normalizeDayOfMonth(body.dayOfMonth);
  if (!name) return respond(400, { error: "name is required" }, origin);
  if (!dayOfMonth) return respond(400, { error: "dayOfMonth must be 1-31" }, origin);

  const userRecord = await getUser(user.userId);
  const created = await createReminder({
    userId: user.userId,
    familyId: userRecord?.familyId,
    name,
    dayOfMonth,
  });
  const month = saoPauloParts().yearMonth;
  const [publicReminder] = toPublicReminders([created], [], month);
  return respond(201, { reminder: publicReminder }, origin);
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
  const dayOfMonth =
    body.dayOfMonth !== undefined ? normalizeDayOfMonth(body.dayOfMonth) : undefined;
  if (body.name !== undefined && !name) {
    return respond(400, { error: "name is required" }, origin);
  }
  if (body.dayOfMonth !== undefined && !dayOfMonth) {
    return respond(400, { error: "dayOfMonth must be 1-31" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const updated = await updateReminder(user.userId, userRecord?.familyId, reminderId, {
    name: name ?? undefined,
    dayOfMonth: dayOfMonth ?? undefined,
  });
  if (!updated) return respond(404, { error: "Reminder not found" }, origin);
  const month = saoPauloParts().yearMonth;
  const [publicReminder] = toPublicReminders([updated], [], month);
  return respond(200, { reminder: publicReminder }, origin);
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
  const yearMonth =
    typeof body.yearMonth === "string" && /^\d{6}$/.test(body.yearMonth)
      ? body.yearMonth
      : saoPauloParts().yearMonth;

  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(404, { error: "User not found" }, origin);
  const occ = await setReminderPaid({
    userId: user.userId,
    familyId: userRecord.familyId,
    reminderId,
    yearMonth,
    paid,
    paidByName: userRecord.name || userRecord.email,
  });
  if (!occ) return respond(404, { error: "Reminder not found" }, origin);
  return respond(200, {
    occurrence: {
      reminderId,
      yearMonth,
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
