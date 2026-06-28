import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Match from "@/models/Match";
import { generateMatchId, generateUmpireToken } from "@/lib/generateIds";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      teamAName,
      teamAPlayers,
      teamBName,
      teamBPlayers,
      totalOvers,
      lastBatsmanStanding,
      tossWinner,
      tossDecision,
    } = body;

    const cleanedTeamAPlayers = Array.isArray(teamAPlayers)
      ? teamAPlayers.map((p) => p.trim()).filter((p) => p !== "")
      : [];
    const cleanedTeamBPlayers = Array.isArray(teamBPlayers)
      ? teamBPlayers.map((p) => p.trim()).filter((p) => p !== "")
      : [];

    if (cleanedTeamAPlayers.length < 2) {
      return NextResponse.json(
        { error: "Team A needs at least 2 players." },
        { status: 400 }
      );
    }

    if (cleanedTeamBPlayers.length < 2) {
      return NextResponse.json(
        { error: "Team B needs at least 2 players." },
        { status: 400 }
      );
    }

    if (cleanedTeamAPlayers.length !== cleanedTeamBPlayers.length) {
      return NextResponse.json(
        { error: "Both teams must have the same number of players." },
        { status: 400 }
      );
    }

    if (!totalOvers || Number(totalOvers) < 1) {
      return NextResponse.json(
        { error: "Total overs must be a positive number." },
        { status: 400 }
      );
    }

    if (!tossWinner || !tossDecision) {
      return NextResponse.json(
        { error: "Toss winner and decision are required." },
        { status: 400 }
      );
    }

    const finalTeamAName =
      teamAName && teamAName.trim() !== "" ? teamAName.trim() : "Team 1";
    const finalTeamBName =
      teamBName && teamBName.trim() !== "" ? teamBName.trim() : "Team 2";

    // Wickets to fall = player count - 1 (shared, since both teams have equal players)
    const totalWickets = cleanedTeamAPlayers.length - 1;

    await dbConnect();

    const matchId = generateMatchId();
    const umpireToken = generateUmpireToken();

    const newMatch = await Match.create({
      matchId,
      umpireToken,
      status: "setup",
      teams: {
        teamA: { name: finalTeamAName, players: cleanedTeamAPlayers },
        teamB: { name: finalTeamBName, players: cleanedTeamBPlayers },
      },
      settings: {
        totalOvers: Number(totalOvers),
        totalWickets,
        lastBatsmanStanding: Boolean(lastBatsmanStanding),
      },
      toss: {
        winner: tossWinner,
        decision: tossDecision,
      },
      innings: [],
      result: null,
    });

    return NextResponse.json(
      { matchId: newMatch.matchId, umpireToken: newMatch.umpireToken },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Failed to create match." },
      { status: 500 }
    );
  }
}