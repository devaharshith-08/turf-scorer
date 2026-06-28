// src/components/umpire/NewBatsmanModal.jsx
'use client';

import { useState } from 'react';

const DISMISSAL_TYPES = ['bowled', 'caught', 'runout'];

export default function NewBatsmanModal({ mode, battingPlayers, bowlingPlayers, onConfirm }) {
  const [dismissal, setDismissal] = useState(null);
  const [newBatsman, setNewBatsman] = useState(null);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);

  if (mode === 'openers') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl p-5 w-full max-w-sm space-y-4">
          <h2 className="text-lg font-bold text-white">Select Opening Players</h2>

          <div>
            <p className="text-sm text-gray-400 mb-1">Striker</p>
            <div className="flex flex-wrap gap-2">
              {battingPlayers.map((p) => (
                <button
                  key={p}
                  onClick={() => setStriker(p)}
                  className={`px-3 py-2 rounded text-sm text-white ${
                    striker === p ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Non-Striker</p>
            <div className="flex flex-wrap gap-2">
              {battingPlayers
                .filter((p) => p !== striker)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setNonStriker(p)}
                    className={`px-3 py-2 rounded text-sm text-white ${
                      nonStriker === p ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Opening Bowler</p>
            <div className="flex flex-wrap gap-2">
              {bowlingPlayers.map((p) => (
                <button
                  key={p}
                  onClick={() => setBowler(p)}
                  className={`px-3 py-2 rounded text-sm text-white ${
                    bowler === p ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!striker || !nonStriker || !bowler}
            onClick={() => onConfirm({ striker, nonStriker, bowler })}
            className="w-full py-3 rounded bg-blue-600 text-white font-bold disabled:opacity-40"
          >
            Start Innings
          </button>
        </div>
      </div>
    );
  }

  // mode === 'replacement' (triggered after a WICKET tap)
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Wicket!</h2>

        <div>
          <p className="text-sm text-gray-400 mb-1">How was the batsman out?</p>
          <div className="flex gap-2">
            {DISMISSAL_TYPES.map((d) => (
              <button
                key={d}
                onClick={() => setDismissal(d)}
                className={`px-3 py-2 rounded capitalize text-sm text-white ${
                  dismissal === d ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Select new batsman</p>
          <div className="flex flex-wrap gap-2">
            {battingPlayers.length === 0 ? (
              <p className="text-sm text-gray-500">No players remaining.</p>
            ) : (
              battingPlayers.map((p) => (
                <button
                  key={p}
                  onClick={() => setNewBatsman(p)}
                  className={`px-3 py-2 rounded text-sm text-white ${
                    newBatsman === p ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))
            )}
          </div>
        </div>

        <button
          disabled={!dismissal || !newBatsman}
          onClick={() => onConfirm({ dismissal, newBatsman })}
          className="w-full py-3 rounded bg-blue-600 text-white font-bold disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}