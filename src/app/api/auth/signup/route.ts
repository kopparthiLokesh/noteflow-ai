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
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

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

    const sessionToken = await createSessionToken(user.id);
    const tokenHash = hashSessionToken(sessionToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: `c${randomUUID().replace(/-/g, "")}`,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const signedToken = await createSessionToken(user.id);
    await setSessionCookie(signedToken);

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
