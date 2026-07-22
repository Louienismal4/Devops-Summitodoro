import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMountain, mountains } from "@/data/mountains";

type PageProps = { params: Promise<{ slug: string }> };

export const generateStaticParams = () =>
  mountains.map(({ slug }) => ({ slug }));

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const mountain = getMountain((await params).slug);
  return { title: mountain?.name ?? "Mountain" };
}

export default async function MountainPage({ params }: PageProps) {
  const mountain = getMountain((await params).slug);
  if (!mountain) notFound();

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <div className="detail-landscape" aria-hidden="true">
          <div className="detail-sun" />
          <div className="detail-ridge ridge-one" />
          <div className="detail-ridge ridge-two" />
        </div>
        <div className="detail-copy">
          <Link href="/" className="back-link">
            ← All mountains
          </Link>
          <span className="section-kicker">{mountain.region} · Trail 01</span>
          <h1>{mountain.name}</h1>
          <p className="detail-tagline">{mountain.tagline}</p>
          <p>{mountain.description}</p>
          <div className="detail-stats">
            <div>
              <strong>{mountain.defaultDurationMinutes}</strong>
              <span>Suggested minutes</span>
            </div>
            <div>
              <strong>{mountain.checkpoints.length}</strong>
              <span>Checkpoints</span>
            </div>
            <div>
              <strong>{mountain.difficulty}</strong>
              <span>Virtual difficulty</span>
            </div>
          </div>
          <Link
            className="primary-button large"
            href={`/hike/${mountain.slug}`}
          >
            Enter focus trail <span>→</span>
          </Link>
          <small className="detail-warning">
            Virtual productivity experience · Not for real-world navigation
          </small>
        </div>
      </section>
    </main>
  );
}
