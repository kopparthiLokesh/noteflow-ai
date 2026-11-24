"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const value = query.trim();

    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    const search = params.toString();

    router.replace(search ? `/dashboard?${search}` : "/dashboard");
  }

  function clearSearch() {
    setQuery("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");

    const search = params.toString();

    router.replace(search ? `/dashboard?${search}` : "/dashboard");
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes by title or content..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Search
        </button>

        {currentQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>
    </section>
  );
}
