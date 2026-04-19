import * as jose from "jose";
import type { JWTPayload } from "../types.js";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const JWT_ISSUER = "spendings-categorizer";
const SESSION_DURATION = "7d";

export async function createJWT(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT({ userId: payload.userId, sessionId: payload.sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(SESSION_DURATION)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    const userId = payload.userId as string | undefined;
    const sessionId = payload.sessionId as string | undefined;
    if (!userId || !sessionId) return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
