import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about the Summitodoro virtual focus expedition.",
};

export default function AboutPage() {
  return (
    <main className="info-page">
      <header className="info-header">
        <Link href="/" className="info-brand" aria-label="Summitodoro home">
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
          <Link href="/">Expedition</Link>
          <Link href="/changelog">Changelog</Link>
        </nav>
      </header>

      <section className="info-hero">
        <span className="section-kicker">About Summitodoro</span>
        <h1>Focus is an expedition.</h1>
        <p>
          Summitodoro turns a focused work session into a virtual mountain
          ascent. Your hiker advances as your work time progresses, with
          checkpoint breaks along the way.
        </p>
      </section>

      <section className="info-grid" aria-label="How Summitodoro works">
        <article>
          <span>01</span>
          <h2>Choose a route</h2>
          <p>
            Pick a Philippine mountain route and a focus duration that matches
            the task in front of you.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Keep moving</h2>
          <p>
            The route progresses with your work timer. Checkpoints introduce
            short, automatic recovery breaks before the next push.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Build your profile</h2>
          <p>
            Sign in with Google through Supabase, name your hiker, and use your
            Google photo as the hiker marker.
          </p>
        </article>
      </section>

      <section className="info-note">
        <h2>A productivity map, not a hiking guide</h2>
        <p>
          Summitodoro routes are simplified OpenStreetMap-derived snapshots for
          a virtual focus experience. They are not real-time navigation,
          trail-access guidance, or safety advice.
        </p>
      </section>
    </main>
  );
}
