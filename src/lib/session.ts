import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const SESSION_COOKIE_NAME = "noteflow_session";

export const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 characters.",
    );
  }

  return new TextEncoder().encode(secret);
}

// Hash the signed session token before storing it in the database.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Create a signed session token.
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSessionSecret());
}

// Verify a signed session token.
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (typeof payload.userId !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}

// Set secure HTTP-only session cookie.
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

// Read session cookie.
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

// Remove session cookie.
export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}
