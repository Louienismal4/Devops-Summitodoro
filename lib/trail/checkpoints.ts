import type { TrailCheckpoint } from "@/types/trail";

export const getNewlyReachedCheckpoints = (
  checkpoints: TrailCheckpoint[],
  previousProgress: number,
  currentProgress: number,
  reachedCheckpointIds: readonly string[],
): TrailCheckpoint[] => {
  if (currentProgress <= previousProgress) return [];

  const reached = new Set(reachedCheckpointIds);
  return checkpoints.filter(
    (checkpoint) =>
      checkpoint.progress > previousProgress &&
      checkpoint.progress <= currentProgress &&
      !reached.has(checkpoint.id),
  );
};
