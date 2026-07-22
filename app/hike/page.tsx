import { HikeExperience } from "@/components/hike/hike-experience";
import { mountains } from "@/data/mountains";

export default function DefaultHikePage() {
  const defaultMountain = mountains.find(
    (mountain) => mountain.isDefaultUnlocked,
  );
  return (
    <HikeExperience
      key={defaultMountain?.slug}
      mountain={defaultMountain ?? mountains[0]}
    />
  );
}
