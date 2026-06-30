// src/app/api/match/[id]/route.js
//
// GET /api/match/[id] — PRD §5 API Spec.
// Returns the current full match state. No auth required (used by the
// Umpire Control Panel for its initial load + innings-transition polling).

import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';

export async function GET(request, { params }) {
  const { id: matchId } = await params;

  await dbConnect();

  const match = await Match.findOne({ matchId });

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  return Response.json({ match });
}