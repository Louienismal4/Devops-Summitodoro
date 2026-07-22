import { describe, expect, it } from "vitest";

import { getTrailNavigationBounds } from "@/lib/map/trail-bounds";

describe("trail navigation bounds", () => {
  it("keeps local navigation around the full trail with a proportional buffer", () => {
    const [west, south, east, north] = getTrailNavigationBounds([
      [120, 16],
      [120.02, 16.01],
    ]);

    expect(west).toBeCloseTo(119.968, 6);
    expect(south).toBeCloseTo(15.968, 6);
    expect(east).toBeCloseTo(120.052, 6);
    expect(north).toBeCloseTo(16.042, 6);
  });

  it("provides a usable local area for nearly straight north-south trails", () => {
    const [west, south, east, north] = getTrailNavigationBounds([
      [120, 16],
      [120, 16.02],
    ]);

    expect(east - west).toBeCloseTo(0.064, 6);
    expect(south).toBeLessThan(16);
    expect(north).toBeGreaterThan(16.02);
  });
});
