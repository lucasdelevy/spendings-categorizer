import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser, setFamilyId } from "../services/userService.js";
import {
  createFamily,
  getFamily,
  listMembers,
  addMember,
  removeMember,
  updateFamilyName,
} from "../services/familyService.js";
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

async function handleCreate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { name } = body;

  if (!name) return respond(400, { error: "name is required" }, origin);

  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(404, { error: "User not found" }, origin);

  if (userRecord.familyId) {
    return respond(409, { error: "User already belongs to a family" }, origin);
  }

  const { familyId, family } = await createFamily(name, {
    userId: user.userId,
    email: userRecord.email,
    name: userRecord.name,
    picture: userRecord.picture,
  });

  await setFamilyId(user.userId, familyId);

  return respond(201, {
    familyId,
    name: family.name,
    createdAt: family.createdAt,
  }, origin);
}

async function handleGetMine(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(404, { error: "User not found" }, origin);

  if (!userRecord.familyId) {
    return respond(200, { family: null }, origin);
  }

  const family = await getFamily(userRecord.familyId);
  if (!family) return respond(200, { family: null }, origin);

  const members = await listMembers(userRecord.familyId);

  return respond(200, {
    family: {
      id: userRecord.familyId,
      name: family.name,
      createdBy: family.createdBy,
      createdAt: family.createdAt,
      members: members.map((m) => ({
        email: m.email,
        name: m.name,
        picture: m.picture,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
    },
  }, origin);
}

async function handleAddMember(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { email } = body;

  if (!email) return respond(400, { error: "email is required" }, origin);

  const userRecord = await getUser(user.userId);
  if (!userRecord?.familyId) {
    return respond(400, { error: "User does not belong to a family" }, origin);
  }

  const members = await listMembers(userRecord.familyId);
  const ownerMember = members.find(
    (m) => m.SK === `MEMBER#${user.userId}` && m.role === "owner",
  );
  if (!ownerMember) {
    return respond(403, { error: "Only the family owner can add members" }, origin);
  }

  const existing = members.find((m) => m.email === email);
  if (existing) {
    return respond(409, { error: "Member already exists" }, origin);
  }

  const member = await addMember(userRecord.familyId, email);

  return respond(201, {
    email: member.email,
    status: member.status,
    joinedAt: member.joinedAt,
  }, origin);
}

async function handleRemoveMember(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const email = decodeURIComponent(event.pathParameters?.email || "");
  if (!email) return respond(400, { error: "email is required" }, origin);

  const userRecord = await getUser(user.userId);
  if (!userRecord?.familyId) {
    return respond(400, { error: "User does not belong to a family" }, origin);
  }

  const members = await listMembers(userRecord.familyId);
  const ownerMember = members.find(
    (m) => m.SK === `MEMBER#${user.userId}` && m.role === "owner",
  );
  if (!ownerMember) {
    return respond(403, { error: "Only the family owner can remove members" }, origin);
  }

  const target = members.find((m) => m.email === email);
  if (!target) {
    return respond(404, { error: "Member not found" }, origin);
  }
  if (target.role === "owner") {
    return respond(400, { error: "Cannot remove the family owner" }, origin);
  }

  await removeMember(userRecord.familyId, email);

  return respond(200, { message: "Member removed" }, origin);
}

async function handleUpdate(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { name } = body;

  if (!name) return respond(400, { error: "name is required" }, origin);

  const userRecord = await getUser(user.userId);
  if (!userRecord?.familyId) {
    return respond(400, { error: "User does not belong to a family" }, origin);
  }

  const members = await listMembers(userRecord.familyId);
  const ownerMember = members.find(
    (m) => m.SK === `MEMBER#${user.userId}` && m.role === "owner",
  );
  if (!ownerMember) {
    return respond(403, { error: "Only the family owner can update the family" }, origin);
  }

  await updateFamilyName(userRecord.familyId, name);

  return respond(200, { name }, origin);
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

  if (method === "POST" && path === "/families") return handleCreate(event, user);
  if (method === "GET" && path === "/families/mine") return handleGetMine(event, user);
  if (method === "PUT" && path === "/families") return handleUpdate(event, user);
  if (method === "POST" && path === "/families/members") return handleAddMember(event, user);
  if (method === "DELETE" && path.startsWith("/families/members/")) return handleRemoveMember(event, user);

  return respond(404, { error: "Not found" }, origin);
}
