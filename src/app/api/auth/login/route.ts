import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

import {
  hashSessionToken,
  createSessionToken,
  setSessionCookie,
} from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

    const password = typeof data.password === "string" ? data.password : "";

    // 2. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // 3. Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // 4. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    // 5. Generate JWT session token
    const sessionToken = await createSessionToken(user.id);

    // 6. Hash token for database storage
    const tokenHash = hashSessionToken(sessionToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 7. Create database session
    await prisma.session.create({
      data: {
        id: `c${randomUUID().replace(/-/g, "")}`,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 8. Set the same JWT as HTTP-only cookie
    await setSessionCookie(sessionToken);

    // 9. Return successful login response
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Unable to log in. Please try again." },
      { status: 500 },
    );
  }
}
