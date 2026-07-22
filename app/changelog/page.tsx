import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Product updates for Summitodoro.",
};

const releases = [
  {
    version: "Current · 1.1.0",
    date: "July 2026",
    title: "Task-focused expeditions",
    categories: {
      added: [
        "Task planning with optional descriptions, task selection before an expedition, focus totals, completed-session counts, and contributing-climb history.",
        "Task history retention: completed and archived tasks remain visible for the current day, with 30-day backend cleanup during authenticated sync.",
        "Drag handles for prioritizing active tasks, with saved task ordering for signed-in hikers.",
        "Task view, edit, archive, restore, and delete-confirmation flows using themed shadcn controls.",
      ],
      changed: [
        "Refined the focus-task dashboard with compact history controls, an ellipsis action menu, and resilient long-text handling.",
        "Successful mountain unlocks now celebrate with a reduced-motion-safe confetti burst.",
      ],
      fixed: [
        "Prevented long task titles, descriptions, and climb labels from stretching the expedition sidebar or task-view dialog.",
      ],
    },
  },
  {
    version: "1.0.0",
    date: "July 2026",
    title: "Expedition dashboard refinements",
    categories: {
      added: [
        "Trail Coin progression with server-authoritative session rewards, a transaction ledger, and permanent mountain unlocks.",
        "Mountain level and Trail Coin requirements, locked-route explanations, unlock confirmation, and immediate balance updates.",
        "Animated mountain selector and unlock feedback that respect reduced-motion preferences.",
        "Supabase Google sign-in and saved hiker names.",
        "Saved signed-in hikers' expedition summary, XP, focus time, summits, and focus chain to Supabase.",
        "A guided first-use tour for the primary /hike expedition route.",
        "Selectable YouTube background streams in the mountain selector.",
        "A logout action that clears local expedition data and returns to the sign-in screen.",
      ],
      changed: [
        "Made Mt. Pinatubo the default unlocked expedition and kept locked mountains unavailable until their requirements are met.",
        "Moved Trail Coins beside the hiker name, enlarged dashboard and route-objective text, and clarified locked selector cards.",
        "Restricted map navigation to each mountain's local area, including a Baguio-scale map extent for Mt. Pulag, to reduce unnecessary map requests.",
        "Google profile photos can appear as the moving hiker on the map.",
        "Standardized focus and checkpoint timers to HH:MM:SS.",
        "Refined the image-rich mountain selector.",
        "Kept the hiker profile available on mobile, centered the hiker above the mobile sheet, and introduced a compact landscape layout.",
      ],
      fixed: [
        "Pulag's fitted map view now keeps the summit marker anchored to the trail while zooming.",
      ],
    },
  },
  {
    version: "0.2.0",
    date: "July 2026",
    title: "Mapped focus routes",
    categories: {
      added: [
        "Mt. Ulap, Mt. Pulag, and Mt. Pinatubo route snapshots.",
        "Checkpoint breaks and longer focus-duration presets.",
      ],
      changed: ["Migrated the interactive map to MapLibre and OpenFreeMap."],
      fixed: [],
    },
  },
  {
    version: "0.1.0",
    date: "Initial release",
    title: "The first ascent",
    categories: {
      added: [
        "The virtual Philippine mountain focus dashboard.",
        "Local timer recovery, progression XP, and a route fallback.",
      ],
      changed: [],
      fixed: [],
    },
  },
];

const categoryLabels = [
  ["added", "Added"],
  ["changed", "Changed"],
  ["fixed", "Fixed"],
] as const;

export default function ChangelogPage() {
  return (
    <main className="info-page">
      <header className="info-header">
        <Link
          href="/hike"
          className="info-brand"
          aria-label="Summitodoro expedition"
        >
          <Image
            className="info-brand-logo"
            src="/summitodoro-logo.svg"
            alt="Summitodoro"
            width={1200}
            height={700}
            priority
          />
        </Link>
        <nav aria-label="Site navigation">
          <Link href="/hike">Expedition</Link>
          <Link href="/about">About</Link>
        </nav>
      </header>

      <section className="info-hero compact">
        <span className="section-kicker">Product updates</span>
        <h1>Changelog</h1>
        <p>Follow the trail of improvements to Summitodoro.</p>
      </section>

      <section className="release-list" aria-label="Release history">
        {releases.map((release) => (
          <article key={release.version} className="release-entry">
            <div>
              <span>{release.version}</span>
              <small>{release.date}</small>
            </div>
            <div>
              <h2>{release.title}</h2>
              {categoryLabels.map(([key, label]) => {
                const changes = release.categories[key];

                if (changes.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={key}
                    className={`release-category release-category-${key}`}
                  >
                    <h3>{label}</h3>
                    <ul>
                      {changes.map((change) => (
                        <li key={change}>{change}</li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
