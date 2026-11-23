import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import {
  getSessionCookie,
  verifySessionToken,
  hashSessionToken,
} from "@/lib/session";
import { handleError } from "@/lib/api-error";

export const runtime = "nodejs";

// Verify the session against the database.
async function getAuthenticatedUserId(): Promise<string | null> {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
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
    select: {
      userId: true,
    },
  });

  return session?.userId ?? null;
}

// GET: Retrieve tasks belonging to the authenticated user.
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        note: {
          is: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleError(error);
  }
}

// POST: Create a task only for a note owned by the authenticated user.
export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const data = createTaskSchema.parse(await req.json());

    // Tasks must be associated with an existing note.
    if (!data.noteId) {
      return NextResponse.json(
        { error: "A valid noteId is required to create a task." },
        { status: 400 },
      );
    }

    // Confirm that the note belongs to the authenticated user.
    const note = await prisma.note.findFirst({
      where: {
        id: data.noteId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied." },
        { status: 403 },
      );
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        noteId: note.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
