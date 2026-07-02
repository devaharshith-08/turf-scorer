// src/components/spectator/BatsmenStatTable.jsx
//
// PRD Page 4 — Batting stats for current innings.
// Columns: Name | Runs | Balls Faced | SR
//
// Batsman shape from scoringLogic.js:
//   { name, runs, balls, isOut }
// Note: field is `balls` (not `ballsFaced`) per scoringLogic.js.
//
// Strike Rate computed here: (runs / balls) * 100, rounded to 1 dp.
//
// BUGFIX (Bug 1): now also accepts `onStrike` (the batsman's name currently
// on strike, from innings.onStrike) and renders a ⭐ marker next to that
// row — same convention as the umpire's BatsmenPanel.

function strikeRate(runs, balls) {
  if (!balls || balls === 0) return '–';
  return ((runs / balls) * 100).toFixed(1);
}

export default function BatsmenStatTable({ batsmen = [], onStrike = null }) {
  if (batsmen.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-4 text-center text-sm opacity-60">
        No batting data yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm">
      <p className="px-4 py-3 text-xs font-semibold uppercase tracking-widest opacity-60">
        Batting
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-white/10 text-left text-xs opacity-50">
            <th className="px-4 py-2 font-semibold">Batter</th>
            <th className="px-4 py-2 text-right font-semibold">R</th>
            <th className="px-4 py-2 text-right font-semibold">B</th>
            <th className="px-4 py-2 text-right font-semibold">SR</th>
          </tr>
        </thead>
        <tbody>
          {batsmen.map((b, i) => (
            <tr
              key={b.name ?? i}
              className="border-t border-white/10 hover:bg-white/5"
            >
              <td className="px-4 py-2 font-medium">
                {b.name === onStrike && (
                  <span className="mr-1 text-yellow-400">⭐</span>
                )}
                {b.name}
                {b.isOut && (
                  <span className="ml-2 text-xs opacity-40">(out)</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">{b.runs ?? 0}</td>
              <td className="px-4 py-2 text-right">{b.balls ?? 0}</td>
              <td className="px-4 py-2 text-right">
                {strikeRate(b.runs ?? 0, b.balls ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}