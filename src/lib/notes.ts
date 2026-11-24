import type { Prisma } from "@prisma/client";

// Relations included whenever notes are retrieved.
export const noteInclude = {
  tags: {
    orderBy: {
      name: "asc",
    },
  },
  tasks: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.NoteInclude;

// Connect existing tags or create new ones.
export function tagsConnectOrCreate(tags: string[]) {
  const uniqueTags = [
    ...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ];

  return uniqueTags.map((name) => ({
    where: {
      name,
    },
    create: {
      name,
    },
  }));
}
