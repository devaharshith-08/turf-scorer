// src/components/umpire/NewOverModal.jsx
'use client';

import { useState } from 'react';

export default function NewOverModal({ bowlingPlayers, currentBowler, onConfirm }) {
  const [nextBowler, setNextBowler] = useState(null);
  const [swapStrike, setSwapStrike] = useState(true);

  // NOTE: deliberately NOT filtering out currentBowler from this list.
  // "Bowler can't bowl consecutive overs" is a Phase 7 turf-specific rule
  // (per your roadmap) - out of scope here, so any bowler can be reselected.

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Over Complete</h2>

        <div>
          <p className="text-sm text-gray-400 mb-1">Select next bowler</p>
          <div className="flex flex-wrap gap-2">
            {bowlingPlayers.map((p) => (
              <button
                key={p}
                onClick={() => setNextBowler(p)}
                className={`px-3 py-2 rounded text-sm text-white ${
                  nextBowler === p ? 'bg-green-600' : 'bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-white text-sm">
          <input
            type="checkbox"
            checked={swapStrike}
            onChange={(e) => setSwapStrike(e.target.checked)}
          />
          Swap strike (standard end-of-over rotation)
        </label>

        <button
          disabled={!nextBowler}
          onClick={() => onConfirm({ nextBowler, swapStrike })}
          className="w-full py-3 rounded bg-blue-600 text-white font-bold disabled:opacity-40"
        >
          Start Next Over
        </button>
      </div>
    </div>
  );
}