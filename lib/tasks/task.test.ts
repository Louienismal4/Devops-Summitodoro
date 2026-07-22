import { describe, expect, it } from "vitest";

import {
  addSoftHyphens,
  createTask,
  isTaskVisibleInFrontendHistory,
  parseStoredTasks,
  updateTask,
} from "@/lib/tasks/task";

describe("tasks", () => {
  it("creates a trimmed active task", () => {
    const task = createTask(
      {
        title: "  Finish landing page  ",
        description: "  Ship hero section. ",
      },
      null,
      "018f9b8a-0000-4000-8000-000000000001",
      "2026-07-14T00:00:00.000Z",
    );

    expect(task).toMatchObject({
      title: "Finish landing page",
      description: "Ship hero section.",
      status: "active",
    });
  });

  it("marks a completed task with a completion timestamp and clears it when reopened", () => {
    const task = createTask(
      { title: "Write docs" },
      null,
      "018f9b8a-0000-4000-8000-000000000002",
      "2026-07-14T00:00:00.000Z",
    );
    const completed = updateTask(
      task,
      { status: "completed" },
      "2026-07-14T01:00:00.000Z",
    );
    expect(completed.completedAt).toBe("2026-07-14T01:00:00.000Z");
    expect(updateTask(completed, { status: "active" }).completedAt).toBeNull();
  });

  it("recovers legacy task storage without retaining contribution history", () => {
    const parsed = parseStoredTasks(
      JSON.stringify({ version: 1, tasks: [], completedSessionIds: [] }),
    );
    expect(parsed?.tasks).toEqual([]);
  });

  it("keeps historical tasks visible in the UI only for their local calendar day", () => {
    const task = updateTask(
      createTask(
        { title: "Review designs" },
        null,
        "018f9b8a-0000-4000-8000-000000000003",
        "2026-07-14T01:00:00.000Z",
      ),
      { status: "completed" },
      "2026-07-14T12:00:00.000Z",
    );

    expect(
      isTaskVisibleInFrontendHistory(task, new Date("2026-07-14T23:59:00")),
    ).toBe(true);
    expect(
      isTaskVisibleInFrontendHistory(task, new Date("2026-07-15T00:01:00")),
    ).toBe(false);
  });

  it("adds discretionary hyphens to an unbroken task title", () => {
    expect(addSoftHyphens("abcdefghijkl", 4)).toBe("abcd­efgh­ijkl");
    expect(addSoftHyphens("short title", 10)).toBe("short title");
  });
});
