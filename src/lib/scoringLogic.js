// src/lib/scoringLogic.js
//
// Pure, framework-agnostic functions. No React, no Mongoose, no fetch.
// These are called from BOTH the client (optimistic UI update) and the
// server (POST /api/match/[id]/update) so the math is always identical.

/**
 * Ball types that count toward the legal 6-ball over.
 * Wide and No Ball do NOT count (PRD Page 3 "Core Logic").
 */
function isLegalBall(type) {
  return type !== 'wide' && type !== 'noball';
}

function getOrCreateBatsman(batsmen, name) {
  let batsman = batsmen.find((b) => b.name === name);
  if (!batsman) {
    batsman = { name, runs: 0, balls: 0, isOut: false };
    batsmen.push(batsman);
  }
  return batsman;
}

function getOrCreateBowler(bowlers, name) {
  let bowler = bowlers.find((b) => b.name === name);
  if (!bowler) {
    bowler = { name, overs: 0, maidens: 0, runsConceded: 0, wickets: 0 };
    bowlers.push(bowler);
  }
  return bowler;
}

/**
 * Overs are stored as a decimal like 5.2, meaning "5 completed overs + 2
 * legal balls into the 6th". This increments that decimal by one legal ball,
 * rolling over to the next whole over once 6 legal balls are reached.
 */
function incrementOvers(overs, legalBallBowled) {
  if (!legalBallBowled) return overs;

  let wholeOvers = Math.floor(overs);
  let ballsInOver = Math.round((overs - wholeOvers) * 10);

  ballsInOver += 1;
  if (ballsInOver === 6) {
    wholeOvers += 1;
    ballsInOver = 0;
  }
  return wholeOvers + ballsInOver / 10;
}

/**
 * PHASE 7 — Free Hit detection.
 */
export function isFreeHit(previousBall) {
  return !!previousBall && previousBall.type === 'noball';
}

/**
 * PHASE 7 — Free Hit dismissal guard.
 */
export function isDismissalAllowedOnFreeHit(dismissalType) {
  return dismissalType === 'runout';
}

/**
 * PHASE 7 — Bowler no-repeat rule.
 */
export function getEligibleBowlers(players, previousOverBowler) {
  const eligible = players.filter((name) => name !== previousOverBowler);
  if (eligible.length === 0) {
    return players;
  }
  return eligible;
}

/**
 * Applies ONE ball event to an innings object, mutating and returning it.
 *
 * event shape (matches PRD §4 ball schema):
 * { sequenceId, type, runs, isWicket, dismissal, batsmanOnStrike, nonStriker, bowler }
 *
 * BUGFIX (Bug 1): `nonStriker` is now part of the event. Both batsmen are
 * registered in innings.batsmen[] as soon as they're part of a ball event
 * (not just whoever faces it), and innings.onStrike / innings.nonStriker
 * are persisted so any client can read current strike state directly.
 */
export function applyBallToInnings(innings, event) {
  const {
    sequenceId,
    type,
    runs = 0,
    isWicket = false,
    dismissal = null,
    batsmanOnStrike,
    nonStriker = null,
    bowler,
  } = event;

  // Dedupe guard - safe to call this even though the API route also checks.
  const alreadyApplied = innings.balls.some((b) => b.sequenceId === sequenceId);
  if (alreadyApplied) {
    return innings;
  }

  const legalBall = isLegalBall(type);

  // PHASE 7 — work out Free Hit status from the ball that came before this
  // one, BEFORE we push the new ball onto innings.balls.
  const previousBall = innings.balls[innings.balls.length - 1] || null;
  const freeHit = isFreeHit(previousBall);

  // --- Team totals ---
  innings.runs += runs;
  if (isWicket) innings.wickets += 1;
  innings.overs = incrementOvers(innings.overs, legalBall);

  // --- Batsman stats ---
  const batsman = getOrCreateBatsman(innings.batsmen, batsmanOnStrike);
  if (type !== 'wide') {
    batsman.balls += 1;
  }
  if (type === 'run') {
    batsman.runs += runs;
  }
  if (isWicket) {
    batsman.isOut = true;
  }

  // BUGFIX (Bug 1): register the non-striker too, so they exist in
  // batsmen[] even before they personally face a ball. No stat increments —
  // just ensures they show up in spectator/umpire views.
  if (nonStriker) {
    getOrCreateBatsman(innings.batsmen, nonStriker);
  }

  // BUGFIX (Bug 1): persist current strike state on the innings itself.
  innings.onStrike = batsmanOnStrike;
  innings.nonStriker = nonStriker;

  // --- Bowler stats ---
  const bowlerStat = getOrCreateBowler(innings.bowlers, bowler);
  if (legalBall) {
    bowlerStat.overs = incrementOvers(bowlerStat.overs, true);
  }
  if (type !== 'legbye' && type !== 'bye') {
    bowlerStat.runsConceded += runs;
  }
  if (isWicket && dismissal !== 'runout') {
    bowlerStat.wickets += 1;
  }

  // --- Append to ball-by-ball history (source of truth) ---
  innings.balls.push({
    sequenceId,
    type,
    runs,
    isWicket,
    isFreeHit: freeHit,
    dismissal,
    batsmanOnStrike,
    nonStriker,
    bowler,
  });

  return innings;
}

/**
 * Rebuilds an innings completely from its balls[] array.
 */
export function recomputeInningsFromBalls(innings) {
  const originalBalls = innings.balls;

  const rebuilt = {
    ...innings,
    runs: 0,
    wickets: 0,
    overs: 0,
    onStrike: null,
    nonStriker: null,
    batsmen: [],
    bowlers: [],
    balls: [],
  };

  for (const ball of originalBalls) {
    applyBallToInnings(rebuilt, ball);
  }

  return rebuilt;
}

export function legalBallsFromOvers(overs) {
  const wholeOvers = Math.floor(overs);
  const ballsIntoOver = Math.round((overs % 1) * 10);
  return wholeOvers * 6 + ballsIntoOver;
}

export function isInningsComplete(innings, settings, totalPlayersOnBattingTeam) {
  const legalBallsBowled = legalBallsFromOvers(innings.overs);
  const oversLimitReached = legalBallsBowled >= settings.totalOvers * 6;

  const wicketsLimitReached = settings.lastBatsmanStanding
    ? innings.wickets >= totalPlayersOnBattingTeam
    : innings.wickets >= settings.totalWickets;

  return oversLimitReached || wicketsLimitReached;
}