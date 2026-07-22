import type { TrailCheckpoint } from "@/types/trail";

export type TimedMilestone = TrailCheckpoint & {
  elapsedMs: number;
  remainingMs: number;
};

export const SHORT_BREAK_RATIO = 0.2;

export const getShortBreakDurationMs = (
  durationMs: number,
  checkpointCount: number,
): number => {
  const workSegmentMs = durationMs / Math.max(1, checkpointCount + 1);
  return Math.round(workSegmentMs * SHORT_BREAK_RATIO);
};

export const getTimedMilestones = (
  checkpoints: readonly TrailCheckpoint[],
  durationMs: number,
): TimedMilestone[] =>
  checkpoints.map((checkpoint) => {
    const elapsedMs = Math.round(durationMs * checkpoint.progress);
    return {
      ...checkpoint,
      elapsedMs,
      remainingMs: Math.max(0, durationMs - elapsedMs),
    };
  });
