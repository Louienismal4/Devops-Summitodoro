import { z } from "zod";

import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/task";

const taskStatusSchema = z.enum(["active", "completed"]);

const taskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000).nullable(),
  status: taskStatusSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

const storedTasksSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema),
  completedSessionIds: z.array(z.string().uuid()),
});

export type StoredTasks = z.infer<typeof storedTasksSchema>;

export const parseStoredTasks = (value: string): StoredTasks | null => {
  try {
    return storedTasksSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
};

export const sanitizeTaskInput = (input: CreateTaskInput): CreateTaskInput => ({
  title: input.title.trim().slice(0, 120),
  description: input.description?.trim().slice(0, 1_000) || undefined,
});

export const isTaskStatus = (value: string): value is TaskStatus =>
  taskStatusSchema.safeParse(value).success;

export const createTask = (
  input: CreateTaskInput,
  userId: string | null,
  id = crypto.randomUUID(),
  now = new Date().toISOString(),
): Task => {
  const task = sanitizeTaskInput(input);
  if (!task.title) throw new Error("A task title is required.");

  return {
    id,
    userId,
    title: task.title,
    description: task.description ?? null,
    status: "active",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
};

export const updateTask = (
  task: Task,
  input: UpdateTaskInput,
  now = new Date().toISOString(),
): Task => {
  const title =
    input.title === undefined ? task.title : input.title.trim().slice(0, 120);
  if (!title) throw new Error("A task title is required.");
  const status = input.status ?? task.status;

  return {
    ...task,
    title,
    description:
      input.description === undefined
        ? task.description
        : input.description.trim().slice(0, 1_000) || null,
    status,
    updatedAt: now,
    completedAt: status === "completed" ? (task.completedAt ?? now) : null,
  };
};

export const isTaskVisibleInFrontendHistory = (
  task: Task,
  now = new Date(),
) => {
  if (task.status === "active") return false;
  const timestamp =
    task.status === "completed" ? task.completedAt : task.updatedAt;
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const addSoftHyphens = (value: string, interval = 24) =>
  value
    .split(/(\s+)/)
    .map((part) => {
      if (/\s/.test(part) || part.length <= interval) return part;
      return (
        part.match(new RegExp(`.{1,${interval}}`, "g"))?.join("\u00ad") ?? part
      );
    })
    .join("");
