import { describe, expect, it } from "vitest";

import {
  getCoordinateAtProgress,
  prepareTrail,
  validateTrailFeature,
} from "@/lib/trail/trail-engine";

const feature = validateTrailFeature({
  type: "Feature",
  properties: { id: "test-v1", name: "Test trail", schemaVersion: 1 },
  geometry: {
    type: "LineString",
    coordinates: [
      [120, 16],
      [120.01, 16],
      [120.01, 16.01],
    ],
  },
});

describe("trail engine", () => {
  it("validates and samples a GeoJSON LineString once", () => {
    const prepared = prepareTrail(feature, 11);
    expect(prepared.samples).toHaveLength(11);
    expect(prepared.totalDistanceKm).toBeGreaterThan(2);
  });

  it("returns exact endpoints and clamps out-of-range progress", () => {
    const prepared = prepareTrail(feature, 20);
    expect(getCoordinateAtProgress(prepared, -1)).toEqual([120, 16]);
    expect(getCoordinateAtProgress(prepared, 2)).toEqual([120.01, 16.01]);
  });

  it("interpolates to a coordinate along the sampled route", () => {
    const prepared = prepareTrail(feature, 10);
    const midpoint = getCoordinateAtProgress(prepared, 0.5);
    expect(midpoint[0]).toBeCloseTo(120.01, 3);
    expect(midpoint[1]).toBeGreaterThanOrEqual(16);
  });

  it("rejects non-LineString GeoJSON", () => {
    expect(() =>
      validateTrailFeature({ type: "Feature", properties: {}, geometry: null }),
    ).toThrow();
  });
});
