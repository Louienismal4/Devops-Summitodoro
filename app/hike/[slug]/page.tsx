import { notFound } from "next/navigation";

import { HikeExperience } from "@/components/hike/hike-experience";
import { getMountain, mountains } from "@/data/mountains";

type PageProps = { params: Promise<{ slug: string }> };

export const generateStaticParams = () =>
  mountains.map(({ slug }) => ({ slug }));

export default async function HikePage({ params }: PageProps) {
  const mountain = getMountain((await params).slug);
  if (!mountain) notFound();
  return <HikeExperience key={mountain.slug} mountain={mountain} />;
}
