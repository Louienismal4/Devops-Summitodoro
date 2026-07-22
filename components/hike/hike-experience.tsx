"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ExpeditionSidebar } from "@/components/hike/expedition-sidebar";
import { MountainMap } from "@/components/map/mountain-map";
import { ProfileOnboardingDialog } from "@/components/profile/profile-onboarding-dialog";
import { UnlockMountainDialog } from "@/components/progression/unlock-mountain-dialog";
import type {
  MapCheckpoint,
  MountainMapHandle,
} from "@/components/map/mountain-map";
import { TrailFallback } from "@/components/map/trail-fallback";
import { mountains } from "@/data/mountains";
import { useExpeditionProfile } from "@/hooks/use-expedition-profile";
import { useFocusSession } from "@/hooks/use-focus-session";
import { useMountainUnlocks } from "@/hooks/use-mountain-unlocks";
import { useTasks } from "@/hooks/use-tasks";
import { supabase } from "@/lib/supabase/client";
import { formatRemainingTime } from "@/lib/timer/format-time";
import { getTimedMilestones } from "@/lib/timer/milestones";
import {
  getCoordinateAtProgress,
  prepareTrail,
  validateTrailFeature,
} from "@/lib/trail/trail-engine";
import type { Mountain } from "@/types/mountain";
import type { PreparedTrail } from "@/types/trail";

