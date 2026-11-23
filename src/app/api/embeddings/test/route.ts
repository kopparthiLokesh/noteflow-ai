import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Please provide valid text" },
        { status: 400 },
      );
    }

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
