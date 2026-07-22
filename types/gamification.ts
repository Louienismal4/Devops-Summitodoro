export type ExpeditionProfile = {
  version: 1;
  displayName: string;
  avatarUrl: string | null;
  onboardingComplete: boolean;
  xp: number;
  totalFocusMinutes: number;
  completedSummits: number;
  focusChain: number;
  completedSessionIds: string[];
  trailCoins: number;
  lifetimeTrailCoinsEarned: number;
  lifetimeTrailCoinsSpent: number;
};

export type SessionReward = {
  focusXp: number;
  checkpointXp: number;
  summitXp: number;
  totalXp: number;
  trailCoins: number;
};

export type CompletedSessionReward = SessionReward & {
  awarded: boolean;
  balanceAfter: number;
};

export type LevelProgress = {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
};
