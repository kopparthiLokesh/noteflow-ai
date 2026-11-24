import Groq from "groq-sdk";

interface StreamTextOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export async function* streamText({
  system,
  prompt,
  maxTokens = 300,
}: StreamTextOptions): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing from environment variables.");
  }

  const groq = new Groq({
    apiKey,
  });

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const stream = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_completion_tokens: maxTokens,
    temperature: 0.3,
    stream: true,
  });

  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;

    if (typeof piece === "string" && piece.length > 0) {
      yield piece;
    }
  }
}
