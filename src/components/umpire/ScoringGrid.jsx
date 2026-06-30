// src/components/umpire/ScoringGrid.jsx
'use client';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';

// PHASE 8 — Accessibility pass:
// - min-h-56px was not a valid Tailwind class (arbitrary values need square
//   brackets), so these buttons had NO enforced minimum height before this
//   fix. Replaced with min-h-[56px] min-w-[56px] to guarantee the PRD's
//   48x48px touch target minimum with margin to spare.
// - Added focus-visible:outline rings on every button so umpires using a
//   connected keyboard/switch device (or screen reader navigation) can see
//   which control is focused.
const BASE_BUTTON =
  'min-h-[56px] min-w-[56px] rounded-lg disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export default function ScoringGrid({ onScore, onWicketTap, onUndo, disabled, isFreeHit }) {
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
    <div className="mt-4">
      {isFreeHit && (
        <div
          role="status"
          className="mb-3 rounded-lg bg-yellow-500 text-black text-center font-bold py-2 px-3"
        >
          FREE HIT — only Run Out dismisses the batsman
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 - Runs */}
        {[0, 1, 2, 3].map((r) => (
          <button
            key={r}
            disabled={disabled}
            onClick={() => tapRun(r)}
            aria-label={`${r} run${r === 1 ? '' : 's'}`}
            className={`${BASE_BUTTON} bg-gray-700 text-white text-xl font-bold`}
          >
            {r}
          </button>
        ))}

        {/* Row 2 - Boundaries (distinct green) */}
        <button
          disabled={disabled}
          onClick={() => tapRun(4)}
          aria-label="4 runs, boundary"
          className={`${BASE_BUTTON} col-span-2 bg-green-600 text-white text-xl font-bold`}
        >
          4
        </button>
        <button
          disabled={disabled}
          onClick={() => tapRun(6)}
          aria-label="6 runs, six"
          className={`${BASE_BUTTON} col-span-2 bg-green-600 text-white text-xl font-bold`}
        >
          6
        </button>

        {/* Row 3 - Extras */}
        <button
          disabled={disabled}
          onClick={() => tapExtra('wide')}
          className={`${BASE_BUTTON} bg-blue-700 text-white font-semibold`}
        >
          Wide
        </button>
        <button
          disabled={disabled}
          onClick={() => tapExtra('noball')}
          className={`${BASE_BUTTON} bg-blue-700 text-white font-semibold`}
        >
          No Ball
        </button>
        <button
          disabled={disabled}
          onClick={() => tapExtra('bye')}
          className={`${BASE_BUTTON} bg-blue-700 text-white font-semibold`}
        >
          Bye
        </button>
        <button
          disabled={disabled}
          onClick={() => tapExtra('legbye')}
          className={`${BASE_BUTTON} bg-blue-700 text-white font-semibold`}
        >
          Leg Bye
        </button>

        {/* Row 4 - Critical actions */}
        <button
          disabled={disabled}
          onClick={tapWicket}
          aria-label="Wicket"
          className={`${BASE_BUTTON} col-span-2 bg-red-600 text-white text-xl font-bold`}
        >
          WICKET
        </button>
        <button
          disabled={disabled}
          onClick={tapUndo}
          aria-label="Undo last ball"
          className={`${BASE_BUTTON} col-span-2 bg-yellow-600 text-white font-bold`}
        >
          UNDO
        </button>
      </div>
    </div>
  );
}