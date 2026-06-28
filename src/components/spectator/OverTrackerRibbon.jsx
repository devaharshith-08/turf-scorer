// src/components/spectator/OverTrackerRibbon.jsx
//
// PRD Page 4 — horizontal pill row showing each ball of the current over.
// Accessibility: color is NOT the only differentiator — shape/symbol also
// differs (PRD accessibility requirement).
//
// Props:
//   balls — array of ball objects for the current over.
//   Ball shape from scoringLogic.js:
//     { sequenceId, type, runs, isWicket, dismissal, batsmanOnStrike, bowler }
//   Empty array (before first ball) renders placeholder slots — no crash.

function BallPill({ ball }) {
  const { type, runs = 0, isWicket = false } = ball;

  // --- Label — shape cue for accessibility (not color alone) ---
  let label;
  if (isWicket)               label = '✕';   // cross — shape cue
  else if (type === 'wide')   label = 'Wd';
  else if (type === 'noball') label = 'Nb';
  else if (runs === 0)        label = '·';   // dot ball
  else                        label = String(runs);

  // --- Color ---
  let colorClass;
  if (isWicket) {
    colorClass = 'bg-red-500/80 text-white ring-2 ring-red-300';
  } else if (runs >= 4) {
    colorClass = 'bg-emerald-500/80 text-white ring-2 ring-emerald-300';
  } else if (type === 'wide' || type === 'noball') {
    colorClass = 'bg-yellow-400/80 text-black';
  } else {
    colorClass = 'bg-white/20 text-white';
  }

  const title =
    isWicket        ? 'Wicket'
    : type === 'wide'   ? 'Wide'
    : type === 'noball' ? 'No Ball'
    : `${runs} run${runs !== 1 ? 's' : ''}`;

  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
      title={title}
    >
      {label}
    </span>
  );
}

export default function OverTrackerRibbon({ balls = [] }) {
  const OVER_SIZE = 6;
  // Only legal balls count toward the 6-slot display
  const legalBalls = balls.filter(
    (b) => b.type !== 'wide' && b.type !== 'noball'
  );
  const placeholderCount = Math.max(0, OVER_SIZE - legalBalls.length);

  return (
    <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-60">
        This Over
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Show ALL balls (including wides/noballs) so nothing is hidden */}
        {balls.map((ball, i) => (
          <BallPill key={ball.sequenceId ?? i} ball={ball} />
        ))}
        {/* Remaining empty slots based on legal balls bowled */}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <span
            key={`empty-${i}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/20"
          >
            –
          </span>
        ))}
      </div>
    </div>
  );
}