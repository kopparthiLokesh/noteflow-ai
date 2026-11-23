import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

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
