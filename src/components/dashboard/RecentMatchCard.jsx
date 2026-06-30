// src/components/dashboard/RecentMatchCard.jsx

import Link from 'next/link';

export default function RecentMatchCard({ match }) {
  const innings = match.innings ?? [];

  return (
    <Link href={`/match/${match.matchId}`}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-gray-500 transition-colors">
        <div className="text-sm text-gray-400 mb-3">
          {match.teams.teamA.name} vs {match.teams.teamB.name}
        </div>

        <div className="space-y-1.5 mb-3">
          {innings.map((inn, index) => {
            const teamName = match.teams[inn.battingTeam]?.name ?? 'Team';
            return (
              <div
                key={index}
                className="flex items-center justify-between text-base"
              >
                <span className="text-gray-300 font-medium">{teamName}</span>
                <span className="font-bold text-white">
                  {inn.runs ?? 0}/{inn.wickets ?? 0}
                  <span className="text-gray-500 font-normal text-sm ml-1">
                    ({inn.overs ?? 0} ov)
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-sm text-green-400 border-t border-gray-800 pt-2">
          {match.result}
        </div>
      </div>
    </Link>
  );
}