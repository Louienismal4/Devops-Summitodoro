import { along, length, lineString } from "@turf/turf";
import { z } from "zod";

import type { Coordinate, PreparedTrail, TrailFeature } from "@/types/trail";

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

const trailFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    schemaVersion: z.number().int().positive(),
  }),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(coordinateSchema).min(2),
  }),
});

const clampProgress = (progress: number) => Math.min(Math.max(progress, 0), 1);

export const validateTrailFeature = (input: unknown): TrailFeature =>
  trailFeatureSchema.parse(input) as TrailFeature;

export const prepareTrail = (
  feature: TrailFeature,
  sampleCount = 500,
): PreparedTrail => {
  const safeSampleCount = Math.max(2, Math.floor(sampleCount));
  const route = lineString(feature.geometry.coordinates);
  const totalDistanceKm = length(route, { units: "kilometers" });

  if (!Number.isFinite(totalDistanceKm) || totalDistanceKm <= 0) {
    throw new Error("Trail geometry must have a measurable length.");
  }

  const samples = Array.from({ length: safeSampleCount }, (_, index) => {
    const distance = totalDistanceKm * (index / (safeSampleCount - 1));
    return along(route, distance, { units: "kilometers" }).geometry
      .coordinates as Coordinate;
  });

  return { feature, totalDistanceKm, samples };
};

export const getCoordinateAtProgress = (
  trail: PreparedTrail,
  progress: number,
): Coordinate => {
  const samplePosition = clampProgress(progress) * (trail.samples.length - 1);
  const lowerIndex = Math.floor(samplePosition);
  const upperIndex = Math.min(lowerIndex + 1, trail.samples.length - 1);
  const fraction = samplePosition - lowerIndex;
  const lower = trail.samples[lowerIndex];
  const upper = trail.samples[upperIndex];

  return [
    lower[0] + (upper[0] - lower[0]) * fraction,
    lower[1] + (upper[1] - lower[1]) * fraction,
  ];
};
