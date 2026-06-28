// src/components/spectator/BowlerStatTable.jsx
//
// PRD Page 4 — Bowling stats for current innings.
// Columns: Name | Overs | Maidens | Runs | Wickets | Economy
//
// Bowler shape from scoringLogic.js:
//   { name, overs, maidens, runsConceded, wickets }
//
// Economy = (runsConceded / totalBalls) * 6, rounded to 2 dp.
// overs stored as X.Y decimal (e.g. 2.4 = 2 overs + 4 balls).

function economy(runsConceded, overs) {
  const wholeOvers = Math.floor(overs);
  const ballsInOver = Math.round((overs - wholeOvers) * 10);
  const totalBalls = wholeOvers * 6 + ballsInOver;
  if (!totalBalls || totalBalls === 0) return '–';
  return ((runsConceded / totalBalls) * 6).toFixed(2);
}

export default function BowlerStatTable({ bowlers = [] }) {
  if (bowlers.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-4 text-center text-sm opacity-60">
        No bowling data yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm">
      <p className="px-4 py-3 text-xs font-semibold uppercase tracking-widest opacity-60">
        Bowling
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-white/10 text-left text-xs opacity-50">
            <th className="px-4 py-2 font-semibold">Bowler</th>
            <th className="px-4 py-2 text-right font-semibold">O</th>
            <th className="px-4 py-2 text-right font-semibold">M</th>
            <th className="px-4 py-2 text-right font-semibold">R</th>
            <th className="px-4 py-2 text-right font-semibold">W</th>
            <th className="px-4 py-2 text-right font-semibold">Econ</th>
          </tr>
        </thead>
        <tbody>
          {bowlers.map((b, i) => (
            <tr
              key={b.name ?? i}
              className="border-t border-white/10 hover:bg-white/5"
            >
              <td className="px-4 py-2 font-medium">{b.name}</td>
              <td className="px-4 py-2 text-right">{b.overs ?? 0}</td>
              <td className="px-4 py-2 text-right">{b.maidens ?? 0}</td>
              <td className="px-4 py-2 text-right">{b.runsConceded ?? 0}</td>
              <td className="px-4 py-2 text-right">{b.wickets ?? 0}</td>
              <td className="px-4 py-2 text-right">
                {economy(b.runsConceded ?? 0, b.overs ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}