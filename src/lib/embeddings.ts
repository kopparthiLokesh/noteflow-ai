import "server-only";

import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", MODEL_NAME, {
      dtype: "fp32",
    });
  }

  return extractor;
}

// Generate a 384-dimensional embedding.
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty");
  }

  const model = await getExtractor();

  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(output.data as Float32Array);

  if (embedding.length !== 384) {
    throw new Error(`Expected 384 dimensions, received ${embedding.length}`);
  }

  return embedding;
}

// Generate and automatically save or update a note embedding.
export async function saveNoteEmbedding(
  noteId: string,
  title: string,
  content: string,
): Promise<void> {
  const text = `${title}\n${content}`;

  const embedding = await generateEmbedding(text);

  if (embedding.length !== 384) {
    throw new Error("Invalid embedding dimensions");
  }

  const vectorString = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "NoteEmbedding"
      ("id", "noteId", "embedding", "createdAt")
    VALUES (
      ${`c${randomUUID().replace(/-/g, "")}`},
      ${noteId},
      ${vectorString}::vector,
      NOW()
    )
    ON CONFLICT ("noteId")
    DO UPDATE SET
      "embedding" = EXCLUDED."embedding",
      "createdAt" = NOW()
  `;
}
