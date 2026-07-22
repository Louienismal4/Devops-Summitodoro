"use client";

import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppTour } from "@/components/onboarding/app-tour";
import { TaskPanel } from "@/components/tasks/task-panel";
import { TimerPanel } from "@/components/timer/timer-panel";
import type { MountainUnlockEligibility } from "@/lib/gamification/mountain-unlocks";
import type { LevelProgress, ExpeditionProfile } from "@/types/gamification";
import type { SessionStatus } from "@/types/session";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/task";

type MountainOption = {
  slug: string;
  name: string;
  region: string;
  province: string;
  difficulty: string;
  elevationMasl: number;
  imagePath: string;
  requiredLevel: number;
  unlockCost: number;
  eligibility: MountainUnlockEligibility;
};

type ExpeditionSidebarProps = {
  mountainSlug: string;
  mountainOptions: readonly MountainOption[];
  status: SessionStatus;
  durationMs: number;
  remainingMs: number;
  isOnBreak: boolean;
  shortBreakRemainingMs: number;
  progress: number;
  hydrated: boolean;
  projectedXp: number;
  projectedTrailCoins: number;
  mountainLocked: boolean;
  profile: ExpeditionProfile;
  level: LevelProgress;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onDurationChange: (durationMs: number) => void;
  onEditProfile: () => void;
  onRequestUnlock: (mountain: MountainOption) => void;
  tasks: readonly Task[];
  onCreateTask: (input: CreateTaskInput) => Task;
  onUpdateTask: (taskId: string, input: UpdateTaskInput) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (taskIds: readonly string[]) => void;
};

type YouTubeStreamOption = {
  id: string;
  label: string;
  description: string;
};

const defaultYouTubeStreamOptions: readonly YouTubeStreamOption[] = [
  {
    id: "5qap5aO4i9A",
    label: "Lo-fi study",
    description: "Beats to relax/study",
  },
  {
    id: "DWcJFNfaw9c",
    label: "Chill beats",
    description: "Beats to sleep/chill",
  },
  {
    id: "lTRiuFIWV54",
    label: "1 A.M study",
    description: "Late-night focus mix",
  },
  {
    id: "hHW1oY26kxQ",
    label: "Focus radio",
    description: "Relax/study stream",
  },
  {
    id: "rUxyKA_-grg",
    label: "Sleep radio",
    description: "Sleep/chill stream",
  },
];

