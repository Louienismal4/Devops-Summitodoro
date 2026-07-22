"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import type { MountainUnlockEligibility } from "@/lib/gamification/mountain-unlocks";
import type { Mountain } from "@/types/mountain";

type UnlockResult = { spent: number; remainingTrailCoins: number };

const confettiPieces = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 29) % 84)}%`,
  delay: `${(index % 8) * 42}ms`,
  rotation: `${(index * 47) % 180}deg`,
}));

type UnlockMountainDialogProps = {
  mountain: Mountain;
  eligibility: MountainUnlockEligibility;
  currentLevel: number;
  trailCoins: number;
  onConfirm: () => Promise<UnlockResult>;
  onClose: () => void;
};

export function UnlockMountainDialog({
  mountain,
  eligibility,
  currentLevel,
  trailCoins,
  onConfirm,
  onClose,
}: UnlockMountainDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnlockResult | null>(null);
  const missingCoins = Math.max(0, mountain.unlockCost - trailCoins);
  const canConfirm = eligibility === "ready_to_unlock" && !saving;

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: "power1.out" },
      );
      gsap.fromTo(
        dialogRef.current,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "back.out(1.4)" },
      );
    }, backdropRef);
    return () => context.revert();
  }, []);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      setResult(await onConfirm());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to unlock mountain.",
      );
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(
          dialogRef.current,
          { x: -7 },
          { x: 0, duration: 0.36, ease: "elastic.out(1, 0.45)" },
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="progression-dialog-backdrop"
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="progression-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-mountain-title"
      >
        {result && (
          <div className="unlock-confetti" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                style={
                  {
                    "--confetti-left": piece.left,
                    "--confetti-delay": piece.delay,
                    "--confetti-rotation": piece.rotation,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
        <span className="progression-dialog-emblem" aria-hidden="true">
          ◆
        </span>
        {result ? (
          <>
            <p className="section-kicker">Trail unlocked</p>
            <h2 id="unlock-mountain-title">{mountain.name} is ready.</h2>
            <p>
              {result.spent} Trail Coins spent. Your remaining balance is{" "}
              {result.remainingTrailCoins}.
            </p>
            <button type="button" className="primary-button" onClick={onClose}>
              Continue to trail
            </button>
          </>
        ) : (
          <>
            <p className="section-kicker">Mountain progression</p>
            <h2 id="unlock-mountain-title">Unlock {mountain.name}?</h2>
            <div className="unlock-requirements">
              <span>
                Level {mountain.requiredLevel} required{" "}
                <b>Your level: {currentLevel}</b>
              </span>
              <span>
                {mountain.unlockCost} Trail Coins{" "}
                <b>Your balance: {trailCoins}</b>
              </span>
            </div>
            {eligibility === "locked_by_level" && (
              <p>
                You need to reach Level {mountain.requiredLevel} before
                unlocking this mountain.
              </p>
            )}
            {eligibility === "locked_by_currency" && (
              <p>
                You need {missingCoins} more Trail Coins to unlock this
                mountain.
              </p>
            )}
            {eligibility === "ready_to_unlock" && (
              <p>
                This mountain will remain permanently unlocked. Balance after
                unlock: {trailCoins - mountain.unlockCost} Trail Coins.
              </p>
            )}
            {error && (
              <p className="progression-error" role="alert">
                {error}
              </p>
            )}
            <div className="progression-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
              {eligibility === "ready_to_unlock" && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={!canConfirm}
                  onClick={() => void confirm()}
                >
                  {saving ? "Unlocking…" : "Unlock mountain"}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
