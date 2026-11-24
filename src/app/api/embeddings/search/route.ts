import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

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

    // 2. Validate input
    const body = await request.json();
    const { query, limit: requestedLimit } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid search query" },
        { status: 400 },
      );
    }

    const limit = requestedLimit ?? 5;

    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 20" },
        { status: 400 },
      );
    }

    // 3. Generate query embedding
    const embedding = await generateEmbedding(query.trim());

    if (embedding.length !== 384) {
      throw new Error("Invalid embedding dimensions");
    }

    const vectorString = `[${embedding.join(",")}]`;

    // 4. Search only authenticated user's notes
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        n."id",
        n."title",
        n."content",
        (
          1 - (e."embedding" <=> ${vectorString}::vector)
        )::float8 AS "similarity"
      FROM "NoteEmbedding" e
      INNER JOIN "Note" n
        ON n."id" = e."noteId"
      WHERE n."userId" = ${userId}
      ORDER BY
        e."embedding" <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Semantic search error:", error);

    return NextResponse.json(
      { error: "Failed to perform semantic search" },
      { status: 500 },
    );
  }
}
