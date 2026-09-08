import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { OAuth2Client } from "google-auth-library";
import { getCorsHeaders } from "../middleware/cors.js";
import { createJWT, verifyJWT, extractBearerToken } from "../middleware/auth.js";
import {
  upsertUser,
  getUser,
  setFamilyId,
  resolveUserId,
} from "../services/userService.js";
import { createSession, getSession, deleteSession } from "../services/sessionService.js";
import { lookupFamilyByEmail, activateMember } from "../services/familyService.js";
import { verifyAppleIdentityToken } from "../services/appleAuth.js";
import { deleteAccount } from "../services/accountDeletion.js";
import type { UserRecord } from "../types.js";

/** Web + iOS OAuth client IDs (comma-separated GOOGLE_CLIENT_ID also supported). */
function googleAudiences(): string[] {
  const raw = [process.env.GOOGLE_CLIENT_ID ?? "", process.env.GOOGLE_IOS_CLIENT_ID ?? ""];
  const ids = raw
    .flatMap((value) => value.split(","))
    .map((id) => id.trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

const GOOGLE_AUDIENCES = googleAudiences();
const googleClient = new OAuth2Client();

function respond(statusCode: number, body: unknown, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

function publicUser(user: UserRecord) {
  return {
    email: user.email,
    name: user.name,
    picture: user.picture,
    familyId: user.familyId || null,
  };
}

async function issueSession(userId: string, user: UserRecord, origin?: string) {
  const session = await createSession(userId);
  const sessionId = session.SK.replace("SESS#", "");
  const jwt = await createJWT({ userId, sessionId });
  return respond(200, { token: jwt, user: publicUser(user) }, origin);
}

async function linkFamilyIfNeeded(
  userId: string,
  user: UserRecord,
  email: string,
  name: string,
  picture: string,
): Promise<UserRecord> {
  if (user.familyId || !email) return user;
  const familyId = await lookupFamilyByEmail(email);
  if (!familyId) return user;
  await activateMember(familyId, email, { userId, name, picture });
  await setFamilyId(userId, familyId);
  return { ...user, familyId };
}

async function handleGoogleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { idToken } = body;

  if (!idToken) {
    return respond(400, { error: "idToken is required" }, origin);
  }

  if (GOOGLE_AUDIENCES.length === 0) {
    console.error("Google OAuth not configured: set GOOGLE_CLIENT_ID and/or GOOGLE_IOS_CLIENT_ID");
    return respond(500, { error: "Authentication not configured" }, origin);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_AUDIENCES,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return respond(401, { error: "Invalid token" }, origin);
    }

    const email = payload.email || "";
    const name = payload.name || "";
    const picture = payload.picture || "";
    const userId = await resolveUserId(payload.sub, email);
    let user = await upsertUser({
      userId,
      email,
      name,
      picture,
      googleId: payload.sub,
    });
    user = await linkFamilyIfNeeded(userId, user, email, name, picture);
    return issueSession(userId, user, origin);
  } catch (err) {
    console.error("Google auth error:", err);
    return respond(401, { error: "Authentication failed" }, origin);
  }
}

async function handleAppleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const identityToken = body.identityToken || body.identity_token;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!identityToken) {
    return respond(400, { error: "identityToken is required" }, origin);
  }

  try {
    const profile = await verifyAppleIdentityToken(identityToken);
    const email = profile.email || "";
    const userId = await resolveUserId(profile.sub, email || undefined);
    const existing = await getUser(userId);
    const name = fullName || existing?.name || (email ? email.split("@")[0] : "") || "Aletheia user";
    const picture = existing?.picture || "";
    let user = await upsertUser({
      userId,
      email: email || existing?.email || "",
      name,
      picture,
      appleId: profile.sub,
    });
    user = await linkFamilyIfNeeded(userId, user, user.email, user.name, user.picture);
    return issueSession(userId, user, origin);
  } catch (err) {
    console.error("Apple auth error:", err);
    return respond(401, { error: "Authentication failed" }, origin);
  }
}

async function handleGetMe(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const token = extractBearerToken(event.headers?.authorization);
  if (!token) return respond(401, { error: "Unauthorized" }, origin);

  const payload = await verifyJWT(token);
  if (!payload) return respond(401, { error: "Invalid token" }, origin);

  const session = await getSession(payload.userId, payload.sessionId);
  if (!session) return respond(401, { error: "Session expired" }, origin);

  const user = await getUser(payload.userId);
  if (!user) return respond(404, { error: "User not found" }, origin);

  if (user.email) {
    const canonicalId = await resolveUserId(payload.userId, user.email);
    if (canonicalId !== payload.userId) {
      return respond(401, { error: "Session expired" }, origin);
    }
  }

  return respond(200, { user: publicUser(user) }, origin);
}

async function handleLogout(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const token = extractBearerToken(event.headers?.authorization);
  if (!token) return respond(401, { error: "Unauthorized" }, origin);

  const payload = await verifyJWT(token);
  if (!payload) return respond(401, { error: "Invalid token" }, origin);

  await deleteSession(payload.userId, payload.sessionId);
  return respond(200, { message: "Logged out" }, origin);
}

async function handleDeleteMe(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const token = extractBearerToken(event.headers?.authorization);
  if (!token) return respond(401, { error: "Unauthorized" }, origin);

  const payload = await verifyJWT(token);
  if (!payload) return respond(401, { error: "Invalid token" }, origin);

  const session = await getSession(payload.userId, payload.sessionId);
  if (!session) return respond(401, { error: "Session expired" }, origin);

  await deleteAccount(payload.userId);
  return {
    statusCode: 204,
    headers: getCorsHeaders(origin),
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  if (event.requestContext.http.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  if (method === "POST" && path === "/auth/google") return handleGoogleLogin(event);
  if (method === "POST" && path === "/auth/apple") return handleAppleLogin(event);
  if (method === "GET" && path === "/auth/me") return handleGetMe(event);
  if (method === "POST" && path === "/auth/logout") return handleLogout(event);
  if (method === "DELETE" && path === "/auth/me") return handleDeleteMe(event);

  return respond(404, { error: "Not found" }, origin);
}