export function HikeExperience({ mountain }: { mountain: Mountain }) {
  const [trail, setTrail] = useState<PreparedTrail | null>(null);
  const [trailError, setTrailError] = useState<string | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState<string | null>(null);
  const [showAttribution, setShowAttribution] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [unlockMountain, setUnlockMountain] = useState<Mountain | null>(null);
  const mapRef = useRef<MountainMapHandle>(null);

  useEffect(() => {
    if (!supabase || !window.location.hash) return;

    void supabase.auth.getSession().finally(() => {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`,
      );
    });
  }, []);

  const focus = useFocusSession({
    storageKey: `summitodoro:session:${mountain.slug}`,
    initialDurationMs: mountain.defaultDurationMinutes * 60_000,
    checkpoints: mountain.checkpoints,
  });
  const tasks = useTasks();
  const game = useExpeditionProfile(
    focus.session,
    focus.reachedCheckpointIds.length,
    mountain.difficulty,
  );
  const mountainUnlocks = useMountainUnlocks(
    mountains,
    game.level,
    game.profile.trailCoins,
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetch(mountain.trailAssetUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Trail request failed (${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then((value) => setTrail(prepareTrail(validateTrailFeature(value))))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setTrailError(
          error instanceof Error ? error.message : "Trail data is unavailable.",
        );
      });

    return () => controller.abort();
  }, [mountain.trailAssetUrl]);

  const coordinate = useMemo(
    () => (trail ? getCoordinateAtProgress(trail, focus.progress) : null),
    [focus.progress, trail],
  );
  const mapCheckpoints = useMemo<MapCheckpoint[]>(
    () =>
      trail
        ? mountain.checkpoints.map((checkpoint) => ({
            id: checkpoint.id,
            name: checkpoint.name,
            coordinate: getCoordinateAtProgress(trail, checkpoint.progress),
          }))
        : [],
    [mountain.checkpoints, trail],
  );
  const nextCheckpoint = mountain.checkpoints.find(
    (checkpoint) => !focus.reachedCheckpointIds.includes(checkpoint.id),
  );
  const timedMilestones = useMemo(
    () => getTimedMilestones(mountain.checkpoints, focus.session.durationMs),
    [focus.session.durationMs, mountain.checkpoints],
  );
  const handleMapUnavailable = useCallback(
    (reason: string) => setMapUnavailable(reason),
    [],
  );
  const fallbackReason = trailError ?? mapUnavailable;
  const reward = game.lastReward ?? game.projectedReward;
  const currentEligibility = mountainUnlocks.eligibilityFor(mountain);
  const mountainLocked =
    mountainUnlocks.hydrated && currentEligibility !== "unlocked";

  const requestUnlock = useCallback((mountainOption: { slug: string }) => {
    const selected = mountains.find(
      (candidate) => candidate.slug === mountainOption.slug,
    );
    if (selected) setUnlockMountain(selected);
  }, []);

  const confirmUnlock = useCallback(async () => {
    if (!unlockMountain) throw new Error("Select a mountain to unlock.");
    const result = await mountainUnlocks.unlock(unlockMountain);
    game.applyMountainUnlock(result.spent, result.remainingTrailCoins);
    return result;
  }, [game, mountainUnlocks, unlockMountain]);

  return (
    <main className="game-shell">
      <ExpeditionSidebar
        mountainSlug={mountain.slug}
        mountainOptions={mountains.map((mountainOption) => ({
          slug: mountainOption.slug,
          name: mountainOption.name,
          region: mountainOption.region,
          province: mountainOption.province,
          difficulty: mountainOption.difficulty,
          elevationMasl: mountainOption.elevationMasl,
          imagePath: mountainOption.imagePath,
          requiredLevel: mountainOption.requiredLevel,
          unlockCost: mountainOption.unlockCost,
          eligibility: mountainUnlocks.eligibilityFor(mountainOption),
        }))}
        status={focus.session.status}
        durationMs={focus.session.durationMs}
        remainingMs={focus.remainingMs}
        isOnBreak={focus.isOnBreak}
        shortBreakRemainingMs={focus.shortBreakRemainingMs}
        progress={focus.progress}
        hydrated={focus.hydrated && game.hydrated}
        projectedXp={game.projectedReward.totalXp}
        projectedTrailCoins={game.projectedReward.trailCoins}
        mountainLocked={mountainLocked}
        profile={game.profile}
        level={game.level}
        onStart={focus.start}
        onPause={focus.pause}
        onResume={focus.resume}
        onReset={focus.reset}
        onDurationChange={focus.setDuration}
        onEditProfile={() => setShowProfileEditor(true)}
        onRequestUnlock={requestUnlock}
        tasks={tasks.tasks}
        onCreateTask={tasks.create}
        onUpdateTask={tasks.update}
        onDeleteTask={tasks.remove}
        onReorderTasks={tasks.reorderActiveTasks}
      />

      <section className="game-map" aria-label="Virtual expedition map">
        {!trail && !trailError && (
          <div className="map-loading" role="status">
            <span /> Loading expedition map…
          </div>
        )}
        {trail && coordinate && !mapUnavailable && (
          <MountainMap
            ref={mapRef}
            feature={trail.feature}
            coordinate={coordinate}
            progress={focus.progress}
            checkpoints={mapCheckpoints}
            reachedCheckpointIds={focus.reachedCheckpointIds}
            hikerAvatarUrl={game.profile.avatarUrl}
            navigationBounds={mountain.mapNavigationBounds}
            onUnavailable={handleMapUnavailable}
          />
        )}
        {fallbackReason && (
          <TrailFallback
            mountain={mountain}
            progress={focus.progress}
            reachedCheckpointIds={focus.reachedCheckpointIds}
            reason={fallbackReason}
          />
        )}

        <div className="map-mission-card map-status-ribbon">
          <div className="ribbon-stat">
            <span>△</span>
            <div>
              <small>Mountain</small>
              <strong>{mountain.name}</strong>
            </div>
          </div>
          <div className="ribbon-stat">
            <span>◆</span>
            <div>
              <small>Next checkpoint</small>
              <strong>{nextCheckpoint?.name ?? "Summit"}</strong>
            </div>
          </div>
          <div className="ribbon-stat remaining">
            <span>◷</span>
            <div>
              <small>Remaining</small>
              <strong>{formatRemainingTime(focus.remainingMs)}</strong>
            </div>
          </div>
        </div>

        <div className="map-control-stack" aria-label="Map controls">
          <button
            type="button"
            onClick={() => mapRef.current?.resetCamera()}
            title="Reset camera"
            aria-label="Reset camera"
          >
            <span>↺</span>
            <small>Reset</small>
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.fitTrail()}
            title="Fit trail"
            aria-label="Fit trail"
          >
            <span>⌗</span>
            <small>Fit trail</small>
          </button>
        </div>

        <div className="trail-identity-card">
          <span className="hud-label">Trail 01 · {mountain.province}</span>
          <h1>{mountain.name}</h1>
          <p>{mountain.trailName}</p>
        </div>

        <div className="checkpoint-dock">
          <div className="checkpoint-dock-heading">
            <div>
              <span>⚑ Route objectives</span>
              <p>
                Checkpoint times scale with your selected focus duration.
                Pausing freezes both the timer and hiker.
              </p>
            </div>
            <strong>
              {focus.reachedCheckpointIds.length}/{mountain.checkpoints.length}{" "}
              complete
            </strong>
          </div>
          <div className="checkpoint-dock-content">
            <div
              className="checkpoint-route"
              style={{
                gridTemplateColumns: `repeat(${mountain.checkpoints.length + 2}, minmax(0, 1fr))`,
              }}
            >
              <button
                type="button"
                className="checkpoint-node reached"
                aria-label={`Trailhead: unlocks at 00:00:00 elapsed, ${formatRemainingTime(focus.session.durationMs)} left`}
              >
                <span>✓</span>
                <small>Trailhead</small>
                <span className="checkpoint-tooltip" role="tooltip">
                  Unlocks at 00:00:00 elapsed ·{" "}
                  {formatRemainingTime(focus.session.durationMs)} left
                </span>
              </button>
              {timedMilestones.map((milestone) => {
                const reached = focus.reachedCheckpointIds.includes(
                  milestone.id,
                );
                return (
                  <button
                    key={milestone.id}
                    type="button"
                    className={
                      reached ? "checkpoint-node reached" : "checkpoint-node"
                    }
                    aria-label={`${milestone.name}: unlocks at ${formatRemainingTime(milestone.elapsedMs)} elapsed, ${formatRemainingTime(milestone.remainingMs)} left`}
                  >
                    <span>{reached ? "✓" : "+25"}</span>
                    <small>{milestone.name}</small>
                    <span className="checkpoint-tooltip" role="tooltip">
                      Unlocks at {formatRemainingTime(milestone.elapsedMs)}{" "}
                      elapsed · {formatRemainingTime(milestone.remainingMs)}{" "}
                      left
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className={
                  focus.session.status === "completed"
                    ? "checkpoint-node reached summit"
                    : "checkpoint-node summit"
                }
                aria-label={`Summit: unlocks at ${formatRemainingTime(focus.session.durationMs)} elapsed, 00:00:00 left`}
              >
                <span>{focus.session.status === "completed" ? "✓" : "▲"}</span>
                <small>Summit</small>
                <span className="checkpoint-tooltip" role="tooltip">
                  Unlocks at {formatRemainingTime(focus.session.durationMs)}{" "}
                  elapsed · 00:00:00 left
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="map-attribution-wrap">
          {showAttribution && (
            <div
              className="attribution-dialog"
              role="dialog"
              aria-label="Map and route attribution"
            >
              <p>{mountain.source.attribution}</p>
              <p>
                <b>Virtual focus route only.</b> Not for real-world navigation
                or safety decisions.
              </p>
              <small>
                {mountain.source.reference} · v{mountain.trailVersion}
              </small>
            </div>
          )}
          <button
            type="button"
            className="attribution-button"
            aria-label="Show map attribution and safety information"
            aria-expanded={showAttribution}
            onClick={() => setShowAttribution((current) => !current)}
          >
            ⓘ
          </button>
        </div>
        {mountainLocked && (
          <div
            className="locked-mountain-overlay"
            role="region"
            aria-label={`${mountain.name} unlock requirements`}
          >
            <span aria-hidden="true">◆</span>
            <strong>{mountain.name} is locked</strong>
            <p>
              {currentEligibility === "locked_by_level"
                ? `Reach Level ${mountain.requiredLevel} to start this trail.`
                : `You need ${Math.max(0, mountain.unlockCost - game.profile.trailCoins)} more Trail Coins.`}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setUnlockMountain(mountain)}
            >
              View requirements
            </button>
          </div>
        )}
      </section>

      {focus.latestCheckpoint && (
        <div className="checkpoint-toast" role="status">
          <span aria-hidden="true">+25</span>
          <div>
            <small>Checkpoint unlocked</small>
            <strong>{focus.latestCheckpoint.name}</strong>
            <p>{focus.latestCheckpoint.description}</p>
          </div>
          <button
            type="button"
            onClick={focus.dismissCheckpoint}
            aria-label="Dismiss checkpoint message"
          >
            ×
          </button>
        </div>
      )}

      {focus.session.status === "completed" && (
        <div
          className="completion-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="completion-title"
        >
          <div className="completion-card game-completion-card">
            <span className="summit-emblem" aria-hidden="true">
              ▲
            </span>
            <span className="hud-label">Expedition complete</span>
            <h2 id="completion-title">Summit secured!</h2>
            <p>
              Your focused ascent of {mountain.name} is complete. Rewards have
              been added to your local hiker profile.
            </p>
            <div className="reward-breakdown">
              <div>
                <small>Focus XP</small>
                <strong>+{reward.focusXp}</strong>
              </div>
              <div>
                <small>Checkpoint XP</small>
                <strong>+{reward.checkpointXp}</strong>
              </div>
              <div>
                <small>Summit bonus</small>
                <strong>+{reward.summitXp}</strong>
              </div>
              <div className="reward-total">
                <small>Total earned</small>
                <strong>
                  +{reward.totalXp} XP · +{reward.trailCoins} Trail Coins
                </strong>
              </div>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={focus.reset}
            >
              Return to trail camp
            </button>
          </div>
        </div>
      )}
      {game.hydrated && !game.profile.onboardingComplete && (
        <ProfileOnboardingDialog
          initialName={game.profile.displayName}
          onComplete={game.updateIdentity}
        />
      )}
      {unlockMountain && (
        <UnlockMountainDialog
          mountain={unlockMountain}
          eligibility={mountainUnlocks.eligibilityFor(unlockMountain)}
          currentLevel={game.level.level}
          trailCoins={game.profile.trailCoins}
          onConfirm={confirmUnlock}
          onClose={() => setUnlockMountain(null)}
        />
      )}
      {game.hydrated &&
        game.profile.onboardingComplete &&
        showProfileEditor && (
          <ProfileOnboardingDialog
            initialName={game.profile.displayName}
            mode="edit"
            onComplete={game.updateIdentity}
            onClose={() => setShowProfileEditor(false)}
          />
        )}
    </main>
  );
}
