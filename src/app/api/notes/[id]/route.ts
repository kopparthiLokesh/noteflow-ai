import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateNoteSchema } from "@/lib/validations";
import { noteInclude, tagsConnectOrCreate } from "@/lib/notes";
import { getAuthenticatedUserId } from "@/lib/auth-session";
import { handleError } from "@/lib/api-error";

type Context = {
  params: Promise<{ id: string }>;
};

const notFound = () =>
  NextResponse.json({ error: "Note not found" }, { status: 404 });

// GET /api/notes/:id
export async function GET(_request: Request, { params }: Context) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
      include: noteInclude,
    });

    if (!note) {
      return notFound();
    }

    return NextResponse.json(note);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/notes/:id
export async function PATCH(request: Request, { params }: Context) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { id } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { title, content, tags } = parsed.data;

    const note = await prisma.$transaction(async (tx) => {
      const existingNote = await tx.note.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!existingNote) {
        return null;
      }

      return tx.note.update({
        where: {
          id: existingNote.id,
        },
        data: {
          title,
          content,
          ...(tags !== undefined && {
            tags: {
              set: [],
              connectOrCreate: tagsConnectOrCreate(tags),
            },
          }),
        },
        include: noteInclude,
      });
    });

    if (!note) {
      return notFound();
    }

    return NextResponse.json(note);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/notes/:id
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const result = await prisma.note.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      return notFound();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
