'use client';

import { useState, useCallback } from 'react';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import Link from 'next/link';
import LiveMatchCard from '@/components/dashboard/LiveMatchCard';
import RecentMatchCard from '@/components/dashboard/RecentMatchCard';

export default function DashboardClient({ initialLiveMatches, initialCompletedMatches }) {
  const [liveMatches, setLiveMatches] = useState(initialLiveMatches);
  const [completedMatches, setCompletedMatches] = useState(initialCompletedMatches);

  const refetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setLiveMatches(data.liveMatches);
      setCompletedMatches(data.completedMatches);
    } catch {
      // Network error — skip silently, next event will catch us up
    }
  }, []);

  usePusherChannel('global-matches', {
    'global-update': () => {
      refetchDashboard();
    },
  });

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">🏏 Turf Score</h1>
        <Link
          href="/match/create"
          className="bg-green-500 hover:bg-green-600 text-black font-semibold px-5 py-2 rounded-lg"
        >
          + Create Match
        </Link>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Matches
        </h2>

        {liveMatches.length === 0 ? (
          <p className="text-gray-400">No live matches right now</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {liveMatches.map((match) => (
              <LiveMatchCard key={match.matchId} match={match} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Matches</h2>

        {completedMatches.length === 0 ? (
          <p className="text-gray-400">No completed matches yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {completedMatches.map((match) => (
              <RecentMatchCard key={match.matchId} match={match} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}