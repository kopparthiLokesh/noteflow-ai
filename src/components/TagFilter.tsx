"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface NoteTag {
  id: string;
  name: string;
}

interface Note {
  id: string;
  tags: NoteTag[];
}

export default function TagFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTag = searchParams.get("tag") || "";

  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchTags() {
      try {
        const response = await fetch("/api/notes", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load tags.");
        }

        const notes: Note[] = await response.json();

        const uniqueTags = [
          ...new Set(
            notes.flatMap((note) => note.tags.map((item) => item.name)),
          ),
        ].sort();

        if (active) {
          setTags(uniqueTags);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load tags.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTags();

    window.addEventListener("noteflow:notes-updated", fetchTags);

    return () => {
      active = false;
      window.removeEventListener("noteflow:notes-updated", fetchTags);
    };
  }, []);

  function handleTagChange(tag: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }

    const search = params.toString();

    router.replace(search ? `/dashboard?${search}` : "/dashboard");
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Filter by Tags</h2>

        <p className="mt-1 text-xs text-gray-500">
          Select a tag to filter your notes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading tags...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTagChange("")}
            aria-pressed={!selectedTag}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              !selectedTag
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Notes
          </button>

          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagChange(tag)}
              aria-pressed={selectedTag === tag}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                selectedTag === tag
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tag}
            </button>
          ))}

          {tags.length === 0 && (
            <p className="text-sm text-gray-500">No tags available yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
