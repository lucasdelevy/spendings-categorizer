import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export type AppleProfile = {
  sub: string;
  email?: string;
};

function appleAudience(): string {
  return process.env.APPLE_CLIENT_ID || "com.lucasdelevy.aletheia";
}

/**
 * Verify a native Sign in with Apple identityToken. Audience is the iOS bundle ID.
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleProfile> {
  const { payload } = await jwtVerify(identityToken, appleJwks, {
    issuer: APPLE_ISSUER,
    audience: appleAudience(),
  });
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Invalid Apple token");
  }
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
  return { sub: payload.sub, ...(email ? { email } : {}) };
}
