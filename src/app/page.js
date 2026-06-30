import connectDb from "@/lib/dbConnect";
import Match from "@/models/Match";
import DashboardClient from "@/components/dashboard/DashboardClient";

// Any 'live' match with no ball scored in the last 30 minutes is treated
// as abandoned. Checked on every dashboard load (no cron available on
// Vercel) — cheap because it only touches matches that are actually
// stale, and reuses the existing 'completed' + TTL-delete pipeline.
const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

async function sweepAbandonedMatches() {
  const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS);

  await Match.updateMany(
    { status: "live", updatedAt: { $lt: cutoff } },
    {
      $set: {
        status: "completed",
        result: "Match Abandoned",
        completedAt: new Date(),
      },
    }
  );
}

export default async function HomePage() {
  await connectDb();

  await sweepAbandonedMatches();

  const liveMatches = await Match.find({ status: "live" }).lean();
  const completedMatches = await Match.find({ status: "completed" }).lean();

  const initialLiveMatches = JSON.parse(JSON.stringify(liveMatches));
  const initialCompletedMatches = JSON.parse(JSON.stringify(completedMatches));

  return (
    <DashboardClient
      initialLiveMatches={initialLiveMatches}
      initialCompletedMatches={initialCompletedMatches}
    />
  );
}