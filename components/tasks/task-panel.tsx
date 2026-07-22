"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addSoftHyphens,
  isTaskVisibleInFrontendHistory,
} from "@/lib/tasks/task";
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/task";

const MAX_ACTIVE_TASKS = 10;

type TaskPanelProps = {
  tasks: readonly Task[];
  onCreate: (input: CreateTaskInput) => Task;
  onUpdate: (taskId: string, input: UpdateTaskInput) => void;
  onDelete: (taskId: string) => void;
  onReorder: (taskIds: readonly string[]) => void;
};

function SortableTask({
  id,
  children,
}: {
  id: string;
  children: (
    dragHandleProps: React.ComponentProps<typeof Button>,
  ) => React.ReactNode;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={
        isDragging ? "task-sortable-item is-dragging" : "task-sortable-item"
      }
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

const statusLabel: Record<TaskStatus, string> = {
  active: "Active",
  completed: "Completed",
};

export function TaskPanel({
  tasks,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: TaskPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<Task | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const activeTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status === "active")
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [tasks],
  );
  const historicalTasks = useMemo(
    () => tasks.filter((task) => isTaskVisibleInFrontendHistory(task, now)),
    [now, tasks],
  );
  const completedTasks = useMemo(
    () => historicalTasks.filter((task) => task.status === "completed"),
    [historicalTasks],
  );
  const activeTaskLimitReached = activeTasks.length >= MAX_ACTIVE_TASKS;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      onUpdate(editingId, { title, description });
    } else {
      onCreate({ title, description });
    }
    resetForm();
  };

  const beginEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setShowForm(true);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previousIndex = activeTasks.findIndex(
      (task) => task.id === active.id,
    );
    const nextIndex = activeTasks.findIndex((task) => task.id === over.id);
    if (previousIndex < 0 || nextIndex < 0) return;
    onReorder(
      arrayMove(activeTasks, previousIndex, nextIndex).map((task) => task.id),
    );
  };

  const renderTask = (
    task: Task,
    dragHandleProps?: React.ComponentProps<typeof Button>,
  ) => (
    <article key={task.id} className="task-card">
      <div className="task-card-main">
        {dragHandleProps && (
          <Button
            variant="ghost"
            size="icon"
            className="task-drag-handle"
            aria-label={`Reorder ${task.title}`}
            {...dragHandleProps}
          >
            <span aria-hidden="true">⠿</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="task-select-button"
          onClick={() => setViewingTask(task)}
        >
          <span>
            <strong>{task.title}</strong>
            {task.description && <small>{task.description}</small>}
          </span>
        </Button>
        <div className="task-card-controls">
          <span className={`task-status task-status-${task.status}`}>
            {statusLabel[task.status]}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="task-more-button"
                aria-label={`Manage ${task.title}`}
              >
                <span aria-hidden="true">•••</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="task-menu" align="end">
              <DropdownMenuItem onSelect={() => setViewingTask(task)}>
                View task
              </DropdownMenuItem>
              {task.status === "active" && (
                <DropdownMenuItem
                  onSelect={() => {
                    onUpdate(task.id, { status: "completed" });
                  }}
                >
                  Mark complete
                </DropdownMenuItem>
              )}
              {task.status === "completed" && (
                <DropdownMenuItem
                  onSelect={() => onUpdate(task.id, { status: "active" })}
                >
                  Reopen task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => beginEdit(task)}>
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem
                className="task-menu-delete"
                onSelect={() => setTaskPendingDeletion(task)}
              >
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );

  return (
    <section
      className="hud-card task-panel"
      aria-labelledby="task-panel-heading"
    >
      <div className="hud-card-heading">
        <span>☑</span>
        <strong id="task-panel-heading">Tasks</strong>
        <small>
          {activeTasks.length}/{MAX_ACTIVE_TASKS} active
        </small>
      </div>
      <p className="task-intro">
        Keep your expedition checklist simple: active or completed.
      </p>
      <div className="task-selection-row">
        <Button
          size="sm"
          className="task-new-button"
          disabled={activeTaskLimitReached}
          title={
            activeTaskLimitReached
              ? "Complete or delete a task before creating another."
              : undefined
          }
          onClick={() => {
            setEditingId(null);
            setTitle("");
            setDescription("");
            setShowForm(true);
          }}
        >
          + New
        </Button>
      </div>
      {activeTaskLimitReached && (
        <p className="task-limit-notice">
          You have reached the 10-task limit. Complete or delete a task to add
          another.
        </p>
      )}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="task-dialog">
          <DialogTitle>{editingId ? "Edit task" : "Create a task"}</DialogTitle>
          <DialogDescription>
            Give your next focus expedition a clear objective.
          </DialogDescription>
          <form className="task-form" onSubmit={submit}>
            <label>
              Task title
              <input
                value={title}
                maxLength={120}
                autoFocus
                placeholder="Enter a task title..."
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Description <small>optional</small>
              <textarea
                value={description}
                maxLength={1_000}
                rows={2}
                placeholder="Describe the task..."
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div>
              <Button type="submit" size="sm" className="task-save-button">
                {editingId ? "Save task" : "Create task"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="task-cancel"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={viewingTask !== null}
        onOpenChange={(open) => {
          if (!open) setViewingTask(null);
        }}
      >
        {viewingTask && (
          <DialogContent className="task-dialog task-view-dialog">
            <span className={`task-status task-status-${viewingTask.status}`}>
              {statusLabel[viewingTask.status]}
            </span>
            <DialogTitle>{addSoftHyphens(viewingTask.title)}</DialogTitle>
            <DialogDescription>
              {viewingTask.description || "No description added yet."}
            </DialogDescription>
            <Button
              variant="secondary"
              size="sm"
              className="task-view-close"
              onClick={() => setViewingTask(null)}
            >
              Close
            </Button>
          </DialogContent>
        )}
      </Dialog>
      <Dialog
        open={taskPendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) setTaskPendingDeletion(null);
        }}
      >
        {taskPendingDeletion && (
          <DialogContent className="task-dialog task-delete-dialog">
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              “{taskPendingDeletion.title}” and its local focus history will be
              permanently removed.
            </DialogDescription>
            <div className="task-delete-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTaskPendingDeletion(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="task-delete-confirm"
                onClick={() => {
                  onDelete(taskPendingDeletion.id);
                  setTaskPendingDeletion(null);
                }}
              >
                Delete task
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      {activeTasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="task-list task-list-sortable">
              {activeTasks.map((task) => (
                <SortableTask key={task.id} id={task.id}>
                  {(dragHandleProps) => renderTask(task, dragHandleProps)}
                </SortableTask>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {activeTasks.length === 0 && !showForm && (
        <p className="task-empty">
          Create a task, then select it before you deploy your hiker.
        </p>
      )}
      {historicalTasks.length > 0 && (
        <div className="task-history">
          <Button
            variant="ghost"
            size="sm"
            className={
              showCompleted
                ? "task-history-toggle is-open"
                : "task-history-toggle"
            }
            onClick={() => setShowCompleted((visible) => !visible)}
          >
            <span aria-hidden="true">◷</span>
            <strong>Task history</strong>
            <b>{historicalTasks.length}</b>
            <span className="task-history-chevron" aria-hidden="true" />
          </Button>
          {showCompleted && (
            <div className="task-history-groups">
              {completedTasks.length > 0 && (
                <section className="task-history-group">
                  w{" "}
                  <div className="task-history-heading">
                    <span>✓</span>
                    <strong>Completed</strong>
                    <small>{completedTasks.length}</small>
                  </div>
                  <div className="task-list">
                    {completedTasks.map((task) => renderTask(task))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