function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function ExpeditionSidebar({
  mountainSlug,
  mountainOptions,
  status,
  durationMs,
  remainingMs,
  isOnBreak,
  shortBreakRemainingMs,
  progress,
  hydrated,
  projectedXp,
  projectedTrailCoins,
  mountainLocked,
  profile,
  level,
  onStart,
  onPause,
  onResume,
  onReset,
  onDurationChange,
  onEditProfile,
  onRequestUnlock,
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}: ExpeditionSidebarProps) {
  const router = useRouter();
  const [isMountainMenuOpen, setIsMountainMenuOpen] = useState(false);
  const mountainSelectorRef = useRef<HTMLElement>(null);
  const mountainMenuRef = useRef<HTMLDivElement>(null);
  const youtubeStreamOptions = defaultYouTubeStreamOptions;
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const streamOption = youtubeStreamOptions[selectedStreamIndex];
  const active = status === "running" || status === "paused";
  const musicEmbedUrl = streamOption?.id
    ? getYouTubeEmbedUrl(streamOption.id)
    : null;
  const selectedMountain = mountainOptions.find(
    (mountain) => mountain.slug === mountainSlug,
  );
  useEffect(() => {
    if (!isMountainMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!mountainSelectorRef.current?.contains(event.target as Node)) {
        setIsMountainMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isMountainMenuOpen]);
  useLayoutEffect(() => {
    if (
      !isMountainMenuOpen ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const context = gsap.context(() => {
      gsap.fromTo(
        mountainMenuRef.current,
        { opacity: 0, y: -8, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          ease: "power2.out",
        },
      );
    }, mountainSelectorRef);
    return () => context.revert();
  }, [isMountainMenuOpen]);
  return (
    <aside className="expedition-sidebar" aria-label="Expedition dashboard">
      <div className="bottom-sheet-handle" aria-hidden="true" />
      <div className="sidebar-scroll">
        <header className="dashboard-header">
          <Link
            href="/hike"
            className="dashboard-brand"
            aria-label="Summitodoro dashboard"
          >
            <Image
              className="dashboard-brand-logo"
              src="/summitodoro-logo.svg"
              alt=""
              width={1200}
              height={700}
              priority
            />
          </Link>
        </header>

        <section
          ref={mountainSelectorRef}
          className="hud-card mountain-selector-card"
          data-tour="mountain-selector"
        >
          <div className="hud-card-heading">
            <span>△</span>
            <strong>Mountain selector</strong>
            <small>{mountainOptions.length} available</small>
          </div>
          {selectedMountain && (
            <>
              <button
                type="button"
                className={
                  isMountainMenuOpen
                    ? "mountain-picker-trigger is-open"
                    : "mountain-picker-trigger"
                }
                aria-haspopup="listbox"
                aria-expanded={isMountainMenuOpen}
                disabled={active}
                onClick={() => setIsMountainMenuOpen((open) => !open)}
              >
                <span className="mountain-picker-card-wrap">
                  <MountainOptionCard mountain={selectedMountain} />
                  <span
                    className={[
                      "mountain-picker-chevron",
                      isMountainMenuOpen && "is-open",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  />
                </span>
              </button>
              {isMountainMenuOpen && (
                <div
                  ref={mountainMenuRef}
                  className="mountain-picker-menu"
                  role="listbox"
                >
                  {mountainOptions.map((mountain) => (
                    <button
                      key={mountain.slug}
                      type="button"
                      role="option"
                      aria-selected={mountain.slug === mountainSlug}
                      className={
                        mountain.slug === mountainSlug
                          ? "mountain-picker-option selected"
                          : "mountain-picker-option"
                      }
                      aria-label={`${mountain.name}, ${getMountainStatusLabel(mountain)}`}
                      onClick={() => {
                        setIsMountainMenuOpen(false);
                        if (
                          mountain.eligibility === "unlocked" &&
                          mountain.slug !== mountainSlug
                        ) {
                          router.push(`/hike/${mountain.slug}`);
                        } else if (mountain.eligibility !== "unlocked") {
                          onRequestUnlock(mountain);
                        }
                      }}
                    >
                      <MountainOptionCard mountain={mountain} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="hud-card expedition-summary">
          <div className="hud-card-heading">
            <span>♜</span>
            <strong>Expedition summary</strong>
          </div>
          <div className="summary-grid">
            <div>
              <span>◷</span>
              <small>Focus time</small>
              <strong>{profile.totalFocusMinutes}m</strong>
            </div>
            <div>
              <span>⚑</span>
              <small>Summits</small>
              <strong>{profile.completedSummits}</strong>
            </div>
            <div>
              <span>⌁</span>
              <small>Focus chain</small>
              <strong>{profile.focusChain}</strong>
            </div>
          </div>
          <div className="mission-reward-row">
            <span>Mission reward</span>
            <strong>
              +{projectedXp} XP · +{projectedTrailCoins} Trail Coins
            </strong>
          </div>
        </section>

        <TaskPanel
          tasks={tasks}
          onCreate={onCreateTask}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onReorder={onReorderTasks}
        />

        <TimerPanel
          status={status}
          durationMs={durationMs}
          remainingMs={remainingMs}
          isOnBreak={isOnBreak}
          shortBreakRemainingMs={shortBreakRemainingMs}
          progress={progress}
          hydrated={hydrated}
          locked={mountainLocked}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onReset={onReset}
          onDurationChange={onDurationChange}
        />

        <section className="hud-card music-panel" data-tour="music-player">
          <div className="hud-card-heading">
            <span>♫</span>
            <strong>Trail Music</strong>
          </div>
          {musicEmbedUrl ? (
            <iframe
              className="music-player"
              src={musicEmbedUrl}
              title="YouTube stream player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="music-player music-player-empty">
              <span>Set a YouTube video or live stream URL to play here.</span>
            </div>
          )}
          <div
            className="stream-controls"
            aria-label="Background sound controls"
          >
            <button
              type="button"
              className="stream-control"
              aria-label="Previous background sound"
              onClick={() =>
                setSelectedStreamIndex(
                  (index) =>
                    (index - 1 + youtubeStreamOptions.length) %
                    youtubeStreamOptions.length,
                )
              }
            >
              ‹ Previous
            </button>
            <button
              type="button"
              className="stream-control"
              aria-label="Next background sound"
              onClick={() =>
                setSelectedStreamIndex(
                  (index) => (index + 1) % youtubeStreamOptions.length,
                )
              }
            >
              Next ›
            </button>
          </div>
        </section>

        <AppTour enabled={profile.onboardingComplete} />
      </div>

      <section className="hiker-profile">
        <button
          type="button"
          className={profile.avatarUrl ? "avatar has-photo" : "avatar"}
          aria-label="Edit hiker profile"
          onClick={onEditProfile}
          style={
            profile.avatarUrl
              ? { backgroundImage: `url("${profile.avatarUrl}")` }
              : undefined
          }
        >
          <span>◕‿◕</span>
        </button>
        <div className="hiker-profile-details">
          <small>Hiker profile</small>
          <div className="profile-name-row">
            <strong>{profile.displayName}</strong>
            <div
              className="trail-coin-balance profile-trail-coin-balance"
              aria-label={`${profile.trailCoins} Trail Coins`}
            >
              <span aria-hidden="true">◆</span>
              <strong>{profile.trailCoins.toLocaleString()}</strong>
            </div>
          </div>
          <span>
            Level {level.level} · {profile.xp} XP
          </span>
        </div>
        <div className={active ? "profile-status active" : "profile-status"}>
          {active ? "ON TRAIL" : "AT CAMP"}
        </div>
        <div className="profile-xp-progress">
          <div>
            <small>Next rank</small>
            <span>
              {level.currentLevelXp} / {level.nextLevelXp} XP
            </span>
          </div>
          <div
            className="segmented-progress"
            aria-label={`${Math.round(level.progress * 100)} percent to next level`}
          >
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={
                  index < Math.ceil(level.progress * 10) ? "filled" : ""
                }
              />
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}

function MountainOptionCard({ mountain }: { mountain: MountainOption }) {
  return (
    <span
      className={
        mountain.eligibility === "unlocked"
          ? "mountain-option-card"
          : "mountain-option-card locked"
      }
    >
      <span className="mountain-option-image" aria-hidden="true">
        <Image
          src={mountain.imagePath}
          alt=""
          width={104}
          height={84}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </span>
      <span className="mountain-option-copy">
        <strong>{mountain.name}</strong>
        <small>
          {mountain.province} · {mountain.region}
        </small>
        <em>{mountain.elevationMasl.toLocaleString()} MASL</em>
        <i>{getMountainStatusLabel(mountain)}</i>
      </span>
      <b className={`difficulty-${mountain.difficulty}`}>
        {mountain.difficulty}
      </b>
      {mountain.eligibility !== "unlocked" && (
        <span className="mountain-lock-badge" aria-hidden="true">
          🔒
        </span>
      )}
    </span>
  );
}

function getMountainStatusLabel(mountain: MountainOption) {
  if (mountain.eligibility === "unlocked") return "Unlocked";
  if (mountain.eligibility === "locked_by_level")
    return `Level ${mountain.requiredLevel} required`;
  if (mountain.eligibility === "locked_by_currency")
    return `${mountain.unlockCost} Trail Coins required`;
  return `Unlock for ${mountain.unlockCost} Trail Coins`;
}
