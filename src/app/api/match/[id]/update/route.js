// src/app/api/match/[id]/update/route.js
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import {
  applyBallToInnings,
  recomputeInningsFromBalls,
  isInningsComplete,
} from '@/lib/scoringLogic';
import { triggerMatchUpdate, triggerGlobalUpdate } from '@/lib/pusherServer';

const VALID_EVENT_TYPES = ['run', 'wide', 'noball', 'legbye', 'wicket', 'undo'];

function getFirstBattingTeam(toss) {
  if (toss.decision === 'bat') return toss.winner;
  return toss.winner === 'teamA' ? 'teamB' : 'teamA';
}

function otherTeam(team) {
  return team === 'teamA' ? 'teamB' : 'teamA';
}

function createEmptyInnings(battingTeam) {
  return {
    battingTeam,
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: [],
    batsmen: [],
    bowlers: [],
  };
}

function computeResult(match) {
  const [innings1, innings2] = match.innings;
  const team1Name = match.teams[innings1.battingTeam].name;
  const team2Name = match.teams[innings2.battingTeam].name;

  if (innings2.runs > innings1.runs) {
    // Chasing team won - report margin as wickets in hand.
    const wicketsInHand = match.settings.totalWickets - innings2.wickets;
    return `${team2Name} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? '' : 's'}`;
  }

  if (innings1.runs > innings2.runs) {
    const margin = innings1.runs - innings2.runs;
    return `${team1Name} won by ${margin} run${margin === 1 ? '' : 's'}`;
  }

  return 'Match tied';
}

export async function POST(request, { params }) {
  const { id: matchId } = await params;
  const body = await request.json();
  const { umpireToken, events } = body;

  if (!umpireToken || !Array.isArray(events)) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  await dbConnect();

  const match = await Match.findOne({ matchId });
  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.umpireToken !== umpireToken) {
    return Response.json({ error: 'Invalid umpire token' }, { status: 401 });
  }

  if (match.status === 'completed') {
    return Response.json({ error: 'Match already completed' }, { status: 400 });
  }

  // Capture status before any mutation below, so we know after saving
  // whether a global (dashboard) broadcast is needed.
  const statusBeforeThisRequest = match.status;

  // Phase 2 saves innings: [] at match creation - lazily create innings[0]
  // here on the very first ball, using the toss to decide who bats first.
  if (match.innings.length === 0) {
    const firstBattingTeam = getFirstBattingTeam(match.toss);
    match.innings.push(createEmptyInnings(firstBattingTeam));
  }

  if (match.status === 'setup') {
    match.status = 'live';
  }

  const appliedSequenceIds = [];
  const rejectedEvents = [];
  let inningsJustCompleted = false;

  for (const event of events) {
    if (!VALID_EVENT_TYPES.includes(event.type)) {
      rejectedEvents.push({ sequenceId: event.sequenceId, reason: 'invalid type' });
      continue;
    }

    const currentInningsDoc = match.innings[match.innings.length - 1];
    const inningsObj = currentInningsDoc.toObject();

    // Dedupe: if this sequenceId was already applied in a previous request,
    // tell the client it's safe to drop it, but don't apply it again.
    const alreadyExists = inningsObj.balls.some((b) => b.sequenceId === event.sequenceId);
    if (alreadyExists) {
      appliedSequenceIds.push(event.sequenceId);
      continue;
    }

    if (event.type === 'undo') {
      if (inningsObj.balls.length === 0) {
        // Nothing to undo - acknowledge so client clears it from queue
        // instead of retrying forever.
        appliedSequenceIds.push(event.sequenceId);
        continue;
      }
      inningsObj.balls.pop();
      const recomputed = recomputeInningsFromBalls(inningsObj);
      match.innings[match.innings.length - 1] = recomputed;
      match.markModified('innings');
      appliedSequenceIds.push(event.sequenceId);
      continue;
    }

    const updatedInnings = applyBallToInnings(inningsObj, event);
    match.innings[match.innings.length - 1] = updatedInnings;
    match.markModified('innings');
    appliedSequenceIds.push(event.sequenceId);

    const battingTeamKey = updatedInnings.battingTeam;
    const totalPlayersOnBattingTeam = match.teams[battingTeamKey].players.length;
    const complete = isInningsComplete(
      updatedInnings,
      match.settings,
      totalPlayersOnBattingTeam
    );

    if (complete) {
      inningsJustCompleted = true;
      break; // Stop here - remaining events in this batch are dropped,
      // per the confirmed "innings ends mid-batch" behavior.
    }
  }

  if (inningsJustCompleted) {
    if (match.innings.length === 1) {
      const secondBattingTeam = otherTeam(match.innings[0].battingTeam);
      match.innings.push(createEmptyInnings(secondBattingTeam));
      match.markModified('innings');
    } else {
      match.status = 'completed';
      match.result = computeResult(match);
    }
  }

  await match.save();

  // Broadcast to anyone watching this specific match
  // (spectator view + umpire panel on another device, if any).
  const currentInnings = match.innings[match.innings.length - 1];
  const matchUpdatePayload = {
    matchId: match.matchId,
    status: match.status,
    innings: {
      battingTeam: currentInnings.battingTeam,
      runs: currentInnings.runs,
      wickets: currentInnings.wickets,
      overs: currentInnings.overs,
      lastBall: currentInnings.balls[currentInnings.balls.length - 1] || null,
    },
    inningsJustCompleted,
    result: match.result,
  };
  await triggerMatchUpdate(matchId, matchUpdatePayload);

  // Only broadcast to the dashboard if status actually changed this request -
  // not on every single ball, per the PRD's sync flow.
  const statusChanged = match.status !== statusBeforeThisRequest;
  if (statusChanged) {
    await triggerGlobalUpdate({
      matchId: match.matchId,
      status: match.status,
      teamAName: match.teams.teamA.name,
      teamBName: match.teams.teamB.name,
      result: match.result,
    });
  }

  return Response.json({
    match,
    appliedSequenceIds,
    rejectedEvents,
    inningsJustCompleted,
  });
}