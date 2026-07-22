import { z } from "zod";

import type { FocusSession, PersistedFocusSession } from "@/types/session";

const sessionSchema = z.object({
  id: z.string().min(1),
  durationMs: z.number().int().positive(),
  startedAt: z.number().nonnegative().nullable(),
  pausedAt: z.number().nonnegative().nullable(),
  accumulatedPausedMs: z.number().nonnegative(),
  status: z.enum(["idle", "running", "paused", "completed"]),
});

const persistedFocusSessionSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  session: sessionSchema,
  reachedCheckpointIds: z.array(z.string()),
  breakUntil: z.number().nonnegative().nullable().optional(),
});

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

export const createFocusSession = (
  durationMs: number,
  id = crypto.randomUUID(),
): FocusSession => ({
  id,
  durationMs,
  startedAt: null,
  pausedAt: null,
  accumulatedPausedMs: 0,
  status: "idle",
});

export const getElapsedMs = (session: FocusSession, now: number): number => {
  if (session.startedAt === null || session.status === "idle") return 0;
  if (session.status === "completed") return session.durationMs;

  const currentPauseDuration =
    session.status === "paused" && session.pausedAt !== null
      ? Math.max(0, now - session.pausedAt)
      : 0;

  return clamp(
    now -
      session.startedAt -
      session.accumulatedPausedMs -
      currentPauseDuration,
    0,
    session.durationMs,
  );
};

export const getProgress = (session: FocusSession, now: number): number =>
  getElapsedMs(session, now) / session.durationMs;

export const getRemainingMs = (session: FocusSession, now: number): number =>
  Math.max(0, session.durationMs - getElapsedMs(session, now));

export const startSession = (
  session: FocusSession,
  now: number,
): FocusSession => {
  if (session.status !== "idle") return session;
  return { ...session, startedAt: now, status: "running" };
};

export const pauseSession = (
  session: FocusSession,
  now: number,
): FocusSession => {
  if (session.status !== "running") return session;
  return { ...session, pausedAt: now, status: "paused" };
};

export const resumeSession = (
  session: FocusSession,
  now: number,
): FocusSession => {
  if (session.status !== "paused" || session.pausedAt === null) return session;
  return {
    ...session,
    accumulatedPausedMs:
      session.accumulatedPausedMs + Math.max(0, now - session.pausedAt),
    pausedAt: null,
    status: "running",
  };
};

export const completeSessionIfElapsed = (
  session: FocusSession,
  now: number,
): FocusSession => {
  if (session.status !== "running" || getProgress(session, now) < 1)
    return session;
  return { ...session, pausedAt: null, status: "completed" };
};

export const parsePersistedSession = (
  value: string,
): PersistedFocusSession | null => {
  try {
    const parsed = persistedFocusSessionSchema.parse(JSON.parse(value));
    return {
      ...parsed,
      version: 2,
    };
  } catch {
    return null;
  }
};
