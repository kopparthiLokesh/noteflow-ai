import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { saveNoteEmbedding } from "@/lib/embeddings";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

const BATCH_SIZE = 20;

// POST /api/embeddings/backfill
// Generate embeddings only for the logged-in user's notes
// that do not already have embeddings.
export async function POST() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // Find notes belonging to this user that have no embedding.
    const missingNotes = await prisma.note.findMany({
      where: {
        userId,
        embedding: {
          is: null,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: BATCH_SIZE,
    });

    if (missingNotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All your notes already have embeddings.",
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    let succeeded = 0;
    let failed = 0;

    // Process notes sequentially to avoid loading
    // multiple embedding operations simultaneously.
    for (const note of missingNotes) {
      try {
        await saveNoteEmbedding(note.id, note.title, note.content);

        succeeded++;
      } catch (error) {
        failed++;

        console.error(`Backfill failed for note ${note.id}:`, error);
      }
    }

    // Count how many notes still need embeddings.
    const remaining = await prisma.note.count({
      where: {
        userId,
        embedding: {
          is: null,
        },
      },
    });

    return NextResponse.json({
      success: failed === 0,
      message: "Embedding backfill completed.",
      processed: missingNotes.length,
      succeeded,
      failed,
      remaining,
    });
  } catch (error) {
    console.error("Embedding backfill error:", error);

    return NextResponse.json(
      { error: "Failed to backfill note embeddings." },
      { status: 500 },
    );
  }
}
