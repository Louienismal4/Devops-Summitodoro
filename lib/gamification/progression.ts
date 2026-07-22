import { z } from "zod";

import type {
  ExpeditionProfile,
  LevelProgress,
  SessionReward,
} from "@/types/gamification";
import type { MountainDifficulty } from "@/types/mountain";

const XP_PER_LEVEL = 500;

const profileNameSchema = z.string().trim().min(1).max(40);

export const expeditionProfileSchema = z.object({
  version: z.literal(1),
  displayName: profileNameSchema.default("Trailblazer"),
  avatarUrl: z.string().url().nullable().default(null),
  onboardingComplete: z.boolean().default(false),
  xp: z.number().int().nonnegative(),
  totalFocusMinutes: z.number().int().nonnegative(),
  completedSummits: z.number().int().nonnegative(),
  focusChain: z.number().int().nonnegative(),
  completedSessionIds: z.array(z.string()),
  trailCoins: z.number().int().nonnegative().default(0),
  lifetimeTrailCoinsEarned: z.number().int().nonnegative().default(0),
  lifetimeTrailCoinsSpent: z.number().int().nonnegative().default(0),
});

export const createExpeditionProfile = (): ExpeditionProfile => ({
  version: 1,
  displayName: "Trailblazer",
  avatarUrl: null,
  onboardingComplete: false,
  xp: 0,
  totalFocusMinutes: 0,
  completedSummits: 0,
  focusChain: 0,
  completedSessionIds: [],
  trailCoins: 0,
  lifetimeTrailCoinsEarned: 0,
  lifetimeTrailCoinsSpent: 0,
});

export const calculateTrailCoinReward = (durationMs: number): number =>
  Math.max(0, Math.floor(durationMs / 60_000)) * 2;

export const calculateSessionReward = (
  durationMs: number,
  reachedCheckpointCount: number,
  difficulty: MountainDifficulty = "moderate",
): SessionReward => {
  const difficultyMultiplier = { easy: 0.8, moderate: 1, hard: 1.4 }[
    difficulty
  ];
  const focusXp = Math.floor(durationMs / 60_000) * 10 * difficultyMultiplier;
  const checkpointXp =
    Math.max(0, reachedCheckpointCount) * 25 * difficultyMultiplier;
  const summitXp = 50 * difficultyMultiplier;
  return {
    focusXp,
    checkpointXp,
    summitXp,
    totalXp: Math.round(focusXp + checkpointXp + summitXp),
    trailCoins: calculateTrailCoinReward(durationMs),
  };
};

export const getLevelProgress = (xp: number): LevelProgress => {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = safeXp % XP_PER_LEVEL;

  return {
    level,
    currentLevelXp,
    nextLevelXp: XP_PER_LEVEL,
    progress: currentLevelXp / XP_PER_LEVEL,
  };
};

export const awardCompletedSession = (
  profile: ExpeditionProfile,
  sessionId: string,
  durationMs: number,
  reachedCheckpointCount: number,
  difficulty: MountainDifficulty = "moderate",
): { profile: ExpeditionProfile; reward: SessionReward | null } => {
  if (profile.completedSessionIds.includes(sessionId)) {
    return { profile, reward: null };
  }

  const reward = calculateSessionReward(
    durationMs,
    reachedCheckpointCount,
    difficulty,
  );
  return {
    reward,
    profile: {
      ...profile,
      xp: profile.xp + reward.totalXp,
      totalFocusMinutes:
        profile.totalFocusMinutes + Math.floor(durationMs / 60_000),
      completedSummits: profile.completedSummits + 1,
      focusChain: profile.focusChain + 1,
      trailCoins: profile.trailCoins + reward.trailCoins,
      lifetimeTrailCoinsEarned:
        profile.lifetimeTrailCoinsEarned + reward.trailCoins,
      completedSessionIds: [
        ...profile.completedSessionIds.slice(-99),
        sessionId,
      ],
    },
  };
};

export const parseExpeditionProfile = (
  value: string,
): ExpeditionProfile | null => {
  try {
    return expeditionProfileSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
};

export const sanitizeProfileIdentity = (
  displayName: string,
  avatarUrl: string | null,
): Pick<
  ExpeditionProfile,
  "displayName" | "avatarUrl" | "onboardingComplete"
> => {
  const name = profileNameSchema.safeParse(displayName);
  const avatar =
    avatarUrl === null ? null : z.string().url().safeParse(avatarUrl);

  return {
    displayName: name.success ? name.data : "Trailblazer",
    avatarUrl: avatar && avatar.success ? avatar.data : null,
    onboardingComplete: true,
  };
};
