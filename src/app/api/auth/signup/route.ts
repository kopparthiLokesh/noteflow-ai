import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

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

    const name = typeof data.name === "string" ? data.name.trim() : "";

    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

    const password = typeof data.password === "string" ? data.password : "";

    // 2. Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name must not exceed 100 characters." },
        { status: 400 },
      );
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // 3. Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // 4. Hash password
    const passwordHash = await hashPassword(password);

    // 5. Create user
    const userId = `c${randomUUID().replace(/-/g, "")}`;

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // 6. Generate session token
    const sessionToken = await createSessionToken(user.id);

    // 7. Hash token for database storage
    const tokenHash = hashSessionToken(sessionToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 8. Create database session
    await prisma.session.create({
      data: {
        id: `c${randomUUID().replace(/-/g, "")}`,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 9. Set the SAME token as the HTTP-only cookie
    await setSessionCookie(sessionToken);

    // 10. Return successful response
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 },
    );
  }
}
