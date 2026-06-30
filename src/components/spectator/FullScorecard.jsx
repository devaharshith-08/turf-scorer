// src/components/spectator/FullScorecard.jsx
//
// Renders the full post-match scorecard for a completed match: one
// batting table + one bowling table per innings. Pure presentational
// component — all the data shaping happens in getFullScorecard
// (src/lib/spectatorStats.js). This component just maps that output
// to markup.

import { getFullScorecard } from '@/lib/spectatorStats';

export default function FullScorecard({ match }) {
  if (!match || !Array.isArray(match.innings) || match.innings.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No scorecard data available for this match.
      </div>
    );
  }

  const scorecards = getFullScorecard(match.innings);

  return (
    <div className="flex flex-col gap-8">
      {scorecards.map((innings, index) => (
        <div
          key={index}
          className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-6"
        >
          <h2 className="text-xl font-bold text-white mb-1">
            {innings.battingTeam} Innings
          </h2>
          <p className="text-gray-400 mb-4">
            {innings.runs}/{innings.wickets} ({innings.overs} ov)
          </p>

          {/* Batting table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left text-gray-200">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 uppercase text-xs">
                  <th className="py-2 pr-2">Batsman</th>
                  <th className="py-2 px-2 text-right">R</th>
                  <th className="py-2 px-2 text-right">B</th>
                  <th className="py-2 px-2 text-right">4s</th>
                  <th className="py-2 px-2 text-right">6s</th>
                  <th className="py-2 px-2 text-right">SR</th>
                  <th className="py-2 pl-2">How Out</th>
                </tr>
              </thead>
              <tbody>
                {innings.batting.map((b) => (
                  <tr key={b.name} className="border-b border-gray-800">
                    <td className="py-2 pr-2 font-medium text-white">{b.name}</td>
                    <td className="py-2 px-2 text-right">{b.runs}</td>
                    <td className="py-2 px-2 text-right">{b.balls}</td>
                    <td className="py-2 px-2 text-right">{b.fours}</td>
                    <td className="py-2 px-2 text-right">{b.sixes}</td>
                    <td className="py-2 px-2 text-right">{b.strikeRate}</td>
                    <td className="py-2 pl-2 text-gray-400 italic">{b.howOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bowling table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-200">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 uppercase text-xs">
                  <th className="py-2 pr-2">Bowler</th>
                  <th className="py-2 px-2 text-right">O</th>
                  <th className="py-2 px-2 text-right">M</th>
                  <th className="py-2 px-2 text-right">R</th>
                  <th className="py-2 px-2 text-right">W</th>
                  <th className="py-2 pl-2 text-right">Econ</th>
                </tr>
              </thead>
              <tbody>
                {innings.bowling.map((bw) => (
                  <tr key={bw.name} className="border-b border-gray-800">
                    <td className="py-2 pr-2 font-medium text-white">{bw.name}</td>
                    <td className="py-2 px-2 text-right">{bw.overs}</td>
                    <td className="py-2 px-2 text-right">{bw.maidens}</td>
                    <td className="py-2 px-2 text-right">{bw.runsConceded}</td>
                    <td className="py-2 px-2 text-right">{bw.wickets}</td>
                    <td className="py-2 pl-2 text-right">{bw.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}