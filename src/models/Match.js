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
        balls: [
          {
            sequenceId: { type: String, required: true },
            type: { type: String, enum:['run','wide','noball','legbye','bye','wicket'], required: true },
            runs: { type: Number, default: 0 },
            isWicket: { type: Boolean, default: false },
            isFreeHit: { type: Boolean, default: false },
            dismissal: { type: String, enum: ['bowled', 'caught', 'runout', null], default: '' },
            batsmanOnStrike: { type: String, required: true },
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
    // Set ONLY when status transitions to 'completed' (in the update route).
    // TTL index below tells MongoDB to auto-delete this document 36 hours
    // after completedAt is set. 'setup' and 'live' matches never have this
    // field set, so they are never touched by the TTL sweep.
    completedAt: {
      type: Date,
      default: null,
    },

},
    { timestamps: true }
);

// TTL index: MongoDB's background task (runs ~every 60s) deletes any
// document where completedAt is older than 36 hours (36 * 60 * 60 = 129600
// seconds). Documents where completedAt is null are never matched/deleted
// by this index — only docs that actually have a Date value there.
MatchSchema.index({ completedAt: 1 }, { expireAfterSeconds: 129600 });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

export default Match;