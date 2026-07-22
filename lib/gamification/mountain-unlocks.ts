import type { SupabaseClient } from "@supabase/supabase-js";

export type MountainUnlockEligibility =
  "unlocked" | "locked_by_level" | "locked_by_currency" | "ready_to_unlock";

export type MountainUnlockRequirements = {
  requiredLevel: number;
  unlockCost: number;
  isDefaultUnlocked: boolean;
};

export const getMountainUnlockEligibility = (
  currentLevel: number,
  trailCoins: number,
  requirements: MountainUnlockRequirements,
  isUnlocked = false,
): MountainUnlockEligibility => {
  if (isUnlocked || requirements.isDefaultUnlocked) return "unlocked";
  if (currentLevel < requirements.requiredLevel) return "locked_by_level";
  if (trailCoins < requirements.unlockCost) return "locked_by_currency";
  return "ready_to_unlock";
};

type UnlockResponse = {
  mountain_id: string;
  unlocked: boolean;
  already_unlocked: boolean;
  spent: number;
  remaining_trail_coins: number;
};

export type MountainUnlockResult = {
  mountainId: string;
  unlocked: boolean;
  alreadyUnlocked: boolean;
  spent: number;
  remainingTrailCoins: number;
};

export const unlockMountain = async (
  client: SupabaseClient,
  mountainId: string,
): Promise<MountainUnlockResult> => {
  const { data, error } = await client.rpc("unlock_mountain", {
    p_mountain_id: mountainId,
  });
  if (error) throw error;
  const result = (Array.isArray(data) ? data[0] : data) as
    UnlockResponse | undefined;
  if (!result) throw new Error("The mountain unlock result was not returned.");

  return {
    mountainId: result.mountain_id,
    unlocked: result.unlocked,
    alreadyUnlocked: result.already_unlocked,
    spent: result.spent,
    remainingTrailCoins: result.remaining_trail_coins,
  };
};
