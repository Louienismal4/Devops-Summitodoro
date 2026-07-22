"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createTask, parseStoredTasks, updateTask } from "@/lib/tasks/task";
import { supabase } from "@/lib/supabase/client";
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/task";

const STORAGE_KEY = "summitodoro:tasks";

type StoredTaskState = {
  tasks: Task[];
  completedSessionIds: string[];
};

type DatabaseTask = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

const toTask = (task: DatabaseTask): Task => ({
  id: task.id,
  userId: task.user_id,
  title: task.title,
  description: task.description,
  status: task.status,
  sortOrder: task.sort_order,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  completedAt: task.completed_at,
});

export const useTasks = () => {
  const [state, setState] = useState<StoredTaskState>({
    tasks: [],
    completedSessionIds: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const parsed = parseStoredTasks(
      window.localStorage.getItem(STORAGE_KEY) ?? "",
    );
    /* eslint-disable react-hooks/set-state-in-effect -- synchronizing React with localStorage after hydration */
    if (parsed) {
      setState({
        tasks: parsed.tasks,
        completedSessionIds: parsed.completedSessionIds,
      });
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, ...state }),
    );
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !supabase) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      setAccountId(data.user.id);
      await supabase.rpc("purge_expired_task_history");
      const { data: remoteTasks } = await supabase
        .from("tasks")
        .select(
          "id, user_id, title, description, status, sort_order, created_at, updated_at, completed_at",
        )
        .order("sort_order")
        .order("created_at");
      if (!cancelled && remoteTasks) {
        setState((current) => ({ ...current, tasks: remoteTasks.map(toTask) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const create = useCallback(
    (input: CreateTaskInput) => {
      const task = {
        ...createTask(input, accountId),
        sortOrder:
          Math.max(
            -1,
            ...state.tasks
              .filter((current) => current.status === "active")
              .map((current) => current.sortOrder),
          ) + 1,
      };
      setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
      if (supabase) {
        void (async () => {
          let userId = accountId;
          if (!userId) {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) {
              console.error("Unable to save task: no signed-in user.", error);
              return;
            }
            userId = data.user.id;
            setAccountId(userId);
          }

          const { error } = await supabase.from("tasks").insert({
            id: task.id,
            user_id: userId,
            title: task.title,
            description: task.description,
            sort_order: task.sortOrder,
          });
          if (error) console.error("Unable to save task.", error);
        })();
      }
      return task;
    },
    [accountId, state.tasks],
  );

  const update = useCallback(
    (taskId: string, input: UpdateTaskInput) => {
      let nextTask: Task | null = null;
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => {
          if (task.id !== taskId) return task;
          nextTask = updateTask(task, input);
          return nextTask;
        }),
      }));
      if (accountId && supabase) {
        const patch: Record<string, string | null> = {};
        if (input.title !== undefined) patch.title = input.title.trim();
        if (input.description !== undefined)
          patch.description = input.description.trim() || null;
        if (input.status !== undefined) {
          patch.status = input.status;
          patch.completed_at =
            input.status === "completed" ? new Date().toISOString() : null;
        }
        void supabase.from("tasks").update(patch).eq("id", taskId);
      }
      return nextTask;
    },
    [accountId],
  );

  const remove = useCallback(
    (taskId: string) => {
      setState((current) => ({
        ...current,
        tasks: current.tasks.filter((task) => task.id !== taskId),
      }));
      if (accountId && supabase)
        void supabase.from("tasks").delete().eq("id", taskId);
    },
    [accountId],
  );

  const reorderActiveTasks = useCallback(
    (taskIds: readonly string[]) => {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => {
          const sortOrder = taskIds.indexOf(task.id);
          return sortOrder >= 0 ? { ...task, sortOrder } : task;
        }),
      }));
      if (accountId && supabase) {
        void supabase.rpc("reorder_active_tasks", { p_task_ids: [...taskIds] });
      }
    },
    [accountId],
  );

  return useMemo(
    () => ({
      tasks: state.tasks,
      hydrated,
      create,
      update,
      remove,
      reorderActiveTasks,
    }),
    [create, hydrated, reorderActiveTasks, remove, state.tasks, update],
  );
};
