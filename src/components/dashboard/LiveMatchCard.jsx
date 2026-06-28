// src/components/dashboard/LiveMatchCard.jsx

import Link from "next/link";

export default function LiveMatchCard({ match }) {
  const latestInnings = match.innings[match.innings.length - 1];

  const runs = latestInnings?.runs ?? 0;
  const wickets = latestInnings?.wickets ?? 0;
  const overs = latestInnings?.overs ?? 0;

  return (
    <Link
      href={`/match/${match.matchId}`}
      className="block bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-green-500 transition"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          {match.teams.teamA.name} vs {match.teams.teamB.name}
        </span>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
      </div>

      <div className="text-2xl font-bold">
        {runs}/{wickets}
      </div>
      <div className="text-sm text-gray-400">{overs} ov</div>
    </Link>
  );
}