"use client";

import { useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) {
      setError("Please enter a search question.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    setResults([]);

    try {
      const response = await fetch("/api/embeddings/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Semantic search failed.");
      }

      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setError("");
    setSearched(false);
  }

  return (
    <section className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          AI Semantic Search
        </h2>
        <p className="text-sm text-gray-600">
          Search your notes using natural language.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSearch();
            }
          }}
          placeholder="e.g. What did we discuss about onboarding?"
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-md bg-purple-600 px-5 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search with AI"}
        </button>

        {(searched || error) && (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-purple-700">
          Finding notes related to your question...
        </p>
      )}

      {searched && !loading && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {results.length > 0
              ? `Found ${results.length} relevant note(s)`
              : "No matching notes found."}
          </p>

          {results.map((note) => (
            <article
              key={note.id}
              className="rounded-md border border-purple-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{note.title}</h3>

                <span className="text-xs text-purple-700">
                  Similarity: {(note.similarity * 100).toFixed(1)}%
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {note.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
