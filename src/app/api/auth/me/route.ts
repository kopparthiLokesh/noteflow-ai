import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

// GET /api/auth/me
// Retrieve the currently authenticated user.
export async function GET() {
  try {
    // 1. Verify JWT and database session
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Not authenticated. Please log in.",
        },
        { status: 401 },
      );
    }

    // 2. Retrieve authenticated user details
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "User not found.",
        },
        { status: 401 },
      );
    }

    // 3. Return authenticated user
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        error: "Unable to retrieve current user.",
      },
      { status: 500 },
    );
  }
}
