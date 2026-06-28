// src/app/match/[matchId]/page.js
//
// Spectator Live View (PRD Page 4) — Server Component.
// Does the initial fetch of the match doc server-side (so there's no
// flash-of-empty-state on first load), then hands off to the client
// component (SpectatorView) which takes over with polling.
//
// DECISION (confirmed with project owner): this queries MongoDB directly
// via dbConnect + the Match model, rather than fetching its own
// /api/match/[id] route over HTTP. Reasons: single Next.js deployment
// (Vercel) for both pages and API, so no env-var/base-URL config needed,
// and one fewer network hop. See chat history for full tradeoff discussion.

import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import SpectatorView from '@/components/spectator/SpectatorView';

async function getMatch(matchId) {
  await dbConnect();

  const match = await Match.findOne({ matchId });

  if (!match) {
    return null;
  }

  // Mongoose documents are not plain serializable objects — Server
  // Components can only pass plain JSON-serializable data down to Client
  // Components, so this strips Mongoose's internal class/method wrapper
  // down to a plain object before handing it off.
  return JSON.parse(JSON.stringify(match));
}

export default async function SpectatorPage({ params }) {
  const { matchId } = await params;

  const match = await getMatch(matchId);

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Match Not Found</h1>
          <p className="mt-2 text-sm opacity-70">
            No match exists with ID &quot;{matchId}&quot;. Check the link and
            try again.
          </p>
        </div>
      </div>
    );
  }

  return <SpectatorView initialMatch={match} matchId={matchId} />;
}