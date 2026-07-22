import { describe, expect, it } from "vitest";

import { getShortBreakDurationMs, getTimedMilestones } from "./milestones";

const checkpoints = [
  { id: "first", name: "First", description: "", progress: 0.35 },
  { id: "second", name: "Second", description: "", progress: 0.7 },
];

describe("getTimedMilestones", () => {
  it("scales checkpoint times to the selected focus duration", () => {
    expect(getTimedMilestones(checkpoints, 25 * 60_000)).toMatchObject([
      { id: "first", elapsedMs: 525_000, remainingMs: 975_000 },
      { id: "second", elapsedMs: 1_050_000, remainingMs: 450_000 },
    ]);
  });

  it("keeps the same route proportions for a short session", () => {
    expect(getTimedMilestones(checkpoints, 5 * 60_000)).toMatchObject([
      { id: "first", elapsedMs: 105_000, remainingMs: 195_000 },
      { id: "second", elapsedMs: 210_000, remainingMs: 90_000 },
    ]);
  });

  it("uses 20 percent of each work segment for short breaks", () => {
    expect(getShortBreakDurationMs(60 * 60_000, 2)).toBe(4 * 60_000);
  });
});
