import type { Mountain } from "@/types/mountain";

export const mountains = [
  {
    id: "mt-ulap",
    slug: "mt-ulap",
    name: "Mt. Ulap",
    region: "Cordillera Administrative Region",
    province: "Benguet",
    elevationMasl: 1846,
    imagePath: "/images/mountains/mt-ulap.jpg",
    tagline: "Find your rhythm above the clouds.",
    description:
      "A virtual focus ascent along the mapped Philex Ridge Trail on Mt. Ulap. This route snapshot is not a hiking guide.",
    difficulty: "moderate",
    defaultDurationMinutes: 30,
    requiredLevel: 3,
    unlockCost: 500,
    isDefaultUnlocked: false,
    trailName: "Philex Ridge Trail",
    trailAssetUrl: "/data/trails/mt-ulap-osm-v1.geojson",
    trailVersion: 2,
    checkpoints: [
      {
        id: "pine-ridge",
        name: "Pine Ridge",
        description:
          "The canopy opens and your first focused stretch is behind you.",
        progress: 0.35,
      },
      {
        id: "grassland-view",
        name: "Grassland View",
        description:
          "The summit is in sight. Hold your pace through the final stretch.",
        progress: 0.7,
      },
    ],
    source: {
      provider: "OpenStreetMap contributors",
      license: "Open Database License (ODbL) 1.0",
      attribution:
        "Route geometry and basemap data © OpenStreetMap contributors, ODbL 1.0",
      reference:
        "Philex Ridge Trail, OpenStreetMap ways 366755651 and 760182514; simplified local snapshot",
      retrievedAt: "2026-07-11",
    },
    mapCenter: [120.6302, 16.2915],
  },
  {
    id: "mt-pulag",
    slug: "mt-pulag",
    name: "Mt. Pulag",
    region: "Cordillera Administrative Region",
    province: "Benguet",
    elevationMasl: 2926,
    imagePath: "/images/mountains/mt-pulag.jpg",
    tagline: "Focus steadily above the cloudline.",
    description:
      "A virtual focus ascent along the mapped Ambangeg Trail to Mt. Pulag. This route snapshot is not a hiking guide.",
    difficulty: "hard",
    defaultDurationMinutes: 30,
    requiredLevel: 5,
    unlockCost: 1200,
    isDefaultUnlocked: false,
    trailName: "Ambangeg Trail",
    trailAssetUrl: "/data/trails/mt-pulag-osm-v1.geojson",
    trailVersion: 2,
    checkpoints: [
      {
        id: "mossy-forest",
        name: "Mossy Forest",
        description:
          "Your first focus block is secure. Keep a calm, deliberate pace.",
        progress: 0.35,
      },
      {
        id: "grassland-ridge",
        name: "Grassland Ridge",
        description:
          "You have cleared the cloudline. Carry the final block to the summit.",
        progress: 0.7,
      },
    ],
    source: {
      provider: "OpenStreetMap contributors",
      license: "Open Database License (ODbL) 1.0",
      attribution:
        "Route geometry and basemap data © OpenStreetMap contributors, ODbL 1.0",
      reference:
        "Ambangeg Trail and Pulag Camp 2 to Summit, OpenStreetMap ways 712312668, 70084439, 28489052, and 28489053; simplified local snapshot",
      retrievedAt: "2026-07-11",
    },
    mapCenter: [120.8988, 16.5862],
    // Roughly a 10 km × 10 km local area around Pulag — comparable to the
    // usable map extent of Baguio, without allowing global map navigation.
    mapNavigationBounds: [120.8519, 16.5413, 120.9457, 16.6311],
  },
  {
    id: "mt-pinatubo",
    slug: "mt-pinatubo",
    name: "Mt. Pinatubo",
    region: "Central Luzon",
    province: "Zambales",
    elevationMasl: 1486,
    imagePath: "/images/mountains/mt-pinatubo.jpg",
    tagline: "Cross the quiet lahar landscape, one task at a time.",
    description:
      "A virtual focus ascent along the mapped route to the Mt. Pinatubo crater. This route snapshot is not a hiking guide.",
    difficulty: "moderate",
    defaultDurationMinutes: 30,
    requiredLevel: 1,
    unlockCost: 0,
    isDefaultUnlocked: true,
    trailName: "Route to Mount Pinatubo Crater",
    trailAssetUrl: "/data/trails/mt-pinatubo-osm-v1.geojson",
    trailVersion: 2,
    checkpoints: [
      {
        id: "lahar-canyon",
        name: "Lahar Canyon",
        description:
          "The first focused stretch is complete. Keep distractions behind you.",
        progress: 0.35,
      },
      {
        id: "crater-rim",
        name: "Crater Rim",
        description:
          "The objective is in view. Finish the final uninterrupted block.",
        progress: 0.7,
      },
    ],
    source: {
      provider: "OpenStreetMap contributors",
      license: "Open Database License (ODbL) 1.0",
      attribution:
        "Route geometry and basemap data © OpenStreetMap contributors, ODbL 1.0",
      reference:
        "Route to Mount Pinatubo Crater, OpenStreetMap ways 1026595907, 916178366, and 475658175; simplified local snapshot",
      retrievedAt: "2026-07-11",
    },
    mapCenter: [120.3495, 15.1615],
  },
] as const satisfies readonly Mountain[];

export const getMountain = (slug: string): Mountain | undefined =>
  mountains.find((mountain) => mountain.slug === slug);
