import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { OAuth2Client } from "google-auth-library";
import { getCorsHeaders } from "../middleware/cors.js";
import { createJWT, verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { upsertUser, getUser, setFamilyId } from "../services/userService.js";
import { createSession, getSession, deleteSession } from "../services/sessionService.js";
import { lookupFamilyByEmail, activateMember } from "../services/familyService.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function respond(statusCode: number, body: unknown, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

async function handleGoogleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { idToken } = body;

  if (!idToken) {
    return respond(400, { error: "idToken is required" }, origin);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return respond(401, { error: "Invalid token" }, origin);
    }

    const user = await upsertUser({
      googleId: payload.sub,
      email: payload.email || "",
      name: payload.name || "",
      picture: payload.picture || "",
    });

    if (!user.familyId && payload.email) {
      const familyId = await lookupFamilyByEmail(payload.email);
      if (familyId) {
        await activateMember(familyId, payload.email, {
          userId: payload.sub,
          name: payload.name || "",
          picture: payload.picture || "",
        });
        await setFamilyId(payload.sub, familyId);
        user.familyId = familyId;
      }
    }

    const session = await createSession(payload.sub);
    const sessionId = session.SK.replace("SESS#", "");
    const jwt = await createJWT({ userId: payload.sub, sessionId });

    return respond(200, {
      token: jwt,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        familyId: user.familyId || null,
      },
    }, origin);
  } catch (err) {
    console.error("Google auth error:", err);
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

  return respond(200, {
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture,
      familyId: user.familyId || null,
    },
  }, origin);
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

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  if (event.requestContext.http.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  if (method === "POST" && path === "/auth/google") return handleGoogleLogin(event);
  if (method === "GET" && path === "/auth/me") return handleGetMe(event);
  if (method === "POST" && path === "/auth/logout") return handleLogout(event);

  return respond(404, { error: "Not found" }, origin);
}
