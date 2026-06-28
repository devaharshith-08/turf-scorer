// src/components/spectator/ChaseCalculator.jsx
//
// PRD Page 4 — shown only during the 2nd innings.
// PRD wording: "Need X runs in Y balls. Required Run Rate: Z"
//
// Props: chaseInfo — { runsNeeded, ballsRemaining, requiredRunRate }
// Computed in SpectatorView via getChaseInfo(match).

export default function ChaseCalculator({ chaseInfo }) {
  if (!chaseInfo) return null;

  const { runsNeeded, ballsRemaining, requiredRunRate } = chaseInfo;

  if (runsNeeded <= 0) {
    return (
      <div className="rounded-xl bg-emerald-500/20 px-6 py-4 text-center ring-1 ring-emerald-400/30">
        <p className="font-semibold text-emerald-300">Target achieved!</p>
      </div>
    );
  }

  if (ballsRemaining <= 0) {
    return (
      <div className="rounded-xl bg-red-500/20 px-6 py-4 text-center ring-1 ring-red-400/30">
        <p className="font-semibold text-red-300">Innings over — target not reached.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm">
      <p className="text-sm opacity-70">
        Need{' '}
        <span className="font-bold text-white">{runsNeeded} runs</span>
        {' '}in{' '}
        <span className="font-bold text-white">{ballsRemaining} balls</span>.
        {' '}Required Run Rate:{' '}
        <span className="font-bold text-white">{requiredRunRate}</span>
      </p>
    </div>
  );
}