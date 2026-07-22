import { describe, expect, it } from "vitest";

import { getNewlyReachedCheckpoints } from "@/lib/trail/checkpoints";
import type { TrailCheckpoint } from "@/types/trail";

const checkpoints: TrailCheckpoint[] = [
  { id: "ridge", name: "Ridge", description: "First", progress: 0.35 },
  { id: "view", name: "View", description: "Second", progress: 0.7 },
];

describe("checkpoint crossing", () => {
  it("returns every checkpoint crossed during a large clock jump", () => {
    expect(getNewlyReachedCheckpoints(checkpoints, 0.2, 0.8, [])).toEqual(
      checkpoints,
    );
  });

  it("does not return a checkpoint that was already recorded", () => {
    expect(
      getNewlyReachedCheckpoints(checkpoints, 0.2, 0.8, ["ridge"]).map(
        ({ id }) => id,
      ),
    ).toEqual(["view"]);
  });

  it("does not trigger when progress moves backward or stays still", () => {
    expect(getNewlyReachedCheckpoints(checkpoints, 0.8, 0.7, [])).toEqual([]);
    expect(getNewlyReachedCheckpoints(checkpoints, 0.7, 0.7, [])).toEqual([]);
  });
});
