import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noteId } = body;

    // Validate note ID
    if (typeof noteId !== "string" || !noteId.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid noteId" },
        { status: 400 },
      );
    }

    // Find the note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Generate embedding
    const text = `${note.title}\n${note.content}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 384) {
      throw new Error("Invalid embedding dimensions");
    }

    // Convert to PostgreSQL vector
    const vectorString = `[${embedding.join(",")}]`;

    // Insert or update embedding
    await prisma.$executeRaw`
      INSERT INTO "NoteEmbedding"
        ("id", "noteId", "embedding", "createdAt")
      VALUES (
        ${`c${crypto.randomUUID().replace(/-/g, "")}`},
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
