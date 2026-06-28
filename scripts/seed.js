// scripts/seed.js

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import connectDb from "../src/lib/dbConnect.js";
import Match from "../src/models/Match.js";

async function seed() {
  await connectDb();

  // Wipe out any previous seed data so re-running this script is safe
  await Match.deleteMany({ matchId: { $in: [
    "seed-live-1", "seed-live-2", "seed-completed-1", "seed-completed-2"
  ]}});

  const liveMatches = [
    {
      matchId: "seed-live-1",
      umpireToken: "fake-token-1",
      status: "live",
      teams: {
        teamA: { name: "Titans" },
        teamB: { name: "Warriors" },
      },
      settings: {
        totalOvers: 8,
        totalWickets: 8,
        roofNetRule: false,
        lastBatsmanStanding: false,
      },
      toss: {
        winner: "teamA",
        decision: "bat",
      },
      innings: [
        {
          battingTeam: "teamA",
          runs: 45,
          wickets: 2,
          overs: 3.4,
          balls: [],
          batsmen: [
            { name: "Player A1", runs: 28, balls: 14, isOut: false },
            { name: "Player A2", runs: 12, balls: 9, isOut: false },
          ],
          bowlers: [
            { name: "Player B1", overs: 2, maidens: 0, runsConceded: 20, wickets: 1 },
          ],
        },
      ],
      result: null,
    },
    {
      matchId: "seed-live-2",
      umpireToken: "fake-token-2",
      status: "live",
      teams: {
        teamA: { name: "Falcons" },
        teamB: { name: "Strikers" },
      },
      settings: {
        totalOvers: 10,
        totalWickets: 10,
        roofNetRule: true,
        lastBatsmanStanding: false,
      },
      toss: {
        winner: "teamB",
        decision: "bowl",
      },
      innings: [
        {
          battingTeam: "teamA",
          runs: 67,
          wickets: 4,
          overs: 6.2,
          balls: [],
          batsmen: [
            { name: "Player F1", runs: 30, balls: 18, isOut: true },
            { name: "Player F2", runs: 15, balls: 10, isOut: false },
          ],
          bowlers: [
            { name: "Player S1", overs: 3, maidens: 0, runsConceded: 25, wickets: 2 },
          ],
        },
      ],
      result: null,
    },
  ];

  const completedMatches = [
    {
      matchId: "seed-completed-1",
      umpireToken: "fake-token-3",
      status: "completed",
      teams: {
        teamA: { name: "Titans" },
        teamB: { name: "Strikers" },
      },
      settings: {
        totalOvers: 8,
        totalWickets: 8,
        roofNetRule: false,
        lastBatsmanStanding: false,
      },
      toss: {
        winner: "teamA",
        decision: "bat",
      },
      innings: [
        {
          battingTeam: "teamA",
          runs: 88,
          wickets: 6,
          overs: 8,
          balls: [],
          batsmen: [],
          bowlers: [],
        },
        {
          battingTeam: "teamB",
          runs: 84,
          wickets: 8,
          overs: 8,
          balls: [],
          batsmen: [],
          bowlers: [],
        },
      ],
      result: "Titans won by 4 runs",
    },
    {
      matchId: "seed-completed-2",
      umpireToken: "fake-token-4",
      status: "completed",
      teams: {
        teamA: { name: "Warriors" },
        teamB: { name: "Falcons" },
      },
      settings: {
        totalOvers: 10,
        totalWickets: 10,
        roofNetRule: false,
        lastBatsmanStanding: true,
      },
      toss: {
        winner: "teamB",
        decision: "bat",
      },
      innings: [
        {
          battingTeam: "teamB",
          runs: 95,
          wickets: 9,
          overs: 10,
          balls: [],
          batsmen: [],
          bowlers: [],
        },
        {
          battingTeam: "teamA",
          runs: 98,
          wickets: 5,
          overs: 9.3,
          balls: [],
          batsmen: [],
          bowlers: [],
        },
      ],
      result: "Warriors won by 5 wickets",
    },
  ];

  await Match.insertMany([...liveMatches, ...completedMatches]);

  console.log("✅ Seed data inserted successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});