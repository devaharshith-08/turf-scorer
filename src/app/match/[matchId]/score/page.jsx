// src/app/match/[matchId]/score/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ScoringGrid from '@/components/umpire/ScoringGrid';
import NewBatsmanModal from '@/components/umpire/NewBatsmanModal';
import NewOverModal from '@/components/umpire/NewOverModal';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { applyBallToInnings, recomputeInningsFromBalls, isInningsComplete } from '@/lib/scoringLogic';

// ─── Reconstruction (mid-innings refresh) ─────────────────────────────────────
// Rebuilds on-strike / non-strike / bowler from ball history after a refresh.
// Returns null if there's nothing to reconstruct from (fresh innings, 0 balls).
//
// KNOWN LIMITATION (logged in project notes): if the last ball ended an over,
// or the last ball was a wicket, ball history alone can't tell us the umpire's
// NEXT choice (next bowler, strike swap, replacement batsman) — those are
// re-prompted via modal rather than guessed.
function reconstructPlayingState(innings) {
  if (!innings || innings.balls.length === 0) return null;

  const lastBall = innings.balls[innings.balls.length - 1];
  const notOut = innings.batsmen.filter((b) => !b.isOut).map((b) => b.name);

  const ballsIntoOver = Math.round((innings.overs % 1) * 10);
  const overJustEnded =
    lastBall.type !== 'wide' &&
    lastBall.type !== 'noball' &&
    ballsIntoOver === 0 &&
    innings.overs > 0;

  // Last ball was a wicket: only one not-out batsman remains (or zero, if
  // last-batsman-standing kicked in), new batsman selection is pending.
  if (lastBall.isWicket) {
    return {
      onStrike: null, // pending — WicketModal will fill this in
      nonStrike: notOut[0] ?? null,
      bowler: lastBall.bowler,
      overJustEnded: false,
      lastBallWasWicket: true,
    };
  }

  // Normal case: figure out who's on strike for the NEXT ball, applying the
  // same odd-runs strike-rotation rule used live.
  let strikerName = lastBall.batsmanOnStrike;
  if (lastBall.type === 'run' && (lastBall.runs === 1 || lastBall.runs === 3)) {
    const other = notOut.find((n) => n !== strikerName);
    if (other) strikerName = other;
  }

  const onStrike = notOut.includes(strikerName) ? strikerName : notOut[0] ?? null;
  const nonStrike = notOut.find((n) => n !== onStrike) ?? null;

  return {
    onStrike,
    nonStrike,
    bowler: lastBall.bowler,
    overJustEnded,
    lastBallWasWicket: false,
  };
}

