"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getMountainUnlockEligibility } from "@/lib/gamification/mountain-unlocks";
import { supabase } from "@/lib/supabase/client";
import type { MountainUnlockEligibility } from "@/lib/gamification/mountain-unlocks";
import type { LevelProgress } from "@/types/gamification";
import type { Mountain } from "@/types/mountain";

type UnlockResponse = {
  mountainId: string;
  unlocked: boolean;
  alreadyUnlocked: boolean;
  spent: number;
  remainingTrailCoins: number;
};

const defaultUnlockedIds = (mountains: readonly Mountain[]) =>
  mountains
    .filter((mountain) => mountain.isDefaultUnlocked)
    .map((mountain) => mountain.id);

export const useMountainUnlocks = (
  mountains: readonly Mountain[],
  level: LevelProgress,
  trailCoins: number,
) => {
  const defaults = useMemo(() => defaultUnlockedIds(mountains), [mountains]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>(defaults);
  const [hydrated, setHydrated] = useState(() => supabase === null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (!cancelled) setHydrated(true);
        return;
      }
      const { data: records } = await supabase
        .from("user_mountain_unlocks")
        .select("mountain_id")
        .eq("user_id", data.user.id);
      if (cancelled) return;
      setUnlockedIds([
        ...new Set([
          ...defaults,
          ...(records ?? []).map((record) => record.mountain_id),
        ]),
      ]);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [defaults]);

  const eligibilityFor = useCallback(
    (mountain: Mountain): MountainUnlockEligibility =>
      getMountainUnlockEligibility(
        level.level,
        trailCoins,
        mountain,
        unlockedIds.includes(mountain.id),
      ),
    [level.level, trailCoins, unlockedIds],
  );

  const unlock = useCallback(
    async (mountain: Mountain): Promise<UnlockResponse> => {
      if (!supabase) throw new Error("Sign in to unlock mountains.");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token)
        throw new Error("Sign in to unlock mountains.");

      const response = await fetch(`/api/mountains/${mountain.id}/unlock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as UnlockResponse & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Unable to unlock mountain.");

      setUnlockedIds((current) =>
        current.includes(mountain.id) ? current : [...current, mountain.id],
      );
      return payload;
    },
    [],
  );

  return {
    hydrated,
    unlockedIds,
    eligibilityFor,
    unlock,
  };
};
