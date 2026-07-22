import { describe, expect, it } from "vitest";

import {
  completeSessionIfElapsed,
  createFocusSession,
  getElapsedMs,
  getProgress,
  getRemainingMs,
  parsePersistedSession,
  pauseSession,
  resumeSession,
  startSession,
} from "@/lib/timer/focus-session";

describe("focus session timer", () => {
  it("derives elapsed time from timestamps instead of ticks", () => {
    const session = startSession(
      createFocusSession(60_000, "session-1"),
      1_000,
    );
    expect(getElapsedMs(session, 16_000)).toBe(15_000);
    expect(getRemainingMs(session, 16_000)).toBe(45_000);
    expect(getProgress(session, 16_000)).toBe(0.25);
  });

  it("excludes the current and accumulated pause durations", () => {
    const running = startSession(
      createFocusSession(60_000, "session-1"),
      1_000,
    );
    const paused = pauseSession(running, 11_000);
    expect(getElapsedMs(paused, 31_000)).toBe(10_000);

    const resumed = resumeSession(paused, 31_000);
    expect(getElapsedMs(resumed, 41_000)).toBe(20_000);
    expect(resumed.accumulatedPausedMs).toBe(20_000);
  });

  it("clamps progress and completes a recovered expired session", () => {
    const running = startSession(createFocusSession(5_000, "session-1"), 1_000);
    expect(getProgress(running, 10_000)).toBe(1);
    expect(completeSessionIfElapsed(running, 10_000).status).toBe("completed");
  });

  it("rejects malformed local storage values", () => {
    expect(parsePersistedSession("not-json")).toBeNull();
    expect(parsePersistedSession('{"version":2}')).toBeNull();
  });
});
