// src/components/umpire/ScoringGrid.jsx
'use client';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export default function ScoringGrid({ onScore, onWicketTap, onUndo, disabled }) {
  const vibrate = useHapticFeedback();

  function tapRun(runs) {
    vibrate();
    onScore({ type: 'run', runs, isWicket: false });
  }

  function tapExtra(type) {
    vibrate();
    onScore({ type, runs: 1, isWicket: false });
  }

  function tapWicket() {
    vibrate();
    onWicketTap();
  }

  function tapUndo() {
    vibrate();
    onUndo();
  }

  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      {/* Row 1 - Runs */}
      {[0, 1, 2, 3].map((r) => (
        <button
          key={r}
          disabled={disabled}
          onClick={() => tapRun(r)}
          className="min-h-56px rounded-lg bg-gray-700 text-white text-xl font-bold disabled:opacity-40"
        >
          {r}
        </button>
      ))}

      {/* Row 2 - Boundaries (distinct green) */}
      <button
        disabled={disabled}
        onClick={() => tapRun(4)}
        className="col-span-2 min-h-56px rounded-lg bg-green-600 text-white text-xl font-bold disabled:opacity-40"
      >
        4
      </button>
      <button
        disabled={disabled}
        onClick={() => tapRun(6)}
        className="col-span-2 min-h-56px rounded-lg bg-green-600 text-white text-xl font-bold disabled:opacity-40"
      >
        6
      </button>

      {/* Row 3 - Extras */}
      <button
        disabled={disabled}
        onClick={() => tapExtra('wide')}
        className="min-h-56px rounded-lg bg-blue-700 text-white font-semibold disabled:opacity-40"
      >
        Wide
      </button>
      <button
        disabled={disabled}
        onClick={() => tapExtra('noball')}
        className="min-h-56px rounded-lg bg-blue-700 text-white font-semibold disabled:opacity-40"
      >
        No Ball
      </button>
      <button
        disabled={disabled}
        onClick={() => tapExtra('legbye')}
        className="col-span-2 min-h-56px rounded-lg bg-blue-700 text-white font-semibold disabled:opacity-40"
      >
        Leg Bye
      </button>

      {/* Row 4 - Critical actions */}
      <button
        disabled={disabled}
        onClick={tapWicket}
        className="col-span-2 min-h-56px rounded-lg bg-red-600 text-white text-xl font-bold disabled:opacity-40"
      >
        WICKET
      </button>
      <button
        onClick={tapUndo}
        className="col-span-2 min-h-56px rounded-lg bg-yellow-600 text-white font-bold"
      >
        UNDO
      </button>
    </div>
  );
}