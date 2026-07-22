import { describe, expect, it } from "vitest";

import {
  awardCompletedSession,
  calculateTrailCoinReward,
  calculateSessionReward,
  createExpeditionProfile,
  getLevelProgress,
  parseExpeditionProfile,
  sanitizeProfileIdentity,
} from "@/lib/gamification/progression";

describe("expedition progression", () => {
  it("calculates focus, checkpoint, and summit XP", () => {
    expect(calculateSessionReward(25 * 60_000, 2)).toEqual({
      focusXp: 250,
      checkpointXp: 50,
      summitXp: 50,
      totalXp: 350,
      trailCoins: 50,
    });
  });

  it("awards a completed session exactly once", () => {
    const initial = createExpeditionProfile();
    const first = awardCompletedSession(initial, "session-1", 5 * 60_000, 2);
    const duplicate = awardCompletedSession(
      first.profile,
      "session-1",
      5 * 60_000,
      2,
    );

    expect(first.reward?.totalXp).toBe(150);
    expect(first.reward?.trailCoins).toBe(10);
    expect(first.profile.trailCoins).toBe(10);
    expect(first.profile.completedSummits).toBe(1);
    expect(duplicate.reward).toBeNull();
    expect(duplicate.profile).toBe(first.profile);
  });

  it("calculates Trail Coins from completed focus minutes only", () => {
    expect(calculateTrailCoinReward(5 * 60_000 + 59_999)).toBe(10);
    expect(calculateTrailCoinReward(-1)).toBe(0);
  });

  it("derives level progress from total XP", () => {
    expect(getLevelProgress(750)).toEqual({
      level: 2,
      currentLevelXp: 250,
      nextLevelXp: 500,
      progress: 0.5,
    });
  });

  it("rejects malformed local progression data", () => {
    expect(parseExpeditionProfile("not-json")).toBeNull();
  });

  it("adds defaults when recovering an existing local profile", () => {
    const profile = parseExpeditionProfile(
      JSON.stringify({
        version: 1,
        xp: 0,
        totalFocusMinutes: 0,
        completedSummits: 0,
        focusChain: 0,
        completedSessionIds: [],
      }),
    );

    expect(profile).toMatchObject({
      displayName: "Trailblazer",
      avatarUrl: null,
      onboardingComplete: false,
    });
  });

  it("normalizes local profile identity", () => {
    expect(sanitizeProfileIdentity("  Mara  ", null)).toEqual({
      displayName: "Mara",
      avatarUrl: null,
      onboardingComplete: true,
    });
  });
});
