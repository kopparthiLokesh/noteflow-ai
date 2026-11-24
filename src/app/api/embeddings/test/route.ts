import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // 2. Validate input
    const { text } = await request.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Please provide valid text" },
        { status: 400 },
      );
    }

    // 3. Generate embedding
    const embedding = await generateEmbedding(text);

    return NextResponse.json({
      success: true,
      dimensions: embedding.length,
      embeddingPreview: embedding.slice(0, 5),
    });
  } catch (error) {
    console.error("Embedding error:", error);

    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 },
    );
  }
}
