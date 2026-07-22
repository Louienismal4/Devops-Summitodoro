import type { Coordinate } from "@/types/trail";

export type TrailNavigationBounds = [
  west: number,
  south: number,
  east: number,
  north: number,
];

// Ensures short trails still receive a roughly Baguio-scale local map area.
const MINIMUM_SPAN_DEGREES = 0.04;
const TRAIL_BOUNDS_PADDING = 0.8;

export const getTrailNavigationBounds = (
  coordinates: readonly Coordinate[],
): TrailNavigationBounds => {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);
  const longitudePadding =
    Math.max(east - west, MINIMUM_SPAN_DEGREES) * TRAIL_BOUNDS_PADDING;
  const latitudePadding =
    Math.max(north - south, MINIMUM_SPAN_DEGREES) * TRAIL_BOUNDS_PADDING;

  return [
    west - longitudePadding,
    south - latitudePadding,
    east + longitudePadding,
    north + latitudePadding,
  ];
};
