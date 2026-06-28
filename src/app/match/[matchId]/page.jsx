import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import SpectatorView from '@/components/spectator/SpectatorView';

async function getMatch(matchId) {
  await dbConnect();

  const match = await Match.findOne({ matchId });

  if (!match) {
    return null;
  }

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
            No match exists with ID &quot;{matchId}&quot;. Check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  return <SpectatorView initialMatch={match} matchId={matchId} />;
}