import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations";
import { noteInclude, tagsConnectOrCreate } from "@/lib/notes";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { handleError } from "@/lib/api-error";

// GET /api/notes?q=text&tag=work
// Retrieve only notes belonging to the logged-in user.
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const tag = searchParams.get("tag")?.trim().toLowerCase() ?? "";

    const where: Prisma.NoteWhereInput = {
      userId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(tag ? { tags: { some: { name: tag } } } : {}),
    };

    const notes = await prisma.note.findMany({
      where,
      include: noteInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/notes: create a note for the logged-in user.
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { title, content, tags = [] } = parsed.data;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId,
        tags: {
          connectOrCreate: tagsConnectOrCreate(tags),
        },
      },
      include: noteInclude,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
