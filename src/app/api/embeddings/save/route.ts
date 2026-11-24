import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // 2. Validate request
    const body = await request.json();
    const { noteId } = body;

    if (typeof noteId !== "string" || !noteId.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid noteId" },
        { status: 400 },
      );
    }

    // 3. Verify note ownership
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // 4. Generate embedding
    const text = `${note.title}\n${note.content}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 384) {
      throw new Error("Invalid embedding dimensions");
    }

    const vectorString = `[${embedding.join(",")}]`;

    // 5. Save or update embedding
    await prisma.$executeRaw`
      INSERT INTO "NoteEmbedding"
        ("id", "noteId", "embedding", "createdAt")
      VALUES (
        ${`c${randomUUID().replace(/-/g, "")}`},
        ${note.id},
        ${vectorString}::vector,
        NOW()
      )
      ON CONFLICT ("noteId")
      DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "createdAt" = NOW()
    `;

    return NextResponse.json({
      success: true,
      message: "Note embedding saved successfully",
      noteId: note.id,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("Embedding storage error:", error);

    return NextResponse.json(
      { error: "Failed to save note embedding" },
      { status: 500 },
    );
  }
}
