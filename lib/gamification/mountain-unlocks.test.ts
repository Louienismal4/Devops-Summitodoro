import { describe, expect, it, vi } from "vitest";

import {
  getMountainUnlockEligibility,
  unlockMountain,
} from "@/lib/gamification/mountain-unlocks";

describe("mountain unlock eligibility", () => {
  const requirements = {
    requiredLevel: 3,
    unlockCost: 500,
    isDefaultUnlocked: false,
  };

  it("explains whether a mountain is level-locked, currency-locked, or ready", () => {
    expect(getMountainUnlockEligibility(2, 999, requirements)).toBe(
      "locked_by_level",
    );
    expect(getMountainUnlockEligibility(3, 499, requirements)).toBe(
      "locked_by_currency",
    );
    expect(getMountainUnlockEligibility(3, 500, requirements)).toBe(
      "ready_to_unlock",
    );
  });

  it("treats default and previously unlocked mountains as unlocked", () => {
    expect(
      getMountainUnlockEligibility(1, 0, {
        ...requirements,
        isDefaultUnlocked: true,
      }),
    ).toBe("unlocked");
    expect(getMountainUnlockEligibility(1, 0, requirements, true)).toBe(
      "unlocked",
    );
  });
});

describe("mountain unlock integration", () => {
  it("maps the atomic RPC result, including an idempotent repeat", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          mountain_id: "mt-ulap",
          unlocked: true,
          already_unlocked: true,
          spent: 0,
          remaining_trail_coins: 250,
        },
      ],
      error: null,
    });

    await expect(unlockMountain({ rpc } as never, "mt-ulap")).resolves.toEqual({
      mountainId: "mt-ulap",
      unlocked: true,
      alreadyUnlocked: true,
      spent: 0,
      remainingTrailCoins: 250,
    });
    expect(rpc).toHaveBeenCalledWith("unlock_mountain", {
      p_mountain_id: "mt-ulap",
    });
  });
});
