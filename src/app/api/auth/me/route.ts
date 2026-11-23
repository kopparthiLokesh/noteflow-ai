import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSessionCookie,
  verifySessionToken,
  hashSessionToken,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await getSessionCookie();

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "Not logged in" },
        { status: 401 },
      );
    }

    const payload = await verifySessionToken(token);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    const tokenHash = hashSessionToken(token);

    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        userId: payload.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "Session expired or not found" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve current user" },
      { status: 500 },
    );
  }
}
