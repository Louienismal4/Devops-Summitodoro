export type TaskStatus = "active" | "completed";

export type Task = {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
};
