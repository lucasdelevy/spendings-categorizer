import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import {
  createAccount,
  listAccounts,
  updateAccount,
  deleteAccount,
  toPublicAccount,
} from "../services/accountService.js";
import type { JWTPayload, AccountType } from "../types.js";

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

  const accounts = await listAccounts(user.userId, familyId);
  return respond(
    200,
    { accounts: accounts.map(toPublicAccount) },
    origin,
  );
}

async function handleCreate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");

  const name = (body.name || "").trim();
  const type = body.type as AccountType;
  if (!name) return respond(400, { error: "name is required" }, origin);
  if (type !== "bank" && type !== "card") {
    return respond(400, { error: "type must be 'bank' or 'card'" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const created = await createAccount({
    userId: user.userId,
    familyId,
    name,
    type,
    closingDay: body.closingDay,
    dueDay: body.dueDay,
    apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
  });

  return respond(201, { account: toPublicAccount(created) }, origin);
}

async function handleUpdate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const accountId = event.pathParameters?.id;
  if (!accountId) return respond(400, { error: "Missing account id" }, origin);

  const body = JSON.parse(event.body || "{}");
  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const updated = await updateAccount(user.userId, familyId, accountId, {
    name: typeof body.name === "string" ? body.name : undefined,
    closingDay: body.closingDay,
    dueDay: body.dueDay,
    apiKey:
      body.apiKey === null
        ? null
        : typeof body.apiKey === "string"
          ? body.apiKey
          : undefined,
  });

  if (!updated) return respond(404, { error: "Account not found" }, origin);
  return respond(200, { account: toPublicAccount(updated) }, origin);
}

async function handleDelete(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const accountId = event.pathParameters?.id;
  if (!accountId) return respond(400, { error: "Missing account id" }, origin);

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  await deleteAccount(user.userId, familyId, accountId);
  return respond(200, { message: "Deleted" }, origin);
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

  if (method === "GET" && path === "/accounts") return handleList(event, user);
  if (method === "POST" && path === "/accounts") return handleCreate(event, user);
  if (method === "PUT" && path.startsWith("/accounts/")) return handleUpdate(event, user);
  if (method === "DELETE" && path.startsWith("/accounts/")) return handleDelete(event, user);

  return respond(404, { error: "Not found" }, origin);
}
