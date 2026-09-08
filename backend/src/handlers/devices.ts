import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import {
  deleteDevice,
  normalizeDeviceToken,
  upsertDevice,
} from "../services/deviceService.js";
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

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  if (event.requestContext.http.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  const user = await authenticate(event);
  if (!user) return respond(401, { error: "Unauthorized" }, origin);

  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  if (method === "POST" && path === "/devices") {
    const body = JSON.parse(event.body || "{}");
    const token = typeof body.token === "string" ? normalizeDeviceToken(body.token) : null;
    if (!token) return respond(400, { error: "token is required" }, origin);
    const platform = body.platform === "ios" ? "ios" : null;
    if (!platform) return respond(400, { error: "platform must be 'ios'" }, origin);
    const locale = typeof body.locale === "string" ? body.locale : "en";
    await upsertDevice({
      userId: user.userId,
      token,
      platform,
      locale,
    });
    return respond(200, { ok: true }, origin);
  }

  if (method === "DELETE" && (path.startsWith("/devices/") || event.pathParameters?.token)) {
    const raw = event.pathParameters?.token ?? path.slice("/devices/".length);
    let token: string | null = null;
    try {
      token = normalizeDeviceToken(decodeURIComponent(raw));
    } catch {
      token = normalizeDeviceToken(raw);
    }
    if (!token) return respond(400, { error: "token is required" }, origin);
    await deleteDevice(user.userId, token);
    return respond(204, "", origin);
  }

  return respond(404, { error: "Not found" }, origin);
}
