import { z } from "zod";

// Shared tag validation
const tagsSchema = z.array(z.string().trim().min(1).max(30)).max(20).optional();

// Create note validation
export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().trim().min(1, "Content is required"),
  tags: tagsSchema,
});

// Update note validation
export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).optional(),
    tags: tagsSchema,
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.tags !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

// Create task validation
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  noteId: z.string().trim().min(1).optional(),
});
