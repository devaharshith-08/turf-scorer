# StumpLine🏏

A full-stack, real-time cricket live-scoring web app with three dedicated roles — **dashboard** (match management), **umpire** (live scoring), and **spectator** (live view) — built offline-first so a scorer never loses a ball, even on a patchy connection at the ground.



**[https://turf-scorer-rho.vercel.app/](#)** ·
**[https://github.com/devaharshith-08/turf-scorer](#)**

---

## Key Technical Differentiator

The scoring engine (`scoringLogic.js`) is a single, pure, framework-agnostic module with **zero React, Mongoose, or fetch dependencies**, and it runs identically on both sides of the network:

- **Client**: applies each tap to a deep-copied innings object for instant optimistic UI feedback.
- **Server**: runs the exact same function as the authoritative source of truth on save.

Because both sides call the same deterministic function, there's no drift between what the umpire sees immediately and what the server eventually confirms — no bespoke client-side prediction logic to keep in sync with a separate server implementation.

This is paired with an **offline-first sync layer**: every scoring action is written to `localStorage` first (tagged with a UUID `sequenceId`), shown instantly, and flushed to the server automatically once online — with the server deduping on `sequenceId` so a retried batch can never double-count a ball.

## Features

- **Three roles**, one Mongo document: a single `Match` document holds all match state, read differently by dashboard, umpire, and spectator views.
- **Real-time updates via Pusher used as a signal, not a data carrier** — the broadcast payload only tells clients "something changed"; the actual score always comes from a fresh MongoDB read, keeping payloads small and avoiding stale/partial state.
- **Offline-capable scoring** — taps queue locally, sync automatically on reconnect, and are deduplicated server-side via UUID.
- **Undo as full replay, not reverse-mutation** — undo pops the last ball and replays the entire remaining ball log through the same pure scoring function, eliminating an entire class of "undo left stats inconsistent" bugs.
- **Ball log as the single source of truth** — overs, scores, and player stats are all derived from the ball-by-ball log rather than stored independently, so they can never fall out of sync with each other.
- **Cricket-specific rule engine**: Free Hit detection and dismissal restrictions, bowler no-repeat-over rule (with graceful fallback for small rosters), decimal over notation.
- **Live chase calculator** and **full post-match scorecard** — batting/bowling stats, strike rate, economy, and dismissal text are all reconstructed on-demand from the ball log.
- **Resilience**: mid-innings page-refresh reconstruction of on-strike/non-strike/bowler from ball history, automatic sweep of abandoned matches after 30 minutes of inactivity, TTL-based auto-cleanup of completed matches.
- **Accessibility**: 48×48px+ touch targets, haptic feedback on every tap, `aria-label`s on all scoring controls, and color-plus-shape (not color-only) indicators on the over ribbon.

## Tech Stack

- **Framework**: Next.js (App Router, full-stack)
- **Database**: MongoDB + Mongoose
- **Real-time**: Pusher
- **Styling**: Tailwind CSS
- **Offline persistence**: `localStorage` with UUID-based deduplication

## Getting Started

```bash
git clone <repo-url>
cd turf
npm install
```

Create a `.env` file in the project root:

```env
MONGODB_URI=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

Run the dev server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Optionally seed sample live/completed matches for the dashboard:

```bash
node scripts/seed.js
```

## Architecture Overview

```
Umpire taps a run/wicket/extra
        │
        ▼
Client: applyBallToInnings() runs on a local copy → instant optimistic UI
        │
        ▼
Event queued in localStorage (UUID sequenceId) → offline-safe
        │
        ▼
POST /api/match/[id]/update
        │
        ▼
Server: applyBallToInnings() runs again → authoritative save to MongoDB
        │
        ▼
Pusher broadcasts a lightweight "something changed" signal
        │
        ▼
Spectator/Dashboard clients refetch full state from MongoDB
```

## Challenges & Solutions

**Problem**: On a page refresh mid-innings, the umpire's scoring console has no in-memory record of who's on strike, who's the non-striker, or who's bowling — that state only lived in React state, not the database.

**Solution**: `reconstructPlayingState()` rebuilds this from the ball log alone — walking backward through `innings.balls`, applying the same odd-runs strike-rotation rule used live, and cross-referencing `batsmen[].isOut` to find the two not-out batsmen. The one case this *can't* safely infer is what happens right after a wicket or a completed over, since the umpire's next choice (replacement batsman, next bowler, strike swap) isn't recorded anywhere yet — so instead of guessing, the app deliberately re-prompts the umpire via the same modals used live, trading a small bit of friction for correctness.

## Known Limitations

- `getCurrentOverBalls` is implemented twice with subtly different logic (`spectatorStats.js` and inline in `SpectatorView.jsx`) — a refactor candidate to share one implementation.
- `BowlerStatTable.jsx` reimplements economy-rate calculation rather than reusing the shared `getEconomy` utility from `spectatorStats.js`.


