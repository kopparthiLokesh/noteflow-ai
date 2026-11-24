import { NextResponse } from "next/server";
import Groq from "groq-sdk";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { getAuthenticatedUserId } from "@/lib/auth-session";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface RetrievedNote {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { query } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid question." },
        { status: 400 },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured." },
        { status: 500 },
      );
    }

    // 1. Generate query embedding
    const embedding = await generateEmbedding(query.trim());
    const vectorString = `[${embedding.join(",")}]`;

    // 2. Retrieve relevant notes from Neon
    const notes = await prisma.$queryRaw<RetrievedNote[]>`
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
      ORDER BY e."embedding" <=> ${vectorString}::vector
      LIMIT 5
    `;

    if (notes.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "I couldn't find any relevant notes to answer your question.",
        sources: [],
      });
    }

    // 3. Build context from retrieved notes
    const context = notes
      .map(
        (note, index) => `Source ${index + 1}: ${note.title}\n${note.content}`,
      )
      .join("\n\n");

    // 4. Generate a context-aware answer using Groq
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are NoteFlow AI, an assistant that answers questions using the user's saved notes.

Use only the provided context.
If the answer is not available in the context, clearly say you could not find it in the saved notes.
Do not invent facts.
Give clear, concise answers.`,
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${query.trim()}`,
        },
      ],
    });

    const answer =
      completion.choices[0]?.message?.content ||
      "I couldn't generate an answer.";

    // 5. Return answer and source notes
    return NextResponse.json({
      success: true,
      answer,
      sources: notes.map((note) => ({
        id: note.id,
        title: note.title,
        similarity: note.similarity,
      })),
    });
  } catch (error) {
    console.error("RAG API error:", error);

    return NextResponse.json(
      { error: "Failed to generate a RAG response." },
      { status: 500 },
    );
  }
}
