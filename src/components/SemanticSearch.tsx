"use client";

import { useState, type FormEvent } from "react";

interface RagSource {
  id?: string;
  title?: string;
  noteTitle?: string;
  content?: string;
  similarity?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
}

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = query.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuery("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to generate an answer.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "No answer was generated.",
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
    setQuery("");
  }

  return (
    <section className="space-y-4 rounded-xl border border-purple-200 bg-purple-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            NoteFlow AI Assistant
          </h2>
          <p className="text-sm text-gray-600">
            Ask questions and get answers from your notes using RAG.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="max-h-[500px] space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-purple-300 bg-white p-6 text-center">
            <p className="font-medium text-gray-800">
              Ask your notes anything.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Example: What technologies am I using to build my RAG system?
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl bg-purple-600 p-3 text-white"
                : "mr-auto max-w-[95%] space-y-3 rounded-xl border border-purple-200 bg-white p-4"
            }
          >
            <p className="mb-1 text-xs font-semibold uppercase opacity-70">
              {message.role === "user" ? "You" : "NoteFlow AI"}
            </p>

            <p className="whitespace-pre-wrap text-sm leading-6">
              {message.content}
            </p>

            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">
                    Retrieved Sources ({message.sources.length})
                  </h3>

                  <div className="space-y-2">
                    {message.sources.map((source, index) => (
                      <article
                        key={source.id || `${message.id}-${index}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {source.title ||
                              source.noteTitle ||
                              `Source ${index + 1}`}
                          </h4>

                          {typeof source.similarity === "number" && (
                            <span className="text-xs font-medium text-purple-700">
                              Similarity: {(source.similarity * 100).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>

                        {source.content && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                            {source.content}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}

        {loading && (
          <div className="rounded-lg border border-purple-200 bg-white p-4 text-sm text-purple-700">
            NoteFlow AI is retrieving relevant notes and generating an answer...
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask something about your notes..."
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </form>
    </section>
  );
}
