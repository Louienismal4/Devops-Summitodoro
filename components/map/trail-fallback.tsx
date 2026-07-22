import type { Mountain } from "@/types/mountain";

type TrailFallbackProps = {
  mountain: Mountain;
  progress: number;
  reachedCheckpointIds: string[];
  reason?: string;
};

export function TrailFallback({
  mountain,
  progress,
  reachedCheckpointIds,
  reason,
}: TrailFallbackProps) {
  const hikerLeft = Math.min(Math.max(progress * 100, 2), 98);

  return (
    <div
      className="trail-fallback"
      role="img"
      aria-label={`Virtual trail progress: ${Math.round(progress * 100)} percent`}
    >
      <div className="fallback-sky">
        <span className="fallback-title">LOW-DATA TRAIL VIEW</span>
        <div className="fallback-peaks" aria-hidden="true" />
      </div>
      <div className="fallback-route">
        <div className="route-labels">
          <span>Trailhead</span>
          {mountain.checkpoints.map((checkpoint) => (
            <span key={checkpoint.id}>{checkpoint.name}</span>
          ))}
          <span>Summit</span>
        </div>
        <div className="route-line">
          <span
            className="route-completed"
            style={{ width: `${progress * 100}%` }}
          />
          <span
            className="hiker-dot"
            style={{ left: `${hikerLeft}%` }}
            aria-hidden="true"
          >
            ●
          </span>
          {mountain.checkpoints.map((checkpoint) => (
            <span
              key={checkpoint.id}
              className={
                reachedCheckpointIds.includes(checkpoint.id)
                  ? "checkpoint-dot reached"
                  : "checkpoint-dot"
              }
              style={{ left: `${checkpoint.progress * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <strong>{Math.round(progress * 100)}% climbed</strong>
      </div>
      {reason && (
        <p className="fallback-reason">
          {reason} Your timer will keep running normally.
        </p>
      )}
    </div>
  );
}
