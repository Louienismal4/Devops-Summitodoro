export type SessionStatus = "idle" | "running" | "paused" | "completed";

export type FocusSession = {
  id: string;
  durationMs: number;
  startedAt: number | null;
  pausedAt: number | null;
  accumulatedPausedMs: number;
  status: SessionStatus;
};

export type PersistedFocusSession = {
  version: 2;
  session: FocusSession;
  reachedCheckpointIds: string[];
  breakUntil?: number | null;
};
