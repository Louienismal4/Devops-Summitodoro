"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  completeSessionIfElapsed,
  createFocusSession,
  getProgress,
  getRemainingMs,
  parsePersistedSession,
  pauseSession,
  resumeSession,
  startSession,
} from "@/lib/timer/focus-session";
import { getShortBreakDurationMs } from "@/lib/timer/milestones";
import { getNewlyReachedCheckpoints } from "@/lib/trail/checkpoints";
import type { FocusSession, PersistedFocusSession } from "@/types/session";
import type { TrailCheckpoint } from "@/types/trail";

type UseFocusSessionOptions = {
  storageKey: string;
  initialDurationMs: number;
  checkpoints: TrailCheckpoint[];
};

export const useFocusSession = ({
  storageKey,
  initialDurationMs,
  checkpoints,
}: UseFocusSessionOptions) => {
  const [session, setSession] = useState<FocusSession>(() =>
    createFocusSession(initialDurationMs),
  );
  const [now, setNow] = useState(Date.now);
  const [hydrated, setHydrated] = useState(false);
  const [reachedCheckpointIds, setReachedCheckpointIds] = useState<string[]>(
    [],
  );
  const [latestCheckpoint, setLatestCheckpoint] =
    useState<TrailCheckpoint | null>(null);
  const [breakUntil, setBreakUntil] = useState<number | null>(null);
  const previousProgress = useRef(0);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const persisted = stored ? parsePersistedSession(stored) : null;
    const hydrationTime = Date.now();
    const recovered = persisted
      ? completeSessionIfElapsed(persisted.session, hydrationTime)
      : null;

    // Storage recovery must finish after the hydration commit but before the
    // controls are enabled. Deferring this to a timer can be cancelled by an
    // early map failure and leave the application permanently unhydrated.
    /* eslint-disable react-hooks/set-state-in-effect -- synchronizing React with localStorage after hydration */
    if (recovered && persisted) {
      setSession(recovered);
      setReachedCheckpointIds(persisted.reachedCheckpointIds);
      setBreakUntil(persisted.breakUntil ?? null);
      previousProgress.current = getProgress(recovered, hydrationTime);
    }
    setNow(hydrationTime);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const persisted: PersistedFocusSession = {
      version: 2,
      session,
      reachedCheckpointIds,
      breakUntil,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(persisted));
  }, [breakUntil, hydrated, reachedCheckpointIds, session, storageKey]);

  useEffect(() => {
    if (session.status !== "running" && breakUntil === null) return;

    const updateFromClock = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (breakUntil !== null && currentTime >= breakUntil) {
        setBreakUntil(null);
        setSession((current) => resumeSession(current, currentTime));
        return;
      }
      setSession((current) => completeSessionIfElapsed(current, currentTime));
    };

    updateFromClock();
    const interval = window.setInterval(updateFromClock, 1_000);
    return () => window.clearInterval(interval);
  }, [breakUntil, session.status]);

  const progress = getProgress(session, now);

  useEffect(() => {
    if (!hydrated || progress <= previousProgress.current) {
      previousProgress.current = progress;
      return;
    }

    const crossed = getNewlyReachedCheckpoints(
      checkpoints,
      previousProgress.current,
      progress,
      reachedCheckpointIds,
    );

    if (crossed.length > 0) {
      setReachedCheckpointIds((current) => [
        ...current,
        ...crossed.map((checkpoint) => checkpoint.id),
      ]);
      setLatestCheckpoint(crossed.at(-1) ?? null);
      if (session.status === "running" && breakUntil === null) {
        const breakStartedAt = now;
        setSession((current) => pauseSession(current, breakStartedAt));
        setBreakUntil(
          breakStartedAt +
            getShortBreakDurationMs(session.durationMs, checkpoints.length),
        );
      }
    }
    previousProgress.current = progress;
  }, [
    breakUntil,
    checkpoints,
    hydrated,
    now,
    progress,
    reachedCheckpointIds,
    session,
  ]);

  const start = useCallback(() => {
    const currentTime = Date.now();
    setNow(currentTime);
    setSession((current) => startSession(current, currentTime));
  }, []);

  const pause = useCallback(() => {
    const currentTime = Date.now();
    setNow(currentTime);
    setSession((current) => pauseSession(current, currentTime));
  }, []);

  const resume = useCallback(() => {
    if (breakUntil !== null) return;
    const currentTime = Date.now();
    setNow(currentTime);
    setSession((current) => resumeSession(current, currentTime));
  }, [breakUntil]);

  const reset = useCallback(() => {
    setSession((current) => createFocusSession(current.durationMs));
    setReachedCheckpointIds([]);
    setLatestCheckpoint(null);
    setBreakUntil(null);
    previousProgress.current = 0;
    setNow(Date.now());
  }, []);

  const setDuration = useCallback((durationMs: number) => {
    setSession((current) =>
      current.status === "idle" ? createFocusSession(durationMs) : current,
    );
    setBreakUntil(null);
    previousProgress.current = 0;
  }, []);

  const dismissCheckpoint = useCallback(() => setLatestCheckpoint(null), []);

  return useMemo(
    () => ({
      session,
      hydrated,
      progress,
      remainingMs: getRemainingMs(session, now),
      isOnBreak: breakUntil !== null,
      shortBreakRemainingMs:
        breakUntil === null ? 0 : Math.max(0, breakUntil - now),
      reachedCheckpointIds,
      latestCheckpoint,
      start,
      pause,
      resume,
      reset,
      setDuration,
      dismissCheckpoint,
    }),
    [
      dismissCheckpoint,
      hydrated,
      breakUntil,
      latestCheckpoint,
      now,
      pause,
      progress,
      reachedCheckpointIds,
      reset,
      resume,
      session,
      setDuration,
      start,
    ],
  );
};
