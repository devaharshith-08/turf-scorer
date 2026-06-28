// src/lib/spectatorStats.js
//
// Pure, framework-agnostic helper functions for the Spectator View
// (Phase 5). No React, no Mongoose, no fetch — just shaping/derived data
// from a match document for display.

import { legalBallsFromOvers } from './scoringLogic';

/**
 * Returns the slice of `innings.balls` that belong to the over currently
 * in progress (i.e. the over the Over Tracker Ribbon should display).
 *
 * Walks backward from the end of the balls array, collecting balls until
 * 6 LEGAL balls have been seen (wide/noball don't count toward that 6,
 * but they DO still appear in the ribbon for that over).
 *
 * Returns [] if innings is missing/empty or has no balls yet (e.g. right
 * after match creation, before the first ball is bowled).
 */
export function getCurrentOverBalls(innings) {
  if (!innings || !Array.isArray(innings.balls) || innings.balls.length === 0) {
    return [];
  }

  const isLegal = (ball) => ball.type !== 'wide' && ball.type !== 'noball';

  const totalLegal = innings.balls.filter(isLegal).length;
  if (totalLegal === 0) {
    // No legal balls bowled yet (e.g. only wides/no-balls so far this
    // innings) — still show whatever has happened, just no "completed
    // over" boundary to slice against yet. Fall back to the whole array.
    return innings.balls;
  }

  // How many legal balls belong to the over currently being displayed.
  // If totalLegal is an exact multiple of 6, the most recent over just
  // completed (the next ball hasn't started a new over yet) — show that
  // just-completed over (6 legal balls) rather than an empty ribbon.
  const inOverLegal = totalLegal % 6;
  const targetLegal = inOverLegal === 0 ? 6 : inOverLegal;

  const result = [];
  let legalCollected = 0;

  for (let i = innings.balls.length - 1; i >= 0; i--) {
    const ball = innings.balls[i];
    const legal = isLegal(ball);

    if (legal && legalCollected === targetLegal) {
      // Already have the full target's worth of legal balls — this ball
      // belongs to the PREVIOUS over, stop here.
      break;
    }

    result.unshift(ball);

    if (legal) {
      legalCollected += 1;
    }
  }

  return result;
}

/**
 * Converts a count of legal balls into the "5.2" decimal over notation
 * used for display. This is the inverse of legalBallsFromOvers — it does
 * NOT need to import anything from scoringLogic since it's just notation
 * formatting, not game-state math.
 */
export function formatOvers(legalBallCount) {
  const wholeOvers = Math.floor(legalBallCount / 6);
  const ballsIntoOver = legalBallCount % 6;
  return `${wholeOvers}.${ballsIntoOver}`;
}

/**
 * Computes chase-calculator info for the 2nd innings.
 *
 * Returns null if:
 * - innings2 doesn't exist yet (still in 1st innings), OR
 * - innings2 has already reached its overs/wickets limit (chase is over —
 *   the Result Banner should take over display at that point, not this).
 *
 * Otherwise returns: { target, runsNeeded, ballsRemaining, requiredRunRate }
 */
export function getChaseInfo(innings1, innings2, totalOvers) {
  if (!innings1 || !innings2) {
    return null;
  }

  const target = innings1.runs + 1;
  const runsNeeded = target - innings2.runs;

  const legalBallsBowled = legalBallsFromOvers(innings2.overs);
  const totalLegalBalls = totalOvers * 6;
  const ballsRemaining = totalLegalBalls - legalBallsBowled;

  // Chase already decided (overs used up, or target already reached) —
  // let the Result Banner handle display instead of the calculator.
  if (ballsRemaining <= 0 || runsNeeded <= 0) {
    return null;
  }

  const requiredRunRate = runsNeeded / (ballsRemaining / 6);

  return {
    target,
    runsNeeded,
    ballsRemaining,
    requiredRunRate: Math.round(requiredRunRate * 100) / 100,
  };
}

/**
 * Strike rate for a batsman: runs per 100 balls faced, rounded to 1 decimal.
 * Returns 0 if no balls faced yet (avoids divide-by-zero / NaN in the UI).
 */
export function getStrikeRate(runs, balls) {
  if (!balls) return 0;
  return Math.round((runs / balls) * 1000) / 10;
}

/**
 * Economy rate for a bowler: runs conceded per over, rounded to 2 decimals.
 * `overs` is the decimal-notation field straight from bowlers[].overs
 * (e.g. 3.4), so it's converted to legal-ball count first via
 * legalBallsFromOvers before dividing — dividing by the raw decimal would
 * silently produce a wrong number (3.4 overs is 22 balls, not "3.4 balls").
 * Returns 0 if no legal balls bowled yet.
 */
export function getEconomy(runsConceded, overs) {
  const legalBalls = legalBallsFromOvers(overs);
  if (!legalBalls) return 0;

  const oversBowled = legalBalls / 6;
  return Math.round((runsConceded / oversBowled) * 100) / 100;
}