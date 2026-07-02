import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
        unique: true,
        index:true,
    },
    umpireToken: {
        type: String,
        required:true,
    },
    status: {
      type: String,
      enum: ['setup', 'live', 'completed'],
      required: true,
    },
    teams: {
      teamA: {
        name: { type: String, required: true },
        players: [{ type: String, required: true }],
      },
      teamB: {
        name: { type: String, required: true },
        players: [{ type: String, required: true }],
      },
    },
    settings: {
      totalOvers: { type: Number, required: true },
      totalWickets: { type: Number, required: true },
      lastBatsmanStanding: { type: Boolean, required: true },
    },
    toss: {
      winner: { type: String, enum: ['teamA', 'teamB'], required: true },
      decision: { type: String, enum: ['bat', 'bowl'], required: true },
    },
    innings: [
      {
        battingTeam: { type: String, required: true },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        overs: { type: Number, default: 0 },
        // BUGFIX (Bug 1): persisted strike state so spectator view / any
        // fresh client can read who's on strike without reconstructing
        // from ball history. Set on every ball in applyBallToInnings.
        onStrike: { type: String, default: null },
        nonStriker: { type: String, default: null },
        balls: [
          {
            sequenceId: { type: String, required: true },
            type: { type: String, enum:['run','wide','noball','legbye','bye','wicket'], required: true },
            runs: { type: Number, default: 0 },
            isWicket: { type: Boolean, default: false },
            isFreeHit: { type: Boolean, default: false },
            dismissal: { type: String, enum: ['bowled', 'caught', 'runout', null], default: '' },
            batsmanOnStrike: { type: String, required: true },
            // BUGFIX (Bug 1): non-striker recorded per-ball too, so Undo's
            // recomputeInningsFromBalls can correctly re-register both
            // batsmen when replaying ball history from scratch.
            nonStriker: { type: String, required: true },
            bowler: { type: String, required: true },
          },
        ],
        batsmen: [
          {
            name: { type: String, required: true },
            runs: { type: Number, default: 0 },
            balls: { type: Number, default: 0 },
            isOut: { type: Boolean, default: false },
          },
        ],
        bowlers: [
          {
            name: { type: String, required: true },
            overs: { type: Number, default: 0 },
            maidens: { type: Number, default: 0 },
            runsConceded: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
          },
        ],
      },
    ],
    result: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

},
    { timestamps: true }
);

MatchSchema.index({ completedAt: 1 }, { expireAfterSeconds: 129600 });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

export default Match;