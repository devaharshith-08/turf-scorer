"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function PlayerListEditor({ teamLabel, players, setPlayers, error }) {
  function updatePlayer(index, value) {
    const next = [...players];
    next[index] = value;
    setPlayers(next);
  }

  function addPlayer() {
    setPlayers([...players, ""]);
  }

  function removePlayer(index) {
    const next = players.filter((_, i) => i !== index);
    setPlayers(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-neutral-400">
        {teamLabel} Players
      </label>

      {players.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Player ${index + 1}`}
            value={name}
            onChange={(e) => updatePlayer(index, e.target.value)}
            className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {players.length > 1 && (
            <button
              type="button"
              onClick={() => removePlayer(index)}
              className="text-neutral-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-lg"
              aria-label={`Remove player ${index + 1}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addPlayer}
        className="text-emerald-500 hover:text-emerald-400 text-sm font-medium"
      >
        + Add Player
      </button>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
    </div>
  );
}

export default function CreateMatchPage() {
  const router = useRouter();

  const [teamAName, setTeamAName] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState(["", ""]);

  const [teamBName, setTeamBName] = useState("");
  const [teamBPlayers, setTeamBPlayers] = useState(["", ""]);

  const [totalOvers, setTotalOvers] = useState(6);
  const [lastBatsmanStanding, setLastBatsmanStanding] = useState(true);

  const [tossWinner, setTossWinner] = useState("teamA");
  const [tossDecision, setTossDecision] = useState("bat");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [teamAError, setTeamAError] = useState("");
  const [teamBError, setTeamBError] = useState("");

  const displayNameA = teamAName.trim() === "" ? "Team 1" : teamAName.trim();
  const displayNameB = teamBName.trim() === "" ? "Team 2" : teamBName.trim();

  function validate() {
    let valid = true;
    setTeamAError("");
    setTeamBError("");
    setErrorMsg("");

    const cleanedA = teamAPlayers.map((p) => p.trim()).filter((p) => p !== "");
    const cleanedB = teamBPlayers.map((p) => p.trim()).filter((p) => p !== "");

    if (cleanedA.length < 2) {
      setTeamAError("Team A needs at least 2 players.");
      valid = false;
    }

    if (cleanedB.length < 2) {
      setTeamBError("Team B needs at least 2 players.");
      valid = false;
    }

    if (cleanedA.length >= 2 && cleanedB.length >= 2 && cleanedA.length !== cleanedB.length) {
      setErrorMsg("Both teams must have the same number of players.");
      valid = false;
    }

    if (!totalOvers || Number(totalOvers) < 1) {
      setErrorMsg("Total overs must be a positive number.");
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAName,
          teamAPlayers,
          teamBName,
          teamBPlayers,
          totalOvers,
          lastBatsmanStanding,
          tossWinner,
          tossDecision,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const { matchId, umpireToken } = data;

      localStorage.setItem(`umpireToken_${matchId}`, umpireToken);

      router.push(`/match/${matchId}/score`);
    } catch (err) {
      console.error("Match creation failed:", err);
      setErrorMsg("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-neutral-900 rounded-2xl p-6 space-y-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold">Quick Match Setup</h1>

        {/* Team A */}
        <div className="space-y-3 border-b border-neutral-800 pb-5">
          <div>
            <label className="block text-sm mb-1 text-neutral-400">
              Team A Name
            </label>
            <input
              type="text"
              placeholder="Team 1"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <PlayerListEditor
            teamLabel={displayNameA}
            players={teamAPlayers}
            setPlayers={setTeamAPlayers}
            error={teamAError}
          />
        </div>

        {/* Team B */}
        <div className="space-y-3 border-b border-neutral-800 pb-5">
          <div>
            <label className="block text-sm mb-1 text-neutral-400">
              Team B Name
            </label>
            <input
              type="text"
              placeholder="Team 2"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <PlayerListEditor
            teamLabel={displayNameB}
            players={teamBPlayers}
            setPlayers={setTeamBPlayers}
            error={teamBError}
          />
        </div>

        {/* Total Overs */}
        <div>
          <label className="block text-sm mb-1 text-neutral-400">
            Total Overs
          </label>
          <input
            type="number"
            min={1}
            value={totalOvers}
            onChange={(e) => setTotalOvers(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Last Batsman Standing */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lastBatsmanStanding}
            onChange={(e) => setLastBatsmanStanding(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Last Batsman Standing</span>
        </label>

        {/* Toss */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1 text-neutral-400">
              Toss Winner
            </label>
            <select
              value={tossWinner}
              onChange={(e) => setTossWinner(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2"
            >
              <option value="teamA">{displayNameA}</option>
              <option value="teamB">{displayNameB}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-400">
              Decision
            </label>
            <select
              value={tossDecision}
              onChange={(e) => setTossDecision(e.target.value)}
              className="w-full rounded-lg bg-neutral-800 px-3 py-2"
            >
              <option value="bat">Bat</option>
              <option value="bowl">Bowl</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {isSubmitting ? "Starting..." : "Start Match"}
        </button>
      </form>
    </main>
  );
}