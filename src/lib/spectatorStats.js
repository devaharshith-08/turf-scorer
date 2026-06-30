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

/**
 * Returns "how out" display text for a single batsman in a single innings,
 * derived from the innings' ball log — the schema doesn't store a
 * standalone "howOut" field on the batsmen sub-array, so this is
 * reconstructed from the wicket-taking ball itself.
 *
 * Looks for the ball where isWicket === true AND batsmanOnStrike === name.
 * Note: this assumes at most one wicket ball per batsman per innings,
 * which is always true (a batsman is out once and only once).
 *
 * Returns "not out" if the batsman's isOut flag is false.
 * Returns "did not bat" if somehow no batting record exists (defensive —
 * should not normally happen since this is only called for entries
 * already present in innings.batsmen).
 */
function getHowOutText(innings, batsmanEntry) {
  if (!batsmanEntry) return 'did not bat';
  if (!batsmanEntry.isOut) return 'not out';

  const wicketBall = innings.balls.find(
    (ball) => ball.isWicket && ball.batsmanOnStrike === batsmanEntry.name
  );

  if (!wicketBall) {
    // isOut is true but no matching ball found — defensive fallback,
    // shouldn't happen if ball log and batsmen array stay in sync.
    return 'out';
  }

  switch (wicketBall.dismissal) {
    case 'bowled':
      return `b ${wicketBall.bowler}`;
    case 'caught':
      return `c b ${wicketBall.bowler}`;
    case 'runout':
      return 'Run Out';
    default:
      return 'out';
  }
}

/**
 * Counts 4s and 6s a given batsman hit during this innings, by scanning
 * the ball log. Only counts balls of type 'run' (i.e. excludes wide,
 * noball, legbye, bye, wicket balls) where batsmanOnStrike matches and
 * runs is exactly 4 or 6 — matching how boundaries are actually scored
 * off the bat (per the PRD addendum, runs off no-balls/extras are NOT
 * credited to the batsman's personal tally).
 *
 * Returns { fours, sixes }.
 */
function countBoundaries(innings, name) {
  let fours = 0;
  let sixes = 0;

  for (const ball of innings.balls) {
    if (ball.type === 'run' && ball.batsmanOnStrike === name) {
      if (ball.runs === 4) fours += 1;
      else if (ball.runs === 6) sixes += 1;
    }
  }

  return { fours, sixes };
}

/**
 * Builds the full post-match scorecard for one or more innings — every
 * batsman who batted (out or not out) with runs/balls/4s/6s/SR/howOut,
 * and every bowler with full figures + economy.
 *
 * This is a pure read/derive function: it does NOT require any new
 * schema fields. Fours, sixes, and dismissal text are all reconstructed
 * from the existing `balls` array; everything else comes straight off
 * the existing `batsmen` / `bowlers` sub-arrays.
 *
 * @param {Array} inningsArray - match.innings (array of 1 or 2 innings)
 * @returns {Array} one scorecard object per innings:
 *   {
 *     battingTeam: string,
 *     runs: number,
 *     wickets: number,
 *     overs: number,
 *     batting: [{ name, runs, balls, fours, sixes, strikeRate, howOut }],
 *     bowling: [{ name, overs, maidens, runsConceded, wickets, economy }],
 *   }
 */
export function getFullScorecard(inningsArray) {
  if (!Array.isArray(inningsArray)) return [];

  return inningsArray.map((innings) => {
    const batting = innings.batsmen.map((b) => {
      const { fours, sixes } = countBoundaries(innings, b.name);
      return {
        name: b.name,
        runs: b.runs,
        balls: b.balls,
        fours,
        sixes,
        strikeRate: getStrikeRate(b.runs, b.balls),
        howOut: getHowOutText(innings, b),
      };
    });

    const bowling = innings.bowlers.map((bw) => ({
      name: bw.name,
      overs: bw.overs,
      maidens: bw.maidens,
      runsConceded: bw.runsConceded,
      wickets: bw.wickets,
      economy: getEconomy(bw.runsConceded, bw.overs),
    }));

    return {
      battingTeam: innings.battingTeam,
      runs: innings.runs,
      wickets: innings.wickets,
      overs: innings.overs,
      batting,
      bowling,
    };
  });
}