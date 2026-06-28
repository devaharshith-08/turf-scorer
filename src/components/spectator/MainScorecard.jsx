// src/components/spectator/MainScorecard.jsx
//
// PRD Page 4 — "Giant Scoreboard"
// Displays: TEAM NAME · runs/wickets · over X.Y
//
// `wickets` is innings.wickets from the doc — server-computed as
// (playerCount - 1). This component does NOT recompute it.

export default function MainScorecard({ teamName, runs, wickets, overs }) {
  return (
    <div className="rounded-2xl bg-white/10 p-8 text-center shadow-lg backdrop-blur-sm">
      <p className="text-sm font-semibold uppercase tracking-widest opacity-60">
        {teamName}
      </p>
      <p className="mt-2 text-6xl font-extrabold tracking-tight">
        {runs}
        <span className="text-4xl opacity-70">/{wickets}</span>
      </p>
      <p className="mt-2 text-lg opacity-75">over {overs}</p>
    </div>
  );
}