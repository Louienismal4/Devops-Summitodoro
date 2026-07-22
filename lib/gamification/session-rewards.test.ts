import { describe, expect, it, vi } from "vitest";

import { claimCompletedFocusSessionReward } from "@/lib/gamification/session-rewards";

describe("completed focus-session reward integration", () => {
  it("sends only session facts to the server and uses its authoritative balance", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          awarded: true,
          focus_xp: 250,
          checkpoint_xp: 50,
          summit_xp: 50,
          total_xp: 350,
          trail_coins: 50,
          balance_after: 50,
        },
      ],
      error: null,
    });

    const reward = await claimCompletedFocusSessionReward({ rpc } as never, {
      sessionId: "3c8ea26d-894f-45b2-829a-662bf9cc5e7e",
      durationMs: 25 * 60_000,
      reachedCheckpointCount: 2,
      difficulty: "moderate",
    });

    expect(rpc).toHaveBeenCalledWith("claim_completed_focus_session", {
      p_session_id: "3c8ea26d-894f-45b2-829a-662bf9cc5e7e",
      p_duration_minutes: 25,
      p_checkpoint_count: 2,
      p_difficulty: "moderate",
    });
    expect(reward).toMatchObject({
      awarded: true,
      trailCoins: 50,
      balanceAfter: 50,
    });
  });

  it("preserves the server's duplicate-completion response", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          awarded: false,
          focus_xp: 50,
          checkpoint_xp: 0,
          summit_xp: 50,
          total_xp: 100,
          trail_coins: 10,
          balance_after: 10,
        },
      ],
      error: null,
    });

    const reward = await claimCompletedFocusSessionReward({ rpc } as never, {
      sessionId: "3c8ea26d-894f-45b2-829a-662bf9cc5e7e",
      durationMs: 5 * 60_000,
      reachedCheckpointCount: 0,
      difficulty: "moderate",
    });

    expect(reward).toMatchObject({ awarded: false, balanceAfter: 10 });
  });
});
