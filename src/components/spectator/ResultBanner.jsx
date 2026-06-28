// src/components/spectator/ResultBanner.jsx
//
// PRD Page 4 — "Added — Final Result Banner"
// Renders only when match.status === 'completed'.
// Replaces the live ribbon area with match.result string from DB.

export default function ResultBanner({ result }) {
  if (!result) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-yellow-400/30 to-orange-400/30 px-8 py-6 text-center ring-1 ring-yellow-300/40 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
        Match Result
      </p>
      <p className="mt-2 text-2xl font-extrabold">{result}</p>
    </div>
  );
}