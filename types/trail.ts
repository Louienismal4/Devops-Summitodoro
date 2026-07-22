export type Coordinate = [longitude: number, latitude: number];

export type TrailCheckpoint = {
  id: string;
  name: string;
  description: string;
  progress: number;
};

export type TrailSource = {
  provider: string;
  license: string;
  attribution: string;
  reference: string;
  retrievedAt: string;
};

export type TrailFeature = GeoJSON.Feature<
  GeoJSON.LineString,
  {
    id: string;
    name: string;
    schemaVersion: number;
  }
>;

export type PreparedTrail = {
  feature: TrailFeature;
  totalDistanceKm: number;
  samples: Coordinate[];
};