// ─── Over Timeline ────────────────────────────────────────────────────────────
function OverTimeline({ innings }) {
  if (!innings) return null;

  const wholeOvers = Math.floor(innings.overs);
  const ballsInCurrentOver = Math.round((innings.overs % 1) * 10);

  const currentOverBalls = [];
  let legalCount = 0;
  for (let i = innings.balls.length - 1; i >= 0; i--) {
    const b = innings.balls[i];
    currentOverBalls.unshift(b);
    if (b.type !== 'wide' && b.type !== 'noball') {
      legalCount++;
      if (legalCount === ballsInCurrentOver) break;
    }
  }

  function ballLabel(ball) {
    if (ball.isWicket) return 'W';
    if (ball.type === 'wide') return 'Wd';
    if (ball.type === 'noball') return 'Nb';
    if (ball.type === 'legbye') return `${ball.runs}lb`;
    if (ball.runs === 0) return '•';
    return `${ball.runs}`;
  }

  function ballColor(ball) {
    if (ball.isWicket) return 'bg-red-600 text-white';
    if (ball.type === 'wide' || ball.type === 'noball') return 'bg-blue-600 text-white';
    if (ball.runs === 4 || ball.runs === 6) return 'bg-green-600 text-white';
    return 'bg-gray-600 text-white';
  }

  return (
    <div className="my-3 p-3 rounded-lg bg-gray-900 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        Over {wholeOvers + 1}
      </p>
      <div className="flex gap-2 flex-wrap">
        {currentOverBalls.length === 0 ? (
          <span className="text-gray-500 text-sm">No balls bowled yet</span>
        ) : (
          currentOverBalls.map((ball, i) => (
            <span
              key={ball.sequenceId || i}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold ${ballColor(ball)}`}
            >
              {ballLabel(ball)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Batsmen Panel ────────────────────────────────────────────────────────────
// FIXED: no longer requires `innings` to exist before rendering. Names alone
// (onStrike/nonStrike from opener selection) are enough to show the panel —
// stats just default to 0/0 until the innings object exists server-side.
function BatsmenPanel({ innings, onStrike, nonStrike }) {
  if (!onStrike && !nonStrike) return null;

  function getStats(name) {
    const b = innings?.batsmen?.find((b) => b.name === name);
    return b ? { runs: b.runs, balls: b.balls } : { runs: 0, balls: 0 };
  }

  const sr = (runs, balls) => (balls === 0 ? '0.0' : ((runs / balls) * 100).toFixed(1));

  const players = [
    { name: onStrike, isStrike: true },
    { name: nonStrike, isStrike: false },
  ].filter(({ name }) => !!name); // only render rows where name exists

  return (
    <div className="my-3 p-3 rounded-lg bg-gray-900 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Batsmen</p>
      <div className="grid grid-cols-4 text-xs text-gray-400 mb-1 px-1">
        <span>Name</span>
        <span className="text-right">R</span>
        <span className="text-right">B</span>
        <span className="text-right">SR</span>
      </div>
      {players.map(({ name, isStrike }) => {
        const stats = getStats(name);
        return (
          <div key={name} className="grid grid-cols-4 py-1 px-1 rounded text-sm font-medium">
            <span className="flex items-center gap-1 text-white">
              {isStrike && <span className="text-yellow-400">⭐</span>}
              {name}
            </span>
            <span className="text-right text-white font-bold">{stats.runs}</span>
            <span className="text-right text-gray-300">{stats.balls}</span>
            <span className="text-right text-gray-400">{sr(stats.runs, stats.balls)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bowler Panel ─────────────────────────────────────────────────────────────
// FIXED: no longer requires `innings` to exist before rendering — same issue
// and same fix as BatsmenPanel above.
function BowlerPanel({ innings, bowler }) {
  if (!bowler) return null;

  const b = innings?.bowlers?.find((b) => b.name === bowler);
  const overs = b ? b.overs.toFixed(1) : '0.0';
  const runs = b ? b.runsConceded : 0;
  const wickets = b ? b.wickets : 0;

  return (
    <div className="my-3 p-3 rounded-lg bg-gray-900 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Bowler</p>
      <div className="grid grid-cols-4 text-xs text-gray-400 mb-1 px-1">
        <span>Name</span>
        <span className="text-right">O</span>
        <span className="text-right">R</span>
        <span className="text-right">W</span>
      </div>
      <div className="grid grid-cols-4 py-1 px-1 text-sm font-medium">
        <span className="text-white">{bowler}</span>
        <span className="text-right text-gray-300">{overs}</span>
        <span className="text-right text-white font-bold">{runs}</span>
        <span className="text-right text-red-400 font-bold">{wickets}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScorePage() {
  const { matchId } = useParams();
  const { isOnline, pendingCount, enqueueEvent } = useOfflineSync(matchId);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [onStrike, setOnStrike] = useState(null);
  const [nonStrike, setNonStrike] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [openersConfirmed, setOpenersConfirmed] = useState(false);

  const [showOpenerModal, setShowOpenerModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showOverModal, setShowOverModal] = useState(false);
  const [inningsEnded, setInningsEnded] = useState(false);
  const [inningsBreak, setInningsBreak] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    async function loadMatch() {
      try {
        const res = await fetch(`/api/match/${matchId}`);
        const data = await res.json();
        const matchData = data.match || data;
        setMatch(matchData);
      } catch (err) {
        console.error('Failed to load match', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [matchId]);

  // ── Opener selection (fresh innings) OR reconstruction (refresh mid-innings) ──
  useEffect(() => {
    if (!match) return;
    if (openersConfirmed) return; // don't re-trigger once openers/state are set

    const innings = match.innings?.[match.innings.length - 1];

    // Case 1: fresh innings, zero balls bowled — real opener selection needed.
    if (!innings || innings.balls.length === 0) {
      if (!onStrike || !nonStrike || !bowler) {
        setShowOpenerModal(true);
      }
      return;
    }

    // Case 2: mid-innings refresh — balls already exist but local state is
    // empty (onStrike/nonStrike/bowler all null because this is a fresh page
    // load). Rebuild from ball history instead of wrongly asking for openers.
    if (!onStrike && !nonStrike && !bowler) {
      const state = reconstructPlayingState(innings);
      if (!state) return;

      setOnStrike(state.onStrike);
      setNonStrike(state.nonStrike);
      setBowler(state.bowler);
      setOpenersConfirmed(true);

      // Can't safely auto-resolve these two cases from ball history alone —
      // re-prompt the umpire instead of guessing wrong.
      if (state.lastBallWasWicket) {
        setShowWicketModal(true);
      } else if (state.overJustEnded) {
        setShowOverModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  function currentInnings() {
    if (!match || !match.innings || match.innings.length === 0) return null;
    return match.innings[match.innings.length - 1];
  }

  function battingTeamPlayers() {
    const innings = currentInnings();
    const battingTeamKey = innings ? innings.battingTeam : match.toss?.winner;
    if (!battingTeamKey) return [];
    return match.teams[battingTeamKey]?.players ?? [];
  }

  function bowlingTeamPlayers() {
    const innings = currentInnings();
    const battingTeamKey = innings ? innings.battingTeam : match.toss?.winner;
    if (!battingTeamKey) return [];
    const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
    return match.teams[bowlingTeamKey]?.players ?? [];
  }

  // Polls server every 800ms until innings 2 exists or match is completed.
  async function pollUntilInningsTransition() {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 800));
      try {
        const res = await fetch(`/api/match/${matchId}`);
        const freshData = await res.json();
        const freshMatch = freshData.match || freshData;

        if (freshMatch.innings.length > 1 || freshMatch.status === 'completed') {
          setMatch(freshMatch);
          setInningsEnded(false);
          setOpenersConfirmed(false); // allow opener modal for 2nd innings
          if (freshMatch.status === 'completed') {
            setMatchResult(freshMatch.result);
          } else {
            setInningsBreak(true);
          }
          return;
        }
      } catch {
        // network blip - keep polling
      }
    }
  }

  const handleScore = useCallback(
    async (eventPartial) => {
      if (!match || !onStrike || !bowler) return;

      let innings = currentInnings();

      // First ball of the match — innings doesn't exist on server yet, create locally.
      if (!innings) {
        const battingTeamKey = match.toss?.winner;
        innings = {
          battingTeam: battingTeamKey,
          balls: [],
          runs: 0,
          wickets: 0,
          overs: 0,
          batsmen: [],
          bowlers: [],
        };
      }

      const fullEvent = { ...eventPartial, batsmanOnStrike: onStrike, bowler };
      const sequenceId = crypto.randomUUID();

      const inningsCopy = JSON.parse(JSON.stringify(innings));
      const updatedInnings = applyBallToInnings(inningsCopy, { ...fullEvent, sequenceId });

      const newInningsArray = [...(match.innings ?? [])];
      if (newInningsArray.length === 0) {
        newInningsArray.push(updatedInnings);
      } else {
        newInningsArray[newInningsArray.length - 1] = updatedInnings;
      }

      setMatch({ ...match, innings: newInningsArray });

      // Strike rotation
      if (eventPartial.type === 'run' && (eventPartial.runs === 1 || eventPartial.runs === 3)) {
        setOnStrike(nonStrike);
        setNonStrike(onStrike);
      }

      // Check locally if innings just ended
      const totalPlayersOnBattingTeam = match.teams[updatedInnings.battingTeam].players.length;
      const complete = isInningsComplete(updatedInnings, match.settings, totalPlayersOnBattingTeam);

      await enqueueEvent({ ...fullEvent, sequenceId });

      if (complete) {
        setInningsEnded(true);
        pollUntilInningsTransition();
        return;
      }

      // Over-completion check
      const isLegal = eventPartial.type !== 'wide' && eventPartial.type !== 'noball';
      if (isLegal) {
        const ballsIntoOver = Math.round((updatedInnings.overs % 1) * 10);
        if (ballsIntoOver === 0 && updatedInnings.overs > 0) {
          setShowOverModal(true);
        }
      }
    },
    [match, onStrike, nonStrike, bowler, enqueueEvent, matchId]
  );

  function handleWicketTap() {
    setShowWicketModal(true);
  }

  function handleWicketConfirmed({ dismissal, newBatsman }) {
    handleScore({ type: 'wicket', runs: 0, isWicket: true, dismissal });
    setOnStrike(newBatsman);
    setShowWicketModal(false);
  }

  function handleUndo() {
    const innings = currentInnings();
    if (!innings || innings.balls.length === 0) return;

    const sequenceId = crypto.randomUUID();
    enqueueEvent({ type: 'undo', sequenceId });

    const inningsCopy = JSON.parse(JSON.stringify(innings));
    inningsCopy.balls.pop();
    const recomputed = recomputeInningsFromBalls(inningsCopy);

    const newInningsArray = [...match.innings];
    newInningsArray[newInningsArray.length - 1] = recomputed;
    setMatch({ ...match, innings: newInningsArray });
    setInningsEnded(false);
  }

  // PHASE 8 — Manual abandon. Requires a confirm step (window.confirm) since
  // this ends the match irreversibly — no "undo" for abandonment the way
  // there is for a single ball. Goes through the same offline-aware
  // enqueueEvent path as every other write, so it's queued and synced
  // even if the umpire is offline when they tap it. UI flips to the
  // result screen immediately (optimistic) rather than waiting on sync.
  function handleAbandon() {
    const confirmed = window.confirm(
      'Abandon this match? This cannot be undone — the match will be marked as completed with result "Match Abandoned".'
    );
    if (!confirmed) return;

    const sequenceId = crypto.randomUUID();
    enqueueEvent({ type: 'abandon', sequenceId });

    setShowOpenerModal(false);
    setShowWicketModal(false);
    setShowOverModal(false);
    setInningsEnded(false);
    setInningsBreak(false);
    setMatchResult('Match Abandoned');
  }

  function handleOpenersConfirmed({ striker, nonStriker, bowler: chosenBowler }) {
    setOnStrike(striker);
    setNonStrike(nonStriker);
    setBowler(chosenBowler);
    setOpenersConfirmed(true);
    setShowOpenerModal(false);
  }

  function handleOverConfirmed({ nextBowler, swapStrike }) {
    setBowler(nextBowler);
    if (swapStrike) {
      setOnStrike(nonStrike);
      setNonStrike(onStrike);
    }
    setShowOverModal(false);
  }

  function handleStartSecondInnings() {
    setInningsBreak(false);
    setOnStrike(null);
    setNonStrike(null);
    setBowler(null);
    setOpenersConfirmed(false);
    setShowOpenerModal(true);
  }

  if (loading) return <div className="p-6 text-center">Loading match...</div>;
  if (!match) return <div className="p-6 text-center">Match not found.</div>;

  const innings = currentInnings();

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground) p-4">

      {/* ── Scoreboard header ── */}
      <div className="sticky top-0 bg-var(--background) z-10 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-wide text-red-500 font-bold">YOU ARE THE UMPIRE</p>
          {!matchResult && (
            <button
              onClick={handleAbandon}
              className="text-xs px-3 py-1.5 rounded border border-red-700 text-red-400 hover:bg-red-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              Abandon Match
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {innings ? `${innings.runs}/${innings.wickets}` : '0/0'}{' '}
          <span className="text-sm text-gray-400">
            {innings ? `ov ${innings.overs.toFixed(1)}` : 'ov 0.0'}
          </span>
        </h1>
        <p className="text-xs text-gray-400">
          {isOnline ? 'Online' : 'Offline'}{' '}
          {pendingCount > 0 && `· ${pendingCount} pending sync`}
        </p>
      </div>

      {/* ── Batsmen panel ── */}
      <BatsmenPanel innings={innings} onStrike={onStrike} nonStrike={nonStrike} />

      {/* ── Bowler panel ── */}
      <BowlerPanel innings={innings} bowler={bowler} />

      {/* ── Over timeline ── */}
      <OverTimeline innings={innings} />

      {/* ── Main area ── */}
      {matchResult ? (
        <div className="p-6 rounded-lg bg-green-900 text-green-100 text-center mt-4">
          <p className="text-xs uppercase tracking-wide text-green-400 mb-1">Match Result</p>
          <p className="text-2xl font-bold">{matchResult}</p>
        </div>

      ) : inningsBreak ? (
        <div className="p-6 rounded-lg bg-blue-900 text-blue-100 text-center mt-4">
          <p className="text-xs uppercase tracking-wide text-blue-400 mb-2">Innings Break</p>
          {match.innings[0] && (
            <>
              <p className="text-xl font-bold mb-1">
                {match.teams[match.innings[0].battingTeam].name} scored{' '}
                {match.innings[0].runs}/{match.innings[0].wickets}
              </p>
              <p className="text-sm text-blue-300 mb-4">
                Target: {match.innings[0].runs + 1} runs
              </p>
            </>
          )}
          <button
            onClick={handleStartSecondInnings}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg"
          >
            Start 2nd Innings
          </button>
        </div>

      ) : inningsEnded ? (
        <div className="p-4 rounded bg-yellow-900 text-yellow-200 text-center">
          Innings complete — syncing with server...
        </div>

      ) : (
        <ScoringGrid
          onScore={handleScore}
          onWicketTap={handleWicketTap}
          onUndo={handleUndo}
          disabled={!onStrike || !bowler}
        />
      )}

      {/* ── Modals ── */}
      {showOpenerModal && (
        <NewBatsmanModal
          mode="openers"
          battingPlayers={battingTeamPlayers()}
          bowlingPlayers={bowlingTeamPlayers()}
          onConfirm={handleOpenersConfirmed}
        />
      )}

      {showWicketModal && innings && (
        <NewBatsmanModal
          mode="replacement"
          battingPlayers={battingTeamPlayers().filter(
            (p) => !innings.batsmen.some((b) => b.name === p && b.isOut) && p !== nonStrike
          )}
          onConfirm={handleWicketConfirmed}
        />
      )}

      {showOverModal && (
        <NewOverModal
          bowlingPlayers={bowlingTeamPlayers()}
          currentBowler={bowler}
          onConfirm={handleOverConfirmed}
        />
      )}
    </div>
  );
}