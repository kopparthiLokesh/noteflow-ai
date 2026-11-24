"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

interface Tag {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  tasks: Task[];
}

export default function NoteList() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [taskLoadingId, setTaskLoadingId] = useState<string | null>(null);

  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);

  const [actionError, setActionError] = useState("");

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (query) params.set("q", query);
      if (tag) params.set("tag", tag);

      const search = params.toString();

      const response = await fetch(
        search ? `/api/notes?${search}` : "/api/notes",
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load notes.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected notes response.");
      }

      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  }, [query, tag]);

  useEffect(() => {
    refreshNotes();

    const handleUpdate = () => {
      refreshNotes();
    };

    window.addEventListener("noteflow:notes-updated", handleUpdate);

    return () => {
      window.removeEventListener("noteflow:notes-updated", handleUpdate);
    };
  }, [refreshNotes]);

  function startEditing(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.map((item) => item.name).join(", "));
    setActionError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) return;

    setActionError("");

    try {
      const response = await fetch(`/api/notes/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          tags: editTags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update note.");
      }

      cancelEditing();
      await refreshNotes();

      window.dispatchEvent(new Event("noteflow:notes-updated"));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update note.",
      );
    }
  }

  async function deleteNote(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note? Its linked tasks will remain in the database.",
    );

    if (!confirmed) return;

    setActionError("");

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete note.");
      }

      await refreshNotes();

      window.dispatchEvent(new Event("noteflow:notes-updated"));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete note.",
      );
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>, noteId: string) {
    event.preventDefault();

    const title = taskInputs[noteId]?.trim();

    if (!title) return;

    setTaskLoadingId(noteId);
    setActionError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          noteId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create task.");
      }

      setTaskInputs((previous) => ({
        ...previous,
        [noteId]: "",
      }));

      await refreshNotes();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to create task.",
      );
    } finally {
      setTaskLoadingId(null);
    }
  }

  async function summarizeNote(note: Note) {
    setSummaryLoadingId(note.id);
    setActionError("");

    setSummaries((previous) => ({
      ...previous,
      [note.id]: "",
    }));

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: note.content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to summarize note.");
      }

      if (!response.body) {
        throw new Error("Streaming response is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setSummaries((previous) => ({
          ...previous,
          [note.id]: (previous[note.id] || "") + chunk,
        }));
      }

      const remaining = decoder.decode();

      if (remaining) {
        setSummaries((previous) => ({
          ...previous,
          [note.id]: (previous[note.id] || "") + remaining,
        }));
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Summarization failed.",
      );
    } finally {
      setSummaryLoadingId(null);
    }
  }

  if (loading) {
    return (
      <section className="py-10 text-center text-gray-500">
        Loading your notes...
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Notes</h2>
          <p className="mt-1 text-sm text-gray-500">
            {notes.length} note(s) found
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshNotes()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {!error && notes.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <h3 className="font-semibold text-gray-800">No notes found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create a new note or change your search filters.
          </p>
        </div>
      )}

      {notes.map((note) => (
        <article
          key={note.id}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          {editingId === note.id ? (
            <form onSubmit={saveNote} className="space-y-3">
              <h3 className="font-semibold text-gray-900">Edit Note</h3>

              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Note title"
                maxLength={200}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />

              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                placeholder="Note content"
                rows={5}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />

              <input
                value={editTags}
                onChange={(event) => setEditTags(event.target.value)}
                placeholder="Tags separated by commas"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-semibold text-gray-900">
                    {note.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Created: {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(note)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {note.content}
              </p>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => summarizeNote(note)}
                  disabled={summaryLoadingId === note.id}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {summaryLoadingId === note.id
                    ? "Generating summary..."
                    : "AI Summarize"}
                </button>

                {summaries[note.id] !== undefined && (
                  <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <h4 className="text-sm font-semibold text-purple-900">
                      AI Summary
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {summaries[note.id] || "Generating..."}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  Tasks ({note.tasks.length})
                </h4>

                {note.tasks.length > 0 ? (
                  <ul className="mb-3 space-y-2">
                    {note.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            task.done ? "bg-green-500" : "bg-orange-400"
                          }`}
                        />

                        <span className={task.done ? "line-through" : ""}>
                          {task.title}
                        </span>

                        <span className="ml-auto text-xs text-gray-400">
                          {task.done ? "Completed" : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-3 text-xs text-gray-500">
                    No tasks linked to this note.
                  </p>
                )}

                <form
                  onSubmit={(event) => createTask(event, note.id)}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    type="text"
                    value={taskInputs[note.id] || ""}
                    onChange={(event) =>
                      setTaskInputs((previous) => ({
                        ...previous,
                        [note.id]: event.target.value,
                      }))
                    }
                    placeholder="Add a task..."
                    maxLength={200}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />

                  <button
                    type="submit"
                    disabled={
                      taskLoadingId === note.id || !taskInputs[note.id]?.trim()
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {taskLoadingId === note.id ? "Adding..." : "Add Task"}
                  </button>
                </form>
              </div>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
