// src/components/dashboard/RecentMatchCard.jsx

export default function RecentMatchCard({ match }) {
  const finalInnings = match.innings[match.innings.length - 1];

  const runs = finalInnings?.runs ?? 0;
  const wickets = finalInnings?.wickets ?? 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-2">
        {match.teams.teamA.name} vs {match.teams.teamB.name}
      </div>
      <div className="text-xl font-bold mb-1">
        {runs}/{wickets}
      </div>
      <div className="text-sm text-green-400">{match.result}</div>
    </div>
  );
}