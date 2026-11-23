import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-session";

import NoteForm from "@/components/NoteForm";
import NoteList from "@/components/NoteList";
import SearchBar from "@/components/SearchBar";
import TagFilter from "@/components/TagFilter";
import SemanticSearch from "@/components/SemanticSearch";
import LogoutButton from "../../components/LogoutButton";

export const runtime = "nodejs";

export default async function Dashboard() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Notes & Tasks</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <LogoutButton />
      </header>

      <NoteForm />

      <div className="space-y-3">
        <SearchBar />
        <TagFilter />
      </div>

      <SemanticSearch />

      <NoteList />
    </main>
  );
}
