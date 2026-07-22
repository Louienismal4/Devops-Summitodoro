import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateSessionReward } from "@/lib/gamification/progression";
import type { CompletedSessionReward } from "@/types/gamification";
import type { MountainDifficulty } from "@/types/mountain";

type ClaimResponse = {
  awarded: boolean;
  focus_xp: number;
  checkpoint_xp: number;
  summit_xp: number;
  total_xp: number;
  trail_coins: number;
  balance_after: number;
};

export type CompletedFocusSessionClaim = {
  sessionId: string;
  durationMs: number;
  reachedCheckpointCount: number;
  difficulty: MountainDifficulty;
};

export const claimCompletedFocusSessionReward = async (
  client: SupabaseClient,
  claim: CompletedFocusSessionClaim,
): Promise<CompletedSessionReward> => {
  const { data, error } = await client.rpc("claim_completed_focus_session", {
    p_session_id: claim.sessionId,
    p_duration_minutes: Math.floor(claim.durationMs / 60_000),
    p_checkpoint_count: claim.reachedCheckpointCount,
    p_difficulty: claim.difficulty,
  });

  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  if (!result)
    throw new Error("The completed-session reward was not returned.");

  const response = result as ClaimResponse;
  return {
    ...calculateSessionReward(
      claim.durationMs,
      claim.reachedCheckpointCount,
      claim.difficulty,
    ),
    awarded: response.awarded,
    focusXp: response.focus_xp,
    checkpointXp: response.checkpoint_xp,
    summitXp: response.summit_xp,
    totalXp: response.total_xp,
    trailCoins: response.trail_coins,
    balanceAfter: response.balance_after,
  };
};
