// src/components/spectator/SpectatorView.jsx
//
// PRD Page 4 — Client wrapper + layout orchestrator.
// Assembly order per PRD:
//   1. Header
//   2. Main Scoreboard
//   3. Over Ribbon  OR  Result Banner (if completed)
//   4. Chase Calculator (2nd innings only, while live)
//   5. Stat Tables (batting + bowling) — LIVE: current innings only
//      OR Full Scorecard (both innings, all players) — COMPLETED
//
// Phase 6: Pusher signals an update on `match-${matchId}` -> we refetch
// full match state from GET /api/match/[matchId] (same route used for
// the old Phase 5 polling). Pusher payload itself is NOT used as data —
// it's just a "something changed, go fetch" trigger. This keeps all the
// derived-data logic below working off one full, consistent match object,
// since the broadcast payload is deliberately too lean (5KB NFR) to carry
// full ball history / batsmen / bowler arrays.
//
// Post-completion addition: once status === 'completed', the stat tables
// section is replaced by FullScorecard, which shows every batsman/bowler
// across BOTH innings (not just the current/last one) — derived from
// match.innings via getFullScorecard in spectatorStats.js.

'use client';

import { useState, useCallback } from 'react';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import MainScorecard from '@/components/spectator/MainScorecard';
import OverTrackerRibbon from '@/components/spectator/OverTrackerRibbon';
import ChaseCalculator from '@/components/spectator/ChaseCalculator';
import BatsmenStatTable from '@/components/spectator/BatsmenStatTable';
import BowlerStatTable from '@/components/spectator/BowlerStatTable';
import ResultBanner from '@/components/spectator/ResultBanner';
import FullScorecard from '@/components/spectator/FullScorecard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the current innings object (last in array), or null if not started. */
function getCurrentInnings(match) {
  if (!match.innings || match.innings.length === 0) return null;
  return match.innings[match.innings.length - 1];
}

/**
 * Returns the balls array for the current (in-progress) over.
 *
 * innings.overs is stored as X.Y (e.g. 5.2 = 5 completed overs + 2 legal balls
 * into the 6th over). We count legal balls through the full balls[] array to find
 * where the current over starts, then return everything from that point onward.
 *
 * Ball shape from scoringLogic.js:
 *   { sequenceId, type, runs, isWicket, dismissal, batsmanOnStrike, bowler }
 * Legal ball = type !== 'wide' && type !== 'noball'
 */
function getCurrentOverBalls(innings) {
  if (!innings || !Array.isArray(innings.balls) || innings.balls.length === 0) {
    return [];
  }

  // How many legal balls have been bowled in COMPLETED overs
  const completedOvers = Math.floor(innings.overs);
  const legalBallsInCompletedOvers = completedOvers * 6;

  // Walk the balls array counting legal balls.
  // Once we've passed legalBallsInCompletedOvers legal balls,
  // everything remaining belongs to the current over.
  let legalCount = 0;
  const currentOverBalls = [];

  for (const ball of innings.balls) {
    const isLegal = ball.type !== 'wide' && ball.type !== 'noball';

    if (legalCount >= legalBallsInCompletedOvers) {
      // We're inside the current over — collect this ball
      currentOverBalls.push(ball);
    }

    if (isLegal) legalCount++;
  }

  return currentOverBalls;
}

/**
 * Chase info for the 2nd innings.
 * Returns null if we're not in the 2nd innings yet.
 *
 * Uses match.settings.totalOvers for the balls-remaining calculation,
 * falling back to 20 overs if the field isn't present.
 */
function getChaseInfo(match) {
  if (!match.innings || match.innings.length < 2) return null;

  const firstInnings  = match.innings[0];
  const secondInnings = match.innings[1];

  const target      = (firstInnings.runs ?? 0) + 1;
  const runsScored  = secondInnings.runs ?? 0;
  const runsNeeded  = target - runsScored;

  const totalOvers  = match.settings?.totalOvers ?? 20;
  const totalBalls  = totalOvers * 6;

  // Convert X.Y overs decimal → balls bowled
  const oversFloat  = parseFloat(secondInnings.overs ?? 0);
  const wholeOvers  = Math.floor(oversFloat);
  const ballsInOver = Math.round((oversFloat - wholeOvers) * 10);
  const ballsBowled = wholeOvers * 6 + ballsInOver;

  const ballsRemaining   = totalBalls - ballsBowled;
  const requiredRunRate  =
    ballsRemaining > 0
      ? ((runsNeeded / ballsRemaining) * 6).toFixed(2)
      : '–';

  return { runsNeeded, ballsRemaining, requiredRunRate };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpectatorView({ initialMatch, matchId }) {
  const [match, setMatch] = useState(initialMatch);

  // Safety net — page.jsx should guard this, but just in case
  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="opacity-70">Match data unavailable.</p>
      </div>
    );
  }

  // --- Refetch full match state from the existing GET route ---
  const refetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/match/${matchId}`, { cache: 'no-store' });
      if (!res.ok) return; // transient blip — next Pusher event will retry
      const data = await res.json();
      setMatch(data.match);
    } catch {
      // Network error — skip silently, next event will catch us up
    }
  }, [matchId]);

  // --- Live updates via Pusher (replaces Phase 5's 5s polling) ---
  usePusherChannel(`match-${matchId}`, {
    'match-update': () => {
      refetchMatch();
    },
  });

  // --- Derived data ---
  const isCompleted     = match.status === 'completed';
  const currentInnings  = getCurrentInnings(match);
  const battingTeamName = currentInnings
    ? (match.teams[currentInnings.battingTeam]?.name ?? 'Batting Team')
    : null;
  const currentOverBalls = getCurrentOverBalls(currentInnings);
  const chaseInfo        = getChaseInfo(match);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto min-h-screen max-w-2xl space-y-4 p-4 md:p-8">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {match.teams.teamA.name}
          <span className="mx-3 font-light opacity-40">vs</span>
          {match.teams.teamB.name}
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest opacity-50">
          {isCompleted ? 'Final' : 'Live'}
        </p>
      </div>

      {/* 1 — Main Scoreboard */}
      {currentInnings ? (
        <MainScorecard
          teamName={battingTeamName}
          runs={currentInnings.runs}
          wickets={currentInnings.wickets}
          overs={currentInnings.overs}
        />
      ) : (
        <div className="rounded-2xl bg-white/10 p-8 text-center opacity-60">
          Match hasn&apos;t started yet — waiting for the first ball.
        </div>
      )}

      {/* 2 — Over Ribbon (live) OR Result Banner (completed) */}
      {isCompleted ? (
        <ResultBanner result={match.result} />
      ) : (
        <OverTrackerRibbon balls={currentOverBalls} />
      )}

      {/* 3 — Chase Calculator (2nd innings only, while live) */}
      {!isCompleted && chaseInfo && (
        <ChaseCalculator chaseInfo={chaseInfo} />
      )}

      {/* 4 — Stat Tables (live, current innings only) OR Full Scorecard
             (completed, both innings, every player) */}
      {isCompleted ? (
        <FullScorecard match={match} />
      ) : (
        currentInnings && (
          <div className="space-y-4">
            <BatsmenStatTable batsmen={currentInnings.batsmen ?? []} />
            <BowlerStatTable  bowlers={currentInnings.bowlers ?? []} />
          </div>
        )
      )}
    </div>
  );
}