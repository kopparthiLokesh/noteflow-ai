import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

export async function POST(request: Request) {
  try {
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
        { error: "Limit must be an integer between 1 and 20" },
        { status: 400 },
      );
    }

    const embedding = await generateEmbedding(query.trim());

    if (embedding.length !== 384) {
      throw new Error("Invalid embedding dimensions");
    }

    const vectorString = `[${embedding.join(",")}]`;

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
      ORDER BY
        e."embedding" <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      query,
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
